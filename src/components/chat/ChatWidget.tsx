import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  message: string;
  sender_type: string;
  sender_name: string | null;
  created_at: string | null;
  is_read: boolean | null;
}

function getSessionId() {
  let sid = localStorage.getItem('sv_chat_session');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('sv_chat_session', sid);
  }
  return sid;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [name, setName] = useState(() => localStorage.getItem('sv_chat_name') || '');
  const [nameSet, setNameSet] = useState(() => !!localStorage.getItem('sv_chat_name'));
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const sessionId = useRef(getSessionId());

  const bookingId = sessionId.current; // We use session_id as a pseudo booking_id for support threads

  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('id, message, sender_type, sender_name, created_at, is_read')
      .eq('thread_type', 'support')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });
    if (data) {
      setMessages(data);
      if (!open) {
        setUnread(data.filter(m => m.sender_type === 'admin' && !m.is_read).length);
      }
    }
  }, [bookingId, open]);

  useEffect(() => {
    if (open && nameSet) loadMessages();
  }, [open, nameSet, loadMessages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${bookingId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `booking_id=eq.${bookingId}`,
      }, (payload) => {
        const msg = payload.new as ChatMessage;
        setMessages(prev => [...prev, msg]);
        if (!open && msg.sender_type === 'admin') {
          setUnread(prev => prev + 1);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [bookingId, open]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const msg = input.trim();
    setInput('');

    await supabase.from('chat_messages').insert({
      booking_id: bookingId,
      thread_type: 'support',
      sender_type: user ? 'owner' : 'guest',
      sender_id: user?.id || null,
      sender_name: user?.email?.split('@')[0] || name,
      message: msg,
    });

    setSending(false);
  };

  const handleSetName = () => {
    if (name.trim()) {
      localStorage.setItem('sv_chat_name', name.trim());
      setNameSet(true);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setUnread(0);
  };

  const isWithinHours = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 10 && hour < 22;
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={handleOpen}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-elevated flex items-center justify-center hover:bg-gold-dark transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center font-bold">
                {unread}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-4rem)] rounded-2xl bg-card border border-border shadow-elevated flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-background border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">SommerVibes Support</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {isWithinHours() ? (
                      <span className="text-accent">Online nu • svar inden for minutter</span>
                    ) : (
                      <span>Offline • vi svarer kl. 10-22</span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            {!nameSet && !user ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">Hej! 👋</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Skriv dit navn, så hjælper vi dig videre.
                </p>
                <div className="w-full space-y-3">
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Dit navn"
                    onKeyDown={e => e.key === 'Enter' && handleSetName()}
                    className="bg-background"
                  />
                  <Button onClick={handleSetName} variant="gold" className="w-full" disabled={!name.trim()}>
                    Start chat
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      <p className="mb-1">Velkommen{name ? `, ${name}` : ''}!</p>
                      <p>Skriv en besked, så vender vi tilbage hurtigst muligt.</p>
                    </div>
                  )}
                  {messages.map(msg => {
                    const isMe = msg.sender_type !== 'admin';
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                          isMe
                            ? 'bg-accent text-accent-foreground rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md'
                        }`}>
                          {!isMe && msg.sender_name && (
                            <div className="text-xs font-semibold text-accent mb-1">{msg.sender_name}</div>
                          )}
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                          <div className={`text-[10px] mt-1 ${isMe ? 'text-accent-foreground/60' : 'text-muted-foreground'}`}>
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input */}
                <div className="p-3 border-t border-border bg-background">
                  <form
                    onSubmit={e => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                  >
                    <Input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="Skriv en besked..."
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
