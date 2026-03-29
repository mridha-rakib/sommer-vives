import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MessageCircle, User, Circle } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface Thread {
  booking_id: string;
  sender_name: string;
  last_message: string;
  last_at: string;
  unread: number;
}

interface ChatMsg {
  id: string;
  message: string;
  sender_type: string;
  sender_name: string | null;
  created_at: string | null;
}

export function AdminChatPanel() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Load all support threads
  useEffect(() => {
    const loadThreads = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('booking_id, sender_name, message, created_at, is_read, sender_type')
        .eq('thread_type', 'support')
        .order('created_at', { ascending: false });

      if (!data) return;

      const map = new Map<string, Thread>();
      for (const msg of data) {
        if (!msg.booking_id) continue;
        if (!map.has(msg.booking_id)) {
          map.set(msg.booking_id, {
            booking_id: msg.booking_id,
            sender_name: msg.sender_type !== 'admin' ? (msg.sender_name || 'Gæst') : (map.get(msg.booking_id)?.sender_name || 'Gæst'),
            last_message: msg.message,
            last_at: msg.created_at || '',
            unread: 0,
          });
        }
        const t = map.get(msg.booking_id)!;
        if (msg.sender_type !== 'admin' && msg.sender_name) {
          t.sender_name = msg.sender_name;
        }
        if (msg.sender_type !== 'admin' && !msg.is_read) {
          t.unread++;
        }
      }
      setThreads(Array.from(map.values()));
    };

    loadThreads();

    const channel = supabase
      .channel('admin-chat-all')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, () => { loadThreads(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Load messages for active thread
  useEffect(() => {
    if (!activeThread) return;

    const load = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('id, message, sender_type, sender_name, created_at')
        .eq('thread_type', 'support')
        .eq('booking_id', activeThread)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    load();

    const channel = supabase
      .channel(`admin-chat-${activeThread}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `booking_id=eq.${activeThread}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMsg]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeThread]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeThread || sending) return;
    setSending(true);
    await supabase.from('chat_messages').insert({
      booking_id: activeThread,
      thread_type: 'support',
      sender_type: 'admin',
      sender_id: user?.id || null,
      sender_name: 'SommerVibes Support',
      message: input.trim(),
    });
    setInput('');
    setSending(false);
  };

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[400px] border border-border rounded-xl overflow-hidden bg-card">
      {/* Thread list */}
      <div className="w-72 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-accent" />
            Support chats
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground text-center">Ingen aktive chats</div>
          )}
          {threads.map(t => (
            <button
              key={t.booking_id}
              onClick={() => setActiveThread(t.booking_id)}
              className={`w-full text-left p-4 border-b border-border hover:bg-muted/50 transition-colors ${
                activeThread === t.booking_id ? 'bg-muted/50' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{t.sender_name}</span>
                </div>
                {t.unread > 0 && (
                  <span className="w-5 h-5 bg-accent text-accent-foreground rounded-full text-xs flex items-center justify-center font-bold">
                    {t.unread}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{t.last_message}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {t.last_at ? new Date(t.last_at).toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {!activeThread ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            <div className="text-center">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p>Vælg en chat for at svare</p>
            </div>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => {
                const isAdmin = msg.sender_type === 'admin';
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                      isAdmin
                        ? 'bg-accent text-accent-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}>
                      {!isAdmin && msg.sender_name && (
                        <div className="text-xs font-semibold text-accent mb-1">{msg.sender_name}</div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      <div className={`text-[10px] mt-1 ${isAdmin ? 'text-accent-foreground/60' : 'text-muted-foreground'}`}>
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-border bg-background">
              <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Skriv svar..."
                  className="bg-card flex-1"
                  disabled={sending}
                />
                <Button type="submit" size="icon" variant="gold" disabled={!input.trim() || sending}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
