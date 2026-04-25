import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Loader2, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from 'sonner';

export default function OwnerMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadMessages();
    const channel = supabase
      .channel(`owner-messages-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const m = payload.new as any;
        if (m.thread_type !== 'support') return;
        if (m.sender_id !== user.id && m.recipient_id !== user.id) return;
        setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        if (m.sender_type !== 'owner' && !m.is_read) {
          supabase.from('chat_messages').update({ is_read: true }).eq('id', m.id).then(() => {});
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, (payload) => {
        const m = payload.new as any;
        setMessages(prev => prev.map(x => (x.id === m.id ? { ...x, ...m } : x)));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_type', 'support')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: true })
      .limit(200);
    setMessages(data || []);
    setLoading(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    const unreadIds = (data || [])
      .filter((m: any) => m.sender_type !== 'owner' && !m.is_read)
      .map((m: any) => m.id);
    if (unreadIds.length > 0) {
      supabase.from('chat_messages').update({ is_read: true }).in('id', unreadIds).then(() => {});
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from('chat_messages').insert({
      thread_type: 'support',
      sender_id: user.id,
      sender_name: user.user_metadata?.full_name || user.email,
      sender_type: 'owner',
      message: newMessage.trim(),
    });
    setSending(false);
    if (error) { toast.error('Beskeden kunne ikke sendes'); return; }
    setNewMessage('');
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
            <h1 className="font-display text-xl font-bold text-foreground">Dit SommerVibes-team</h1>
            <p className="text-xs text-muted-foreground">Direkte dialog — vi kender dit hus og dine behov</p>
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
                  <p className="text-sm text-foreground font-medium mb-1">Velkommen til din indbakke</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Skriv en besked — dit dedikerede team svarer typisk inden for få timer
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
                          {format(new Date(msg.created_at), 'HH:mm', { locale: da })}
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
                  placeholder="Skriv en besked til dit team..."
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
