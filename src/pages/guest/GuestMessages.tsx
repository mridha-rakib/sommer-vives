import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GuestMessages() {
  const { user, signOut } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadMessages();
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    if (!user) return;
    const [{ data: own }, { data: admin }] = await Promise.all([
      supabase.from('chat_messages').select('*').eq('thread_type', 'support').eq('sender_id', user.id).order('created_at', { ascending: true }).limit(100),
      supabase.from('chat_messages').select('*').eq('thread_type', 'support').eq('sender_type', 'admin').order('created_at', { ascending: true }).limit(100),
    ]);
    const all = [...(own || []), ...(admin || [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setMessages(Array.from(new Map(all.map(m => [m.id, m])).values()));
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !user) return;
    setSending(true);
    await supabase.from('chat_messages').insert({
      message: newMsg.trim(), sender_type: 'guest', sender_id: user.id,
      sender_name: user.user_metadata?.full_name || user.email, thread_type: 'support',
    });
    setNewMsg('');
    await loadMessages();
    setSending(false);
  };

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="flex flex-col h-[calc(100vh-12rem)]">
        <div className="mb-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Beskeder</h1>
          <p className="text-sm text-muted-foreground mt-1">Chat direkte med SommerVibes</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <MessageCircle className="w-10 h-10 text-muted-foreground/15 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Start en samtale med os</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Vi svarer typisk inden for et par timer</p>
            </div>
          )}
          {messages.map(msg => {
            const isOwn = msg.sender_type === 'guest';
            return (
              <div key={msg.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2.5',
                  isOwn ? 'bg-accent text-accent-foreground rounded-br-md' : 'bg-muted/40 border border-border/40 text-foreground rounded-bl-md'
                )}>
                  <p className="text-sm">{msg.message}</p>
                  <div className={cn('text-[10px] mt-1', isOwn ? 'text-accent-foreground/60' : 'text-muted-foreground')}>
                    {new Date(msg.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2">
          <Input
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            placeholder="Skriv en besked..."
            className="flex-1 rounded-xl border-border/40"
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <Button onClick={sendMessage} disabled={sending || !newMsg.trim()} variant="gold" size="icon" className="rounded-xl">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </GuestLayout>
  );
}
