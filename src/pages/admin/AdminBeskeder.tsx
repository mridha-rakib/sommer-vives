import { useState, useEffect, useMemo, useRef } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare, UserCheck, User, Bot, Search, Send,
  Mail, ChevronRight, Circle, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

type ParticipantRole = 'owner' | 'guest' | 'unknown';
type ThreadTab = 'all' | 'owner' | 'guest';

type Msg = {
  id: string;
  message: string;
  sender_type: string;
  sender_id: string | null;
  sender_name: string | null;
  recipient_id: string | null;
  thread_id: string | null;
  thread_type: string | null;
  booking_id: string | null;
  created_at: string;
  is_read: boolean | null;
};

type Thread = {
  id: string;            // participant user id (or sender_name for anonymous)
  participantId: string | null;
  participantName: string;
  participantEmail: string | null;
  role: ParticipantRole;
  messages: Msg[];
  lastMessageAt: string;
  unread: number;
};

const TAB_CFG: Record<ThreadTab, { label: string; icon: React.ElementType }> = {
  all:   { label: 'Alle',   icon: MessageSquare },
  owner: { label: 'Ejere',  icon: UserCheck },
  guest: { label: 'Gæster', icon: User },
};

function roleVisuals(role: ParticipantRole) {
  if (role === 'owner') return { Icon: UserCheck, color: 'text-primary', bg: 'bg-primary/10', label: 'Ejer' };
  if (role === 'guest') return { Icon: User, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Gæst' };
  return { Icon: Bot, color: 'text-muted-foreground', bg: 'bg-muted/30', label: 'Ukendt' };
}

export default function AdminBeskeder() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<ThreadTab>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    // Pull recent messages — thread_id is now deterministic per participant (DB trigger)
    const { data: msgs } = await supabase
      .from('chat_messages')
      .select('id, message, sender_type, sender_id, sender_name, recipient_id, thread_id, thread_type, booking_id, created_at, is_read')
      .order('created_at', { ascending: true })
      .limit(1000);

    const list = (msgs || []) as (Msg & { thread_id: string | null })[];

    // Resolve participant identities (everyone who is NOT admin)
    const participantIds = Array.from(new Set(
      list.flatMap(m => [
        m.sender_type !== 'admin' ? m.sender_id : null,
        m.sender_type === 'admin' ? m.recipient_id : null,
      ]).filter(Boolean) as string[]
    ));

    let profiles: Record<string, any> = {};
    let roleMap: Record<string, ParticipantRole> = {};
    if (participantIds.length > 0) {
      const [{ data: profs }, { data: roles }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').in('id', participantIds),
        supabase.from('user_roles').select('user_id, role').in('user_id', participantIds),
      ]);
      profiles = Object.fromEntries((profs || []).map((p: any) => [p.id, p]));
      (roles || []).forEach((r: any) => {
        if (r.role === 'owner' || r.role === 'guest') {
          if (!roleMap[r.user_id] || r.role === 'owner') roleMap[r.user_id] = r.role;
        }
      });
    }

    // Group strictly by deterministic thread_id (DB-managed)
    const buckets = new Map<string, Thread>();
    list.forEach(m => {
      const participantId =
        m.sender_type === 'admin' ? m.recipient_id : m.sender_id;

      // Skip admin-to-nobody orphans
      if (m.sender_type === 'admin' && !participantId) return;

      // Deterministic key from DB; fallback to participant id for old rows
      const key = m.thread_id || participantId || `anon:${m.sender_name || 'ukendt'}`;
      const existing = buckets.get(key);

      if (!existing) {
        const profile = participantId ? profiles[participantId] : null;
        const role: ParticipantRole = participantId
          ? (roleMap[participantId] || 'unknown')
          : 'unknown';
        buckets.set(key, {
          id: key,
          participantId,
          participantName: profile?.full_name || profile?.email || m.sender_name || 'Ukendt',
          participantEmail: profile?.email || null,
          role,
          messages: [m],
          lastMessageAt: m.created_at,
          unread: m.sender_type !== 'admin' && !m.is_read ? 1 : 0,
        });
      } else {
        existing.messages.push(m);
        // Promote participantId if a later message reveals it
        if (!existing.participantId && participantId) {
          existing.participantId = participantId;
          const profile = profiles[participantId];
          if (profile) {
            existing.participantName = profile.full_name || profile.email || existing.participantName;
            existing.participantEmail = profile.email || existing.participantEmail;
          }
          if (roleMap[participantId]) existing.role = roleMap[participantId];
        }
        if (new Date(m.created_at) > new Date(existing.lastMessageAt)) existing.lastMessageAt = m.created_at;
        if (m.sender_type !== 'admin' && !m.is_read) existing.unread += 1;
      }
    });

    const threadList = Array.from(buckets.values())
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    setThreads(threadList);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('admin-beskeder')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    return threads.filter(t => {
      if (tab !== 'all' && t.role !== tab) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.participantName.toLowerCase().includes(q) ||
          (t.participantEmail || '').toLowerCase().includes(q) ||
          t.messages.some(m => (m.message || '').toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [threads, tab, search]);

  const counts = useMemo(() => ({
    total: threads.length,
    unread: threads.filter(t => t.unread > 0).length,
    owner: threads.filter(t => t.role === 'owner').length,
    guest: threads.filter(t => t.role === 'guest').length,
  }), [threads]);

  const selected = useMemo(() => threads.find(t => t.id === selectedId) || null, [threads, selectedId]);

  // Auto-mark unread as read when opening a thread
  useEffect(() => {
    if (!selected) return;
    const unreadIds = selected.messages.filter(m => m.sender_type !== 'admin' && !m.is_read).map(m => m.id);
    if (unreadIds.length === 0) return;
    supabase.from('chat_messages').update({ is_read: true }).in('id', unreadIds).then(() => load());
  }, [selectedId]);

  // Auto-scroll inside drawer
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [selected?.messages.length]);

  const sendReply = async () => {
    if (!selected || !reply.trim() || sending) return;
    if (!selected.participantId) {
      toast.error('Kan ikke svare — afsender mangler en bruger-id');
      return;
    }
    setSending(true);
    const { error } = await supabase.from('chat_messages').insert({
      thread_type: 'support',
      sender_type: 'admin',
      sender_id: user?.id || null,
      sender_name: 'SommerVibes Support',
      recipient_id: selected.participantId,
      message: reply.trim(),
    });
    setSending(false);
    if (error) { toast.error('Kunne ikke sende svar'); return; }
    setReply('');
    load();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Beskeder"
          subtitle="Direkte dialog med ejere og gæster"
          actions={
            counts.unread > 0 ? (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-2.5 py-1">
                {counts.unread} ulæste
              </Badge>
            ) : null
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Alle samtaler', value: counts.total, icon: MessageSquare },
            { label: 'Ulæste', value: counts.unread, icon: Mail },
            { label: 'Ejere', value: counts.owner, icon: UserCheck },
            { label: 'Gæster', value: counts.guest, icon: User },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-xl border border-border/40 bg-card/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground font-medium">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Søg navn, email, indhold..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 bg-muted/20 border-border/40 rounded-xl text-sm" />
          </div>
          <Tabs value={tab} onValueChange={v => setTab(v as ThreadTab)} className="w-auto">
            <TabsList className="h-9 bg-muted/20 border border-border/30 rounded-xl p-0.5">
              {Object.entries(TAB_CFG).map(([key, cfg]) => (
                <TabsTrigger key={key} value={key} className="text-xs rounded-lg px-3 h-7 gap-1.5">
                  <cfg.icon className="w-3 h-3" /> {cfg.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Thread list */}
        {loading ? (
          <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card/40 p-16 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Ingen beskeder fundet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Du er helt ajour</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/40 bg-card/40 divide-y divide-border/30 overflow-hidden">
            {filtered.map(t => {
              const lastMsg = t.messages[t.messages.length - 1];
              const v = roleVisuals(t.role);
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors group ${
                    t.unread > 0 ? 'bg-primary/[0.03] hover:bg-primary/[0.06]' : 'hover:bg-muted/15'
                  }`}
                >
                  <div className="w-2 shrink-0">
                    {t.unread > 0 && <Circle className="w-2 h-2 fill-primary text-primary" />}
                  </div>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${v.bg}`}>
                    <v.Icon className={`w-4 h-4 ${v.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate ${t.unread > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                        {t.participantName}
                      </p>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-border/40 text-muted-foreground">{v.label}</Badge>
                      {t.unread > 0 && (
                        <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
                          {t.unread}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${t.unread > 0 ? 'text-foreground/70' : 'text-muted-foreground'}`}>
                      {lastMsg.sender_type === 'admin' && <span className="font-medium">Du: </span>}
                      {lastMsg.message}
                    </p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(t.lastMessageAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
                    </span>
                    <StatusChip label={`${t.messages.length} besked${t.messages.length !== 1 ? 'er' : ''}`} variant="muted" size="sm" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Thread drawer ── */}
      <Sheet open={!!selected} onOpenChange={open => !open && setSelectedId(null)}>
        <SheetContent className="sm:max-w-lg bg-card border-border/50 flex flex-col p-0">
          {selected && (() => {
            const v = roleVisuals(selected.role);
            return (
              <>
                <div className="px-6 pt-6 pb-4 border-b border-border/30 shrink-0">
                  <SheetHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${v.bg}`}>
                        <v.Icon className={`w-5 h-5 ${v.color}`} />
                      </div>
                      <div className="min-w-0">
                        <SheetTitle className="text-base truncate">{selected.participantName}</SheetTitle>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {v.label}{selected.participantEmail ? ` · ${selected.participantEmail}` : ''} · {selected.messages.length} beskeder
                        </p>
                      </div>
                    </div>
                  </SheetHeader>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  {selected.messages.map(m => {
                    const isAdmin = m.sender_type === 'admin';
                    return (
                      <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                          isAdmin
                            ? 'bg-primary/15 text-foreground rounded-br-md'
                            : 'bg-muted/40 text-foreground rounded-bl-md'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              {isAdmin ? 'Du' : (m.sender_name || selected.participantName)}
                            </span>
                            <span className="text-[10px] text-muted-foreground/50">
                              {new Date(m.created_at).toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="px-6 py-4 border-t border-border/30 shrink-0">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={selected.participantId ? 'Skriv et svar...' : 'Kan ikke svare anonyme afsendere'}
                      value={reply}
                      disabled={!selected.participantId || sending}
                      onChange={e => setReply(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                      className="min-h-[44px] max-h-[120px] bg-muted/20 border-border/40 rounded-xl text-sm resize-none"
                      rows={1}
                    />
                    <Button size="sm" className="rounded-xl h-[44px] px-4 shrink-0" onClick={sendReply} disabled={!reply.trim() || sending || !selected.participantId}>
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
