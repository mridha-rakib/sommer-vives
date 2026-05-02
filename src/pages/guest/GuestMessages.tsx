import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MessageCircle, Send, Phone, Mail, HelpCircle, ChevronDown, ChevronUp,
  AlertTriangle, Crown, LifeBuoy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const faqItems = [
  { q: 'Hvordan finder jeg adgangskoden?', a: 'Den sendes via SMS og e-mail 24 timer inden ankomst. Du kan også finde den under "Boligen" → "Ankomst".' },
  { q: 'Hvad gør jeg ved strømsvigt?', a: 'Tjek eltavlen i bryggers. Kontakt os hvis problemet fortsætter.' },
  { q: 'Kan jeg forlænge mit ophold?', a: 'Kontakt os hurtigst muligt via chat, så tjekker vi tilgængeligheden.' },
  { q: 'Er rengøring inkluderet?', a: 'Ja, slutrengøring er inkluderet. Følg check-out tjeklisten.' },
  { q: 'Kan jeg bestille sengelinned?', a: 'Ja — under "Tilkøb" kan du bestille sengelinned, barneseng og meget mere.' },
];

export default function GuestMessages() {
  const { user, signOut } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadMessages();
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime subscription — only react to messages in MY thread, and patch
  // local state instead of full reload to avoid wiping scroll position.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`guest-messages-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const m = payload.new as any;
        if (m.thread_type !== 'support') return;
        if (m.sender_id !== user.id && m.recipient_id !== user.id) return;
        setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
        // Auto-mark admin replies as read while viewing
        if (m.sender_type !== 'guest' && !m.is_read) {
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
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_type', 'support')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: true })
      .limit(200);
    setMessages(data || []);

    // Mark all unread admin replies as read on open
    const unreadIds = (data || [])
      .filter((m: any) => m.sender_type !== 'guest' && !m.is_read)
      .map((m: any) => m.id);
    if (unreadIds.length > 0) {
      supabase.from('chat_messages').update({ is_read: true }).in('id', unreadIds).then(() => {});
    }
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

  const hasMessages = messages.length > 0;

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="flex flex-col h-[calc(100vh-12rem)]">
        {/* Header with support info */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Beskeder</h1>
            <p className="text-xs text-muted-foreground mt-1">Vi svarer typisk inden for 1-2 timer · Hverdage 10–22, weekend 10–16</p>
          </div>
          <div className="flex items-center gap-1.5">
            <a href="tel:+4542440727">
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg">
                <Phone className="w-4 h-4 text-muted-foreground" />
              </Button>
            </a>
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg" onClick={() => setShowFaq(!showFaq)}>
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* FAQ accordion (togglable) */}
        {showFaq && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <Card className="border-border/30 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle className="w-4 h-4 text-[hsl(var(--gold))]" />
                  <span className="text-xs font-semibold text-foreground">Ofte stillede spørgsmål</span>
                </div>
                <div className="space-y-0.5">
                  {faqItems.map((faq, i) => (
                    <button
                      key={i}
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">{faq.q}</span>
                        {openFaq === i ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                      {openFaq === i && (
                        <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{faq.a}</p>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
          {!hasMessages && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-[hsl(var(--gold))]/10 border border-[hsl(var(--gold))]/15 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-7 h-7 text-[hsl(var(--gold))]/50" />
              </div>
              <h3 className="font-display text-base font-semibold text-foreground mb-1">Velkommen til din personlige chat</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Her kan du skrive direkte til os om alt vedrørende dit ophold — spørgsmål, ønsker eller hvis du har brug for hjælp.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {['Hvornår kan jeg tjekke ind?', 'Kan jeg bestille sengelinned?', 'Har I en babyseng?'].map(q => (
                  <button
                    key={q}
                    onClick={() => { setNewMsg(q); }}
                    className="px-3 py-1.5 rounded-full border border-border/40 bg-card/60 text-[11px] text-muted-foreground hover:border-[hsl(var(--gold))]/30 hover:text-foreground transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map(msg => {
            const isOwn = msg.sender_type === 'guest';
            return (
              <div key={msg.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                {!isOwn && (
                  <div className="w-7 h-7 rounded-full bg-[hsl(var(--gold))]/15 flex items-center justify-center shrink-0 mr-2 mt-1">
                    <span className="text-[9px] font-bold text-[hsl(var(--gold))]">SV</span>
                  </div>
                )}
                <div className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2.5',
                  isOwn
                    ? 'bg-[hsl(var(--gold))]/15 text-foreground rounded-br-md'
                    : 'bg-muted/30 border border-border/30 text-foreground rounded-bl-md'
                )}>
                  {!isOwn && msg.sender_name && (
                    <div className="text-[10px] font-semibold text-[hsl(var(--gold))] mb-0.5">{msg.sender_name}</div>
                  )}
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                  <div className={cn('text-[10px] mt-1', isOwn ? 'text-muted-foreground' : 'text-muted-foreground')}>
                    {new Date(msg.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Input
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              placeholder="Skriv en besked..."
              className="rounded-xl border-border/40 pr-3 h-11 text-sm bg-card/60"
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            />
          </div>
          <Button
            onClick={sendMessage}
            disabled={sending || !newMsg.trim()}
            variant="gold"
            size="icon"
            className="rounded-xl h-11 w-11 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Emergency footer */}
        <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-muted-foreground/60">
          <a href="tel:+4542440727" className="flex items-center gap-1 hover:text-muted-foreground transition-colors">
            <Phone className="w-3 h-3" /> +45 42 44 07 27
          </a>
          <a href="mailto:support@sommervibes.dk" className="flex items-center gap-1 hover:text-muted-foreground transition-colors">
            <Mail className="w-3 h-3" /> support@sommervibes.dk
          </a>
        </div>
      </div>
    </GuestLayout>
  );
}
