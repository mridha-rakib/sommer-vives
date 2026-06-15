import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Clock, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatAttachment } from '@/components/chat/ChatAttachment';
import { notifyChatPush, uploadChatAttachment } from '@/lib/chatAttachments';
import { useChatTyping } from '@/hooks/useChatTyping';
import { useTranslation } from '@/lib/i18n';
import { markSupportRepliesRead } from '@/lib/chat-read-api';

interface ChatMessage {
  id: string;
  message: string;
  sender_type: string;
  sender_name: string | null;
  created_at: string | null;
  is_read: boolean | null;
  sender_id: string | null;
  recipient_id: string | null;
  thread_id: string | null;
  thread_type: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
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
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState(() => localStorage.getItem('sv_chat_name') || '');
  const [nameSet, setNameSet] = useState(() => !!localStorage.getItem('sv_chat_name'));
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const sessionId = useRef(getSessionId());
  const locale = language === 'da' ? 'da-DK' : language === 'de' ? 'de-DE' : language === 'nl' ? 'nl-NL' : 'en-US';

  const participantId = user?.id || sessionId.current;
  const typingChannel = messages[0]?.thread_id || `user-${participantId}`;
  const { signalTyping, typingLabel } = useChatTyping({
    channelKey: typingChannel,
    selfKey: participantId,
    selfName: user?.email?.split('@')[0] || name || t('chat.guestName'),
    selfRole: user ? 'owner' : 'guest',
  });

  const markRepliesRead = useCallback(() => {
    setUnread(0);
    setMessages(prev => prev.map(message => (
      message.sender_type === 'admin' && message.recipient_id === participantId && !message.is_read
        ? { ...message, is_read: true }
        : message
    )));
    markSupportRepliesRead(participantId).catch(() => {});
  }, [participantId]);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('id, message, sender_type, sender_id, sender_name, recipient_id, thread_id, thread_type, created_at, is_read, attachment_url, attachment_name, attachment_type, attachment_size')
      .eq('thread_type', 'support')
      .or(`sender_id.eq.${participantId},recipient_id.eq.${participantId}`)
      .order('created_at', { ascending: true });
    if (data) {
      setMessages(data);
      if (open) {
        markRepliesRead();
      } else {
        setUnread(data.filter(m => m.sender_type === 'admin' && !m.is_read).length);
      }
    }
  }, [markRepliesRead, participantId, open]);

  useEffect(() => {
    if (nameSet || user) loadMessages();
  }, [open, nameSet, user, loadMessages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${participantId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, (payload) => {
        const msg = payload.new as ChatMessage;
        if (msg.thread_type !== 'support') return;
        if (msg.sender_id !== participantId && msg.recipient_id !== participantId) return;
        setMessages(prev => prev.some(existing => existing.id === msg.id) ? prev : [...prev, msg]);
        if (open && msg.sender_type === 'admin') {
          markRepliesRead();
        } else if (!open && msg.sender_type === 'admin') {
          setUnread(prev => prev + 1);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
      }, (payload) => {
        const msg = payload.new as ChatMessage;
        if (msg.thread_type !== 'support') return;
        if (msg.sender_id !== participantId && msg.recipient_id !== participantId) return;
        setMessages(prev => prev.map(existing => existing.id === msg.id ? { ...existing, ...msg } : existing));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [markRepliesRead, participantId, open]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && !file) || sending) return;
    setSending(true);
    const msg = input.trim();
    setInput('');
    try {
      const attachment = file ? await uploadChatAttachment(file, `widget-${participantId}`) : {};
      const { data, error } = await supabase.from('chat_messages').insert({
        thread_type: 'support',
        sender_type: user ? 'owner' : 'guest',
        sender_id: participantId,
        sender_name: user?.email?.split('@')[0] || name,
        message: msg,
        ...attachment,
      }).select('id, message, sender_type, sender_id, sender_name, recipient_id, thread_id, thread_type, created_at, is_read, attachment_url, attachment_name, attachment_type, attachment_size').single();
      if (error) throw error;
      if (data) {
        setMessages(prev => prev.some(existing => existing.id === data.id) ? prev : [...prev, data]);
      }
      setFile(null);
      notifyChatPush(data?.id);
    } catch {
      setInput(msg);
    }

    setSending(false);
  };

  const handleSetName = () => {
    if (name.trim()) {
      localStorage.setItem('sv_chat_name', name.trim());
      setNameSet(true);
      loadMessages();
    }
  };

  const handleOpen = () => {
    setOpen(true);
    markRepliesRead();
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
                      <span className="text-accent">{t('chat.online')}</span>
                    ) : (
                      <span>{t('chat.offline')}</span>
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
                <h3 className="font-display text-lg font-semibold text-foreground">{t('chat.greeting')}</h3>
                <p className="text-sm text-muted-foreground text-center">
                  {t('chat.namePrompt')}
                </p>
                <div className="w-full space-y-3">
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={t('chat.namePlaceholder')}
                    onKeyDown={e => e.key === 'Enter' && handleSetName()}
                    className="bg-background"
                  />
                  <Button onClick={handleSetName} variant="gold" className="w-full" disabled={!name.trim()}>
                    {t('chat.start')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      <p className="mb-1">{t('chat.welcome').replace('{name}', name ? `, ${name}` : '')}</p>
                      <p>{t('chat.empty')}</p>
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
                          {msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}
                          <ChatAttachment
                            url={msg.attachment_url}
                            name={msg.attachment_name}
                            size={msg.attachment_size}
                            isOwn={isMe}
                          />
                          <div className={`text-[10px] mt-1 ${isMe ? 'text-accent-foreground/60' : 'text-muted-foreground'}`}>
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input */}
                <div className="p-3 border-t border-border bg-background">
                  {typingLabel && (
                    <p className="text-[11px] text-muted-foreground mb-2">{t('chat.typing').replace('{name}', typingLabel)}</p>
                  )}
                  {file && (
                    <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                      <span className="truncate">{file.name}</span>
                      <button type="button" onClick={() => setFile(null)} className="shrink-0 hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <form
                    onSubmit={e => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending}
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Input
                      value={input}
                      onChange={e => { setInput(e.target.value); signalTyping(); }}
                      placeholder={t('chat.messagePlaceholder')}
                      className="bg-card flex-1"
                      disabled={sending}
                    />
                    <Button type="submit" size="icon" variant="gold" disabled={(!input.trim() && !file) || sending}>
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
