import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Counts unread support threads (not individual messages) for the admin badge.
 * A thread is "unread" if it has at least one non-admin message with is_read = false.
 * Subscribes to realtime updates so the badge stays in sync.
 */
export function useUnreadMessages() {
  const [unreadThreads, setUnreadThreads] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('thread_id, sender_type, is_read')
        .eq('is_read', false)
        .neq('sender_type', 'admin')
        .limit(2000);

      if (cancelled) return;

      const threads = new Set<string>();
      (data || []).forEach((m: any) => {
        if (m.thread_id) threads.add(m.thread_id);
      });
      setUnreadThreads(threads.size);
    };

    load();

    const channel = supabase
      .channel('admin-unread-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => load())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return unreadThreads;
}
