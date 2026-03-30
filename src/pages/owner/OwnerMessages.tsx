import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Bell, Users, Wrench, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from 'sonner';

type ThreadType = 'support' | 'booking' | 'system';

const threadTabs = [
  { type: 'support' as ThreadType, icon: MessageCircle, label: 'SommerVibes', desc: 'Direkte dialog med dit team' },
  { type: 'booking' as ThreadType, icon: Users, label: 'Gæstebeskeder', desc: 'Booking-relateret kommunikation' },
  { type: 'system' as ThreadType, icon: Bell, label: 'Systemnotifikationer', desc: 'Automatiske opdateringer' },
];

export default function OwnerMessages() {
  const { user } = useAuth();
  const [activeThread, setActiveThread] = useState<ThreadType>('support');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadMessages();
  }, [user, activeThread]);

  const loadMessages = async () => {
    if (!user) return;
    setLoading(true);

    if (activeThread === 'system') {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setNotifications(data || []);
      setMessages([]);
    } else {
      const query = supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_type', activeThread)
        .order('created_at', { ascending: true })
        .limit(100);

      if (activeThread === 'support') {
        query.eq('sender_id', user.id);
      }

      const { data } = await query;
      setMessages(data || []);
      setNotifications([]);
    }
    setLoading(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from('chat_messages').insert({
      thread_type: activeThread,
      sender_id: user.id,
      sender_name: user.email,
      sender_type: 'owner',
      message: newMessage.trim(),
    });
    setSending(false);
    if (error) { toast.error('Beskeden kunne ikke sendes'); return; }
    setNewMessage('');
    loadMessages();
  };

  const unreadNotifs = notifications.filter(n => !n.is_read).length;

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Beskeder</h1>
          <p className="text-sm text-muted-foreground mt-1">Al din kommunikation samlet ét sted</p>
        </div>

        {/* Thread selector */}
        <div className="grid md:grid-cols-3 gap-3">
          {threadTabs.map(tab => (
            <Card
              key={tab.type}
              className={`cursor-pointer transition-all ${activeThread === tab.type ? 'border-accent bg-accent/5' : 'hover:border-accent/20'}`}
              onClick={() => setActiveThread(tab.type)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${activeThread === tab.type ? 'bg-accent/15' : 'bg-muted'}`}>
                  <tab.icon className={`w-5 h-5 ${activeThread === tab.type ? 'text-accent' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{tab.label}</div>
                  <div className="text-[11px] text-muted-foreground">{tab.desc}</div>
                </div>
                {tab.type === 'system' && unreadNotifs > 0 && (
                  <div className="w-5 h-5 rounded-full bg-accent text-background text-[10px] font-bold flex items-center justify-center shrink-0">
                    {unreadNotifs}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Messages area */}
        <Card className="min-h-[400px] flex flex-col">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base">
              {threadTabs.find(t => t.type === activeThread)?.label}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col">
            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[500px]">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : activeThread === 'system' ? (
                notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Ingen notifikationer</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-3 rounded-lg ${n.is_read ? 'bg-muted/20' : 'bg-accent/5 border border-accent/10'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{n.title}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(n.created_at), 'd. MMM HH:mm', { locale: da })}
                        </span>
                      </div>
                      {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                    </div>
                  ))
                )
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Ingen beskeder endnu</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">Skriv en besked for at starte samtalen</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isOwner = msg.sender_type === 'owner';
                  return (
                    <div key={msg.id} className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl ${
                        isOwner
                          ? 'bg-accent text-accent-foreground rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      }`}>
                        {!isOwner && (
                          <div className="text-[10px] font-medium mb-0.5 opacity-70">
                            {msg.sender_name || 'SommerVibes'}
                          </div>
                        )}
                        <p className="text-sm">{msg.message}</p>
                        <div className={`text-[10px] mt-1 ${isOwner ? 'text-accent-foreground/60' : 'text-muted-foreground'}`}>
                          {format(new Date(msg.created_at), 'HH:mm', { locale: da })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area — only for support and booking threads */}
            {activeThread !== 'system' && (
              <div className="p-4 border-t bg-muted/10">
                <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Skriv en besked..."
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button type="submit" disabled={!newMessage.trim() || sending} size="icon" className="shrink-0">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
