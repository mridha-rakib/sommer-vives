/**
 * Per-user unread message count for owner / guest portals.
 *
 * The "thread" for a non-admin user is simply their own support conversation.
 * We count messages where:
 *   - thread_type = 'support'
 *   - is_read = false
 *   - sender_type != 'admin'  → no, we want the opposite: messages NOT sent by us
 *   - recipient_id = user.id  OR  (sender_id != user.id AND it's part of their thread)
 *
 * Practically: unread messages addressed to me, regardless of sender role.
 *
 * Subscribes to realtime so the badge updates instantly.
 *
 * The `onIncoming` callback is invoked with the new message whenever a
 * realtime INSERT addressed to the user arrives — perfect place to play
 * a notification sound at the layout level.
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface IncomingMessage {
  id: string;
  message: string;
  sender_type: string;
  sender_name: string | null;
  sender_id: string | null;
  recipient_id: string | null;
  thread_id: string | null;
  thread_type: string | null;
  created_at: string;
  is_read: boolean | null;
}

interface Options {
  /** Called when a new message addressed to the user arrives via realtime. */
  onIncoming?: (msg: IncomingMessage) => void;
}

export function useUserUnreadMessages(userId: string | null | undefined, opts: Options = {}) {
  const [count, setCount] = useState(0);
  const onIncomingRef = useRef(opts.onIncoming);
  onIncomingRef.current = opts.onIncoming;

  useEffect(() => {
    if (!userId) { setCount(0); return; }
    let cancelled = false;

    const load = async () => {
      const { count: c } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('thread_type', 'support')
        .eq('is_read', false)
        .neq('sender_id', userId)
        .eq('recipient_id', userId);
      if (!cancelled) setCount(c || 0);
    };

    load();

    const channel = supabase
      .channel(`user-unread-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const m = payload.new as IncomingMessage;
          if (m.thread_type !== 'support') return;
          if (m.recipient_id !== userId) return;
          if (m.sender_id === userId) return;
          if (m.is_read) return;
          setCount(c => c + 1);
          onIncomingRef.current?.(m);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_messages' },
        () => load()
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_messages' },
        () => load()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return count;
}
