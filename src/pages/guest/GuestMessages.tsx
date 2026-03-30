import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Bell, ChevronRight } from 'lucide-react';

export default function GuestMessages() {
  const { user, signOut } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [activeThread, setActiveThread] = useState<'support' | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeThread) loadMessages();
  }, [activeThread, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_type', 'support')
      .eq('sender_id', user.id)
      .order('created_at', { ascending: true })
      .limit(100);
    // Also get admin replies
    const { data: adminMsgs } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_type', 'support')
      .eq('sender_type', 'admin')
      .order('created_at', { ascending: true })
      .limit(100);
    const all = [...(data || []), ...(adminMsgs || [])].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    // Deduplicate by id
    const unique = Array.from(new Map(all.map(m => [m.id, m])).values());
    setMessages(unique);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !user) return;
    setSending(true);
    await supabase.from('chat_messages').insert({
      message: newMsg.trim(),
      sender_type: 'guest',
      sender_id: user.id,
      sender_name: user.user_metadata?.full_name || user.email,
      thread_type: 'support',
    });
    setNewMsg('');
    await loadMessages();
    setSending(false);
  };

  if (activeThread === 'support') {
    return (
      <GuestLayout guestEmail={user?.email} onLogout={signOut}>
        <div className="flex flex-col h-[calc(100vh-12rem)]">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setActiveThread(null)} className="text-xs text-accent hover:underline">← Tilbage</button>
            <h1 className="font-display text-lg font-bold text-foreground">SommerVibes Support</h1>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <MessageCircle className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Start en samtale med os</p>
              </div>
            )}
            {messages.map(msg => {
              const isOwn = msg.sender_type === 'guest';
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isOwn ? 'bg-accent text-accent-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
                    <p className="text-sm">{msg.message}</p>
                    <div className={`text-[10px] mt-1 ${isOwn ? 'text-accent-foreground/60' : 'text-muted-foreground'}`}>
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
              className="flex-1"
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage} disabled={sending || !newMsg.trim()} variant="gold" size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </GuestLayout>
    );
  }

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Beskeder</h1>
          <p className="text-sm text-muted-foreground mt-1">Kommunikation om dit ophold</p>
        </div>

        <button onClick={() => setActiveThread('support')} className="w-full text-left">
          <Card className="hover:border-accent/20 transition-all hover:shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">SommerVibes Support</div>
                <div className="text-xs text-muted-foreground">Direkte kontakt med dit support-team</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </button>

        <Card className="hover:border-accent/20 transition-colors">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">Opdateringer</div>
              <div className="text-xs text-muted-foreground">Automatiske beskeder om dit ophold</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </GuestLayout>
  );
}
