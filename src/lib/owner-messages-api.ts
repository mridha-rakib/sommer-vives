import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { ChatAttachmentInput } from '@/lib/chatAttachments';
import { markSupportRepliesRead } from '@/lib/chat-read-api';

export type OwnerMessage = Database['public']['Tables']['chat_messages']['Row'];

interface SendOwnerMessageInput {
  ownerId: string;
  senderName?: string | null;
  message: string;
  attachment?: ChatAttachmentInput | null;
}

interface SubscribeOwnerMessagesHandlers {
  onInsert: (message: OwnerMessage) => void;
  onUpdate: (message: OwnerMessage) => void;
}

export function isOwnerSupportMessage(message: OwnerMessage, ownerId: string) {
  return message.thread_type === 'support'
    && (message.sender_id === ownerId || message.recipient_id === ownerId);
}

export function isUnreadForOwner(message: OwnerMessage) {
  return message.sender_type !== 'owner' && !message.is_read;
}

export async function getOwnerMessages(ownerId: string): Promise<OwnerMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('thread_type', 'support')
    .or(`sender_id.eq.${ownerId},recipient_id.eq.${ownerId}`)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function markOwnerThreadRead(ownerId: string) {
  return markSupportRepliesRead(ownerId);
}

export async function sendOwnerMessage(input: SendOwnerMessageInput) {
  const { data, error } = await supabase.from('chat_messages').insert({
    thread_type: 'support',
    sender_id: input.ownerId,
    sender_name: input.senderName || null,
    sender_type: 'owner',
    message: input.message.trim(),
    ...(input.attachment || {}),
  }).select('*').single();

  if (error) throw new Error(error.message);
  return data;
}

export function subscribeOwnerMessages(ownerId: string, handlers: SubscribeOwnerMessagesHandlers) {
  const channel = supabase
    .channel(`owner-messages-${ownerId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
      handlers.onInsert(payload.new as OwnerMessage);
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, (payload) => {
      handlers.onUpdate(payload.new as OwnerMessage);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
