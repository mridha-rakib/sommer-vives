import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { StatusChip, type StatusVariant } from '@/components/admin/ui/StatusChip';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare, UserCheck, User, Bot, Search, Send,
  AlertTriangle, Mail, Clock, ChevronRight, Circle
} from 'lucide-react';

type ThreadTab = 'all' | 'owner' | 'guest' | 'system';

const TAB_CFG: Record<ThreadTab, { label: string; icon: React.ElementType }> = {
  all:    { label: 'Alle',    icon: MessageSquare },
  owner:  { label: 'Ejere',   icon: UserCheck },
  guest:  { label: 'Gæster',  icon: User },
  system: { label: 'System',  icon: Bot },
};

function getThreadType(t: string): ThreadTab {
  if (t === 'owner') return 'owner';
  if (t === 'system') return 'system';
  return 'guest';
}

function getThreadIcon(type: string) {
  if (type === 'owner') return { icon: UserCheck, color: 'text-primary', bg: 'bg-primary/10' };
  if (type === 'system') return { icon: Bot, color: 'text-muted-foreground', bg: 'bg-muted/30' };
  return { icon: User, color: 'text-amber-400', bg: 'bg-amber-500/10' };
}

export default function AdminBeskeder() {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<ThreadTab>('all');
  const [selected, setSelected] = useState<any | null>(null);
  const [reply, setReply] = useState('');

  useEffect(() => {
    (async () => {
      // Load all chat_messages and group them into threads on the client.
      // We don't rely on message_threads, since legacy messages may not have an entry.
      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('id, message, sender_type, sender_id, sender_name, created_at, is_read, thread_type, thread_id, booking_id')
        .order('created_at', { ascending: false })
        .limit(500);

      const groups = new Map<string, any>();
      (msgs || []).forEach((m: any) => {
        // Stable thread key: explicit thread_id, else booking, else per-sender per-type bucket
        const key = m.thread_id || m.booking_id || `${m.thread_type || 'other'}:${m.sender_id || m.sender_name || 'anon'}`;
        const existing = groups.get(key);
        if (!existing) {
          groups.set(key, {
            id: key,
            thread_type: m.thread_type || 'guest',
            subject: m.sender_name
              ? `${m.sender_name}`
              : (m.thread_type === 'support' ? 'Support-henvendelse' : 'Samtale'),
            status: 'open',
            last_message_at: m.created_at,
            messages: [m],
          });
        } else {
          existing.messages.push(m);
          if (new Date(m.created_at) > new Date(existing.last_message_at)) {
            existing.last_message_at = m.created_at;
          }
        }
      });

      const threadList = Array.from(groups.values()).sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
      setThreads(threadList);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return threads.filter(t => {
      const tt = getThreadType(t.thread_type);
      if (tab !== 'all' && tt !== tab) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.subject?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [threads, tab, search]);

  const counts = useMemo(() => {
    const unread = threads.filter(t => (t.messages as any[])?.some(m => !m.is_read)).length;
    return {
      total: threads.length,
      unread,
      owner: threads.filter(t => t.thread_type === 'owner').length,
      guest: threads.filter(t => t.thread_type !== 'owner' && t.thread_type !== 'system').length,
    };
  }, [threads]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Beskeder"
          subtitle="Kommunikation med ejere, gæster og systemet"
          actions={
            <div className="flex items-center gap-2">
              {counts.unread > 0 && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-2.5 py-1">
                  {counts.unread} ulæste
                </Badge>
              )}
              <Button size="sm" className="gap-1.5 rounded-xl text-xs">
                <Send className="h-3.5 w-3.5" /> Ny besked
              </Button>
            </div>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            { label: 'Alle tråde', value: counts.total, icon: MessageSquare },
            { label: 'Ulæste', value: counts.unread, icon: Mail },
            { label: 'Fra ejere', value: counts.owner, icon: UserCheck },
            { label: 'Fra gæster', value: counts.guest, icon: User },
          ]).map(kpi => (
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
            <Input placeholder="Søg i beskeder..." value={search} onChange={e => setSearch(e.target.value)}
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
              const msgs = (t.messages as any[]) || [];
              const unread = msgs.filter(m => !m.is_read).length;
              const lastMsg = msgs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
              const cfg = getThreadIcon(t.thread_type);
              return (
                <div
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-colors group ${
                    unread > 0 ? 'bg-primary/[0.02] hover:bg-primary/[0.05]' : 'hover:bg-muted/15'
                  }`}
                >
                  {/* Unread dot */}
                  <div className="w-2 shrink-0">
                    {unread > 0 && <Circle className="w-2 h-2 fill-primary text-primary" />}
                  </div>

                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate ${unread > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                        {t.subject || 'Uden emne'}
                      </p>
                      {unread > 0 && (
                        <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${unread > 0 ? 'text-foreground/70' : 'text-muted-foreground'}`}>
                      {lastMsg?.sender_name && <span className="font-medium">{lastMsg.sender_name}: </span>}
                      {lastMsg?.message || 'Ingen beskeder endnu'}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[11px] text-muted-foreground">
                      {t.last_message_at ? new Date(t.last_message_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }) : ''}
                    </span>
                    <StatusChip
                      label={t.status === 'open' ? 'Åben' : 'Lukket'}
                      variant={t.status === 'open' ? 'info' : 'muted'}
                      size="sm"
                    />
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Thread drawer ── */}
      <Sheet open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-lg bg-card border-border/50 flex flex-col p-0">
          {selected && (() => {
            const msgs = ((selected.messages as any[]) || []).sort(
              (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            const cfg = getThreadIcon(selected.thread_type);
            return (
              <>
                <div className="px-6 pt-6 pb-4 border-b border-border/30">
                  <SheetHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                        <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      <div>
                        <SheetTitle className="text-base">{selected.subject || 'Uden emne'}</SheetTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {selected.thread_type === 'owner' ? 'Ejer' : selected.thread_type === 'system' ? 'System' : 'Gæst'} · {msgs.length} beskeder
                        </p>
                      </div>
                    </div>
                  </SheetHeader>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {msgs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Ingen beskeder endnu</p>
                  ) : msgs.map((m: any) => {
                    const isAdmin = m.sender_type === 'admin';
                    return (
                      <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                          isAdmin ? 'bg-primary/10 text-foreground' : 'bg-muted/30 text-foreground'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              {m.sender_name || m.sender_type}
                            </span>
                            <span className="text-[10px] text-muted-foreground/50">
                              {new Date(m.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{m.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply */}
                <div className="px-6 py-4 border-t border-border/30">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Skriv et svar..."
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      className="min-h-[44px] max-h-[120px] bg-muted/20 border-border/40 rounded-xl text-sm resize-none"
                      rows={1}
                    />
                    <Button size="sm" className="rounded-xl h-[44px] px-4 shrink-0">
                      <Send className="w-4 h-4" />
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
