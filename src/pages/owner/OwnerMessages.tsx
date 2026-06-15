import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Loader2, Crown, Paperclip, X } from 'lucide-react';
import { format } from 'date-fns';
import { da, de, enUS, nl } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  getOwnerMessages,
  isOwnerSupportMessage,
  isUnreadForOwner,
  markOwnerThreadRead,
  sendOwnerMessage,
  subscribeOwnerMessages,
  type OwnerMessage,
} from '@/lib/owner-messages-api';
import { useTranslation } from '@/lib/i18n';
import { ChatAttachment } from '@/components/chat/ChatAttachment';
import { notifyChatPush, uploadChatAttachment } from '@/lib/chatAttachments';
import { useChatTyping } from '@/hooks/useChatTyping';

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : null;
}

export default function OwnerMessages() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [messages, setMessages] = useState<OwnerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateLocale = { da, en: enUS, de, nl }[language];
  const { signalTyping, typingLabel } = useChatTyping({
    channelKey: messages[0]?.thread_id || (user ? `user-${user.id}` : null),
    selfKey: user?.id,
    selfName: user?.user_metadata?.full_name || user?.email || 'Ejer',
    selfRole: 'owner',
  });

  useEffect(() => {
    if (!user) return;
    loadMessages();

    return subscribeOwnerMessages(user.id, {
      onInsert: (message) => {
        if (!isOwnerSupportMessage(message, user.id)) return;
        setMessages(prev => prev.some(x => x.id === message.id) ? prev : [...prev, message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        if (isUnreadForOwner(message)) {
          markOwnerThreadRead(user.id).catch(() => {});
        }
      },
      onUpdate: (message) => {
        if (!isOwnerSupportMessage(message, user.id)) return;
        setMessages(prev => prev.map(x => (x.id === message.id ? { ...x, ...message } : x)));
      },
    });
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getOwnerMessages(user.id);
      setMessages(data);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      const unreadIds = data.filter(isUnreadForOwner).map((message) => message.id);
      if (unreadIds.length > 0) markOwnerThreadRead(user.id).catch(() => {});
    } catch (err: unknown) {
      toast.error(errorMessage(err) || t('owner.messages.toast.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !newFile) || !user) return;
    setSending(true);
    try {
      const attachment = newFile ? await uploadChatAttachment(newFile, `owner-${user.id}`) : null;
      const data = await sendOwnerMessage({
        ownerId: user.id,
        senderName: user.user_metadata?.full_name || user.email,
        message: newMessage,
        attachment,
      });
      if (data) {
        setMessages(prev => prev.some(message => message.id === data.id) ? prev : [...prev, data]);
      }
      notifyChatPush(data?.id);
      setNewMessage('');
      setNewFile(null);
    } catch (err: unknown) {
      toast.error(errorMessage(err) || t('owner.messages.toast.sendError'));
    } finally {
      setSending(false);
    }
  };

  return (
    <OwnerLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--gold)/0.12)] flex items-center justify-center">
            <Crown className="w-5 h-5 text-[hsl(var(--gold-light))]" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">{t('owner.messages.title')}</h1>
            <p className="text-xs text-muted-foreground">{t('owner.messages.subtitle')}</p>
          </div>
        </div>

        {/* Chat area */}
        <Card className="min-h-[500px] flex flex-col overflow-hidden">
          <CardContent className="flex-1 p-0 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 max-h-[500px]">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--gold)/0.08)] flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-6 h-6 text-[hsl(var(--gold-light))]" />
                  </div>
                  <p className="text-sm text-foreground font-medium mb-1">{t('owner.messages.emptyTitle')}</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    {t('owner.messages.emptyDescription')}
                  </p>
                </div>
              ) : (
                messages.map(msg => {
                  const isOwner = msg.sender_type === 'owner';
                  return (
                    <div key={msg.id} className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3.5 rounded-2xl ${
                        isOwner
                          ? 'bg-[hsl(var(--gold)/0.15)] text-foreground rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      }`}>
                        {!isOwner && (
                          <div className="text-[10px] font-semibold mb-0.5 text-[hsl(var(--gold-light))]">
                            SommerVibes
                          </div>
                        )}
                        {msg.message && <p className="text-sm leading-relaxed">{msg.message}</p>}
                        <ChatAttachment
                          url={msg.attachment_url}
                          name={msg.attachment_name}
                          size={msg.attachment_size}
                          isOwn={isOwner}
                        />
                        <div className="text-[10px] mt-1.5 text-muted-foreground">
                          {msg.created_at ? format(new Date(msg.created_at), 'HH:mm', { locale: dateLocale }) : ''}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/40 bg-muted/5">
              {typingLabel && (
                <p className="text-[11px] text-muted-foreground mb-2">{typingLabel} skriver...</p>
              )}
              {newFile && (
                <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  <span className="truncate">{newFile.name}</span>
                  <button type="button" onClick={() => setNewFile(null)} className="shrink-0 hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={e => setNewFile(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 rounded-xl"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={e => { setNewMessage(e.target.value); signalTyping(); }}
                  placeholder={t('owner.messages.inputPlaceholder')}
                  className="flex-1 rounded-xl bg-card"
                  disabled={sending}
                />
                <Button type="submit" disabled={(!newMessage.trim() && !newFile) || sending} size="icon" className="shrink-0 rounded-xl bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold-dark))] text-background">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
