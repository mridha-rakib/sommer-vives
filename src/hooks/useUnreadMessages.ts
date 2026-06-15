import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Counts unread support THREADS (not messages) for the admin badge.
 *
 * Uses a SECURITY DEFINER RPC `count_unread_admin_threads` that runs an
 * aggregate `COUNT(DISTINCT thread_id)` directly in Postgres. This avoids:
 *   - Over-counting from join duplication
 *   - Truncation from PostgREST row limits (default 1000)
 *   - Client-side de-duplication drift between sessions
 *
 * Realtime subscription throttles refreshes so a burst of inserts/updates
 * results in a single re-count.
 */
export function useUnreadMessages() {
  const [unreadThreads, setUnreadThreads] = useState(0);
  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase.rpc('count_unread_admin_threads');
      if (cancelled) return;

      if (error) {
        // Fallback: fetch distinct thread_ids client-side (capped) so the badge
        // still works if the RPC ever fails.
        const { data: rows } = await supabase
          .from('chat_messages')
          .select('thread_id')
          .eq('thread_type', 'support')
          .eq('is_read', false)
          .neq('sender_type', 'admin')
          .not('thread_id', 'is', null)
          .limit(5000);
        const set = new Set<string>();
        (rows || []).forEach((r: { thread_id: string | null }) => r.thread_id && set.add(r.thread_id));
        setUnreadThreads(set.size);
        return;
      }

      setUnreadThreads(typeof data === 'number' ? data : 0);
    };

    const scheduleRefresh = () => {
      if (refreshTimerRef.current) return;
      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null;
        load();
      }, 400);
    };

    load();
    const reconcile = () => load();

    const channel = supabase
      .channel('admin-unread-badge')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        scheduleRefresh
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') reconcile();
      });

    window.addEventListener('online', reconcile);
    window.addEventListener('focus', reconcile);
    document.addEventListener('visibilitychange', reconcile);

    return () => {
      cancelled = true;
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      window.removeEventListener('online', reconcile);
      window.removeEventListener('focus', reconcile);
      document.removeEventListener('visibilitychange', reconcile);
      supabase.removeChannel(channel);
    };
  }, []);

  return unreadThreads;
}
