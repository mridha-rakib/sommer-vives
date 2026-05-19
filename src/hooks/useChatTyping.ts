import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TypingPayload {
  key: string;
  name: string;
  role: string;
  typing: boolean;
}

interface UseChatTypingInput {
  channelKey: string | null | undefined;
  selfKey: string | null | undefined;
  selfName: string;
  selfRole: string;
}

export function useChatTyping({ channelKey, selfKey, selfName, selfRole }: UseChatTypingInput) {
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const localTimerRef = useRef<number | null>(null);
  const remoteTimersRef = useRef<Map<string, number>>(new Map());

  const clearRemote = useCallback((key: string) => {
    const timer = remoteTimersRef.current.get(key);
    if (timer) window.clearTimeout(timer);
    remoteTimersRef.current.delete(key);
    setTypingNames(prev => prev.filter(name => name !== key));
  }, []);

  const broadcastTyping = useCallback((typing: boolean) => {
    if (!channelRef.current || !selfKey) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { key: selfKey, name: selfName, role: selfRole, typing } satisfies TypingPayload,
    });
  }, [selfKey, selfName, selfRole]);

  const signalTyping = useCallback(() => {
    broadcastTyping(true);
    if (localTimerRef.current) window.clearTimeout(localTimerRef.current);
    localTimerRef.current = window.setTimeout(() => {
      localTimerRef.current = null;
      broadcastTyping(false);
    }, 1800);
  }, [broadcastTyping]);

  useEffect(() => {
    if (!channelKey || !selfKey) {
      setTypingNames([]);
      return;
    }

    const remoteTimers = remoteTimersRef.current;
    const channel = supabase
      .channel(`chat-typing-${channelKey}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const data = payload as TypingPayload;
        if (!data?.key || data.key === selfKey) return;
        const label = data.name || data.role || 'Modparten';
        const identity = `${data.key}:${label}`;

        const existing = remoteTimersRef.current.get(identity);
        if (existing) window.clearTimeout(existing);

        if (!data.typing) {
          clearRemote(identity);
          return;
        }

        setTypingNames(prev => prev.includes(identity) ? prev : [...prev, identity]);
        const timer = window.setTimeout(() => clearRemote(identity), 2500);
        remoteTimersRef.current.set(identity, timer);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      broadcastTyping(false);
      if (localTimerRef.current) {
        window.clearTimeout(localTimerRef.current);
        localTimerRef.current = null;
      }
      remoteTimers.forEach(timer => window.clearTimeout(timer));
      remoteTimers.clear();
      setTypingNames([]);
      supabase.removeChannel(channel);
      if (channelRef.current === channel) channelRef.current = null;
    };
  }, [broadcastTyping, channelKey, clearRemote, selfKey]);

  return {
    signalTyping,
    typingLabel: typingNames.length > 0
      ? typingNames.map(item => item.split(':').slice(1).join(':')).join(', ')
      : '',
  };
}
