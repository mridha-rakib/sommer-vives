import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Loader2, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { da, de, enUS, nl } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  getOwnerMessages,
  isOwnerSupportMessage,
  isUnreadForOwner,
  markOwnerMessageRead,
  markOwnerMessagesRead,
  sendOwnerMessage,
  subscribeOwnerMessages,
  type OwnerMessage,
} from '@/lib/owner-messages-api';
import { useTranslation } from '@/lib/i18n';

export default function OwnerMessages() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [messages, setMessages] = useState<OwnerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dateLocale = { da, en: enUS, de, nl }[language];

  useEffect(() => {
    if (!user) return;
    loadMessages();

    return subscribeOwnerMessages(user.id, {
      onInsert: (message) => {
        if (!isOwnerSupportMessage(message, user.id)) return;
        setMessages(prev => prev.some(x => x.id === message.id) ? prev : [...prev, message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        if (isUnreadForOwner(message)) {
          markOwnerMessageRead(message.id).catch(() => {});
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
      markOwnerMessagesRead(unreadIds).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || t('owner.messages.toast.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    try {
      await sendOwnerMessage({
        ownerId: user.id,
        senderName: user.user_metadata?.full_name || user.email,
        message: newMessage,
      });
      setNewMessage('');
    } catch (err: any) {
      toast.error(err.message || t('owner.messages.toast.sendError'));
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
                        <p className="text-sm leading-relaxed">{msg.message}</p>
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
              <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={t('owner.messages.inputPlaceholder')}
                  className="flex-1 rounded-xl bg-card"
                  disabled={sending}
                />
                <Button type="submit" disabled={!newMessage.trim() || sending} size="icon" className="shrink-0 rounded-xl bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold-dark))] text-background">
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
