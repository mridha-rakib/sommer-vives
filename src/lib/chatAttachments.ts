import { supabase } from '@/integrations/supabase/client';

export interface ChatAttachmentInput {
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachment_size?: number | null;
}

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

const allowedTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

function cleanFileName(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'attachment';
}

export function validateChatAttachment(file: File) {
  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error('Filen må højst være 10 MB');
  }
  if (file.type && !allowedTypes.has(file.type)) {
    throw new Error('Filtypen understøttes ikke');
  }
}

export function formatAttachmentSize(size: number | null | undefined) {
  if (!size) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export async function uploadChatAttachment(file: File, scope: string): Promise<ChatAttachmentInput> {
  validateChatAttachment(file);
  const safeScope = cleanFileName(scope);
  const safeName = cleanFileName(file.name);
  const path = `${safeScope}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage
    .from('chat-attachments')
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type || undefined });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('chat-attachments').getPublicUrl(path);
  return {
    attachment_url: data.publicUrl,
    attachment_name: file.name,
    attachment_type: file.type || null,
    attachment_size: file.size,
  };
}

export function notifyChatPush(messageId: string | undefined) {
  if (!messageId) return;
  supabase.functions.invoke('send-chat-push', { body: { messageId } }).catch(() => {});
}
