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
  Mail, ChevronRight, Circle, Loader2, X, CheckCheck,
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

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightText({ text, query }: { text: string | null | undefined; query: string }) {
  if (!text) return null;
  if (!query) return <>{text}</>;
  const re = new RegExp(`(${escapeRegExp(query)})`, 'ig');
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-primary/25 text-foreground rounded px-0.5">{p}</mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

const PAGE_SIZE = 200;

export default function AdminBeskeder() {
  const { user } = useAuth();
  const [allMessages, setAllMessages] = useState<Msg[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});
  const [roleMap, setRoleMap] = useState<Record<string, ParticipantRole>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<ThreadTab>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  // Transient indicator: set when we successfully clear unread in the open thread
  const [allReadFlash, setAllReadFlash] = useState<{ threadId: string; count: number } | null>(null);
  const allReadTimerRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: "/" focuses search, "Esc" clears it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField = target && ['INPUT', 'TEXTAREA'].includes(target.tagName);
      if (e.key === '/' && !inField) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        setSearch('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Resolve profiles + roles for a batch of new participant ids
  const resolveIdentities = async (newIds: string[]) => {
    const unknown = newIds.filter(id => !profilesMap[id] && !roleMap[id]);
    if (unknown.length === 0) return;
    const [{ data: profs }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email').in('id', unknown),
      supabase.from('user_roles').select('user_id, role').in('user_id', unknown),
    ]);
    setProfilesMap(prev => {
      const next = { ...prev };
      (profs || []).forEach((p: any) => { next[p.id] = p; });
      return next;
    });
    setRoleMap(prev => {
      const next = { ...prev };
      (roles || []).forEach((r: any) => {
        if (r.role === 'owner' || r.role === 'guest') {
          if (!next[r.user_id] || r.role === 'owner') next[r.user_id] = r.role;
        }
      });
      return next;
    });
  };

  // Initial load — newest PAGE_SIZE
  const loadInitial = async () => {
    setLoading(true);
    const { data: msgs, count } = await supabase
      .from('chat_messages')
      .select('id, message, sender_type, sender_id, sender_name, recipient_id, thread_id, thread_type, booking_id, created_at, is_read', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    const list = ((msgs || []) as Msg[]).reverse(); // back to ascending for grouping
    setAllMessages(list);
    setTotalCount(count ?? null);
    setHasMore((msgs?.length || 0) >= PAGE_SIZE && (count == null || (count > (msgs?.length || 0))));

    const ids = Array.from(new Set(list.flatMap(m => [
      m.sender_type !== 'admin' ? m.sender_id : null,
      m.sender_type === 'admin' ? m.recipient_id : null,
    ]).filter(Boolean) as string[]));
    await resolveIdentities(ids);
    setLoading(false);
  };

  // Load older page using cursor
  const loadMore = async () => {
    if (loadingMore || !hasMore || allMessages.length === 0) return;
    setLoadingMore(true);
    const oldest = allMessages[0].created_at; // ascending → first is oldest
    const { data: msgs } = await supabase
      .from('chat_messages')
      .select('id, message, sender_type, sender_id, sender_name, recipient_id, thread_id, thread_type, booking_id, created_at, is_read')
      .lt('created_at', oldest)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    const older = ((msgs || []) as Msg[]).reverse();
    setAllMessages(prev => [...older, ...prev]);
    setHasMore((msgs?.length || 0) >= PAGE_SIZE);

    const ids = Array.from(new Set(older.flatMap(m => [
      m.sender_type !== 'admin' ? m.sender_id : null,
      m.sender_type === 'admin' ? m.recipient_id : null,
    ]).filter(Boolean) as string[]));
    await resolveIdentities(ids);
    setLoadingMore(false);
  };

  // Apply realtime delta (insert / update / delete) without re-fetching everything
  const applyRealtime = (event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => {
    if (event === 'INSERT') {
      const m = payload.new as Msg;
      setAllMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
      setTotalCount(c => (c == null ? c : c + 1));
      const id = m.sender_type === 'admin' ? m.recipient_id : m.sender_id;
      if (id) resolveIdentities([id]);
    } else if (event === 'UPDATE') {
      const m = payload.new as Msg;
      setAllMessages(prev => prev.map(x => (x.id === m.id ? { ...x, ...m } : x)));
    } else if (event === 'DELETE') {
      const m = payload.old as Msg;
      setAllMessages(prev => prev.filter(x => x.id !== m.id));
      setTotalCount(c => (c == null ? c : Math.max(0, c - 1)));
    }
  };

  useEffect(() => {
    loadInitial();
    const channel = supabase
      .channel('admin-beskeder')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, p => applyRealtime('INSERT', p))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, p => applyRealtime('UPDATE', p))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, p => applyRealtime('DELETE', p))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive thread list from the loaded messages + identity maps
  const threads = useMemo<Thread[]>(() => {
    const buckets = new Map<string, Thread>();
    allMessages.forEach(m => {
      const participantId = m.sender_type === 'admin' ? m.recipient_id : m.sender_id;
      if (m.sender_type === 'admin' && !participantId) return;

      const key = m.thread_id || participantId || `anon:${m.sender_name || 'ukendt'}`;
      const existing = buckets.get(key);

      if (!existing) {
        const profile = participantId ? profilesMap[participantId] : null;
        const role: ParticipantRole = participantId ? (roleMap[participantId] || 'unknown') : 'unknown';
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
        if (!existing.participantId && participantId) {
          existing.participantId = participantId;
          const profile = profilesMap[participantId];
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
    // Ensure messages are chronological inside each thread
    buckets.forEach(t => t.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    return Array.from(buckets.values())
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }, [allMessages, profilesMap, roleMap]);


  // Normalize search query (case + accent insensitive)
  const normalizedQuery = useMemo(
    () => search.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    [search]
  );

  const matches = (text: string | null | undefined) => {
    if (!text) return false;
    const t = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return t.includes(normalizedQuery);
  };

  type FilteredThread = Thread & { matchedMessage?: Msg };

  const filtered = useMemo<FilteredThread[]>(() => {
    return threads.reduce<FilteredThread[]>((acc, t) => {
      if (tab !== 'all' && t.role !== tab) return acc;

      if (!normalizedQuery) {
        acc.push(t);
        return acc;
      }

      // Header-level match (name / email)
      const headerHit = matches(t.participantName) || matches(t.participantEmail);
      // Message-level match (text or per-message sender_name)
      const matchedMessage = t.messages.find(m => matches(m.message) || matches(m.sender_name));

      if (headerHit || matchedMessage) {
        acc.push({ ...t, matchedMessage: matchedMessage || undefined });
      }
      return acc;
    }, []);
  }, [threads, tab, normalizedQuery]);

  const counts = useMemo(() => ({
    total: threads.length,
    unread: threads.filter(t => t.unread > 0).length,
    owner: threads.filter(t => t.role === 'owner').length,
    guest: threads.filter(t => t.role === 'guest').length,
  }), [threads]);

  const selected = useMemo(() => threads.find(t => t.id === selectedId) || null, [threads, selectedId]);

  // Track IDs we've already attempted, so retries don't loop forever per session
  const markReadAttemptsRef = useRef<Map<string, number>>(new Map());
  const MAX_MARK_READ_RETRIES = 3;

  // Robust mark-as-read with retry, RLS verification and rollback on failure.
  // Returns true if ALL ids ended up read in the database.
  const markMessagesRead = async (ids: string[]): Promise<boolean> => {
    if (ids.length === 0) return true;

    // Snapshot previous state for rollback
    const prevSnapshot = new Map<string, boolean | null>();
    setAllMessages(prev => {
      prev.forEach(m => { if (ids.includes(m.id)) prevSnapshot.set(m.id, m.is_read); });
      return prev.map(m => (ids.includes(m.id) ? { ...m, is_read: true } : m));
    });

    let lastError: any = null;
    for (let attempt = 1; attempt <= MAX_MARK_READ_RETRIES; attempt++) {
      const { data, error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .in('id', ids)
        .eq('is_read', false)
        .select('id');

      if (!error) {
        const updatedIds = new Set((data || []).map(r => r.id));
        const stillUnread = ids.filter(id => !updatedIds.has(id));

        if (stillUnread.length === 0) {
          markReadAttemptsRef.current.clear();
          return true;
        }

        const { data: check, error: checkErr } = await supabase
          .from('chat_messages')
          .select('id, is_read')
          .in('id', stillUnread);

        if (!checkErr) {
          const allRead = (check || []).every(r => r.is_read === true);
          const visible = (check || []).map(r => r.id);
          const invisible = stillUnread.filter(id => !visible.includes(id));

          if (allRead && invisible.length === 0) {
            markReadAttemptsRef.current.clear();
            return true;
          }

          const blockedKey = invisible.sort().join(',');
          if (blockedKey) {
            const tries = (markReadAttemptsRef.current.get(blockedKey) || 0) + 1;
            markReadAttemptsRef.current.set(blockedKey, tries);
            if (tries >= MAX_MARK_READ_RETRIES) {
              console.warn('[AdminBeskeder] RLS blocked mark-as-read for', invisible);
              toast.error('Kunne ikke markere alle beskeder som læst (manglende rettigheder)');
              setAllMessages(prev => prev.map(m =>
                invisible.includes(m.id) ? { ...m, is_read: prevSnapshot.get(m.id) ?? false } : m
              ));
              return false;
            }
          }
        }
        lastError = new Error('Partial update — rows still unread after attempt ' + attempt);
      } else {
        lastError = error;
        console.warn(`[AdminBeskeder] mark-as-read attempt ${attempt} failed`, error);
      }

      await new Promise(res => setTimeout(res, 250 * attempt));
    }

    console.error('[AdminBeskeder] mark-as-read failed after retries', lastError);
    toast.error('Kunne ikke opdatere læsestatus — prøver igen senere');
    setAllMessages(prev => prev.map(m =>
      ids.includes(m.id) ? { ...m, is_read: prevSnapshot.get(m.id) ?? false } : m
    ));
    return false;
  };

  // Mark + show toast/flash. Used by auto-effect AND the manual button.
  const markThreadRead = async (
    threadId: string,
    unreadIds: string[],
    opts: { silentIfNoop?: boolean } = {}
  ) => {
    if (unreadIds.length === 0) {
      if (!opts.silentIfNoop) {
        toast('Ingen ulæste beskeder i denne tråd', { duration: 1800 });
      }
      return;
    }
    const ok = await markMessagesRead(unreadIds);
    if (!ok) return;
    toast.success(
      unreadIds.length === 1
        ? '1 besked markeret som læst'
        : `${unreadIds.length} beskeder markeret som læst`,
      { duration: 2000 }
    );
    setAllReadFlash({ threadId, count: unreadIds.length });
    if (allReadTimerRef.current) window.clearTimeout(allReadTimerRef.current);
    allReadTimerRef.current = window.setTimeout(() => setAllReadFlash(null), 2500);
  };

  // Manual button handler
  const handleManualMarkRead = async () => {
    if (!selected || markingRead) return;
    const unreadIds = selected.messages
      .filter(m => m.sender_type !== 'admin' && !m.is_read)
      .map(m => m.id);
    setMarkingRead(true);
    try {
      await markThreadRead(selected.id, unreadIds);
    } finally {
      setMarkingRead(false);
    }
  };

  // Auto-mark unread as read when opening a thread or when new messages arrive in the open thread
  useEffect(() => {
    if (!selected) return;
    const threadId = selected.id;
    const unreadIds = selected.messages
      .filter(m => m.sender_type !== 'admin' && !m.is_read)
      .map(m => m.id);
    if (unreadIds.length === 0) return;
    markThreadRead(threadId, unreadIds, { silentIfNoop: true });
  }, [selectedId, selected?.messages.length]);

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
    // Realtime subscription will append the new message automatically
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
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchRef}
              placeholder="Søg navn, email, afsender eller indhold... (tryk /)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-20 h-9 bg-muted/20 border-border/40 rounded-xl text-sm"
            />
            {search ? (
              <button
                type="button"
                onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                aria-label="Ryd søgning"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex absolute right-2 top-1/2 -translate-y-1/2 items-center px-1.5 h-5 rounded border border-border/40 bg-muted/30 text-[10px] font-mono text-muted-foreground">/</kbd>
            )}
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
          {normalizedQuery && (
            <span className="text-[11px] text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? 'tråd' : 'tråde'} matcher
            </span>
          )}
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
              // When searching: prefer the matched message as preview snippet
              const previewMsg = t.matchedMessage || lastMsg;
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
                        <HighlightText text={t.participantName} query={normalizedQuery} />
                      </p>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-border/40 text-muted-foreground">{v.label}</Badge>
                      {t.unread > 0 && (
                        <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
                          {t.unread}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${t.unread > 0 ? 'text-foreground/70' : 'text-muted-foreground'}`}>
                      {previewMsg.sender_type === 'admin' && <span className="font-medium">Du: </span>}
                      {!!t.matchedMessage && previewMsg.sender_type !== 'admin' && previewMsg.sender_name && (
                        <span className="font-medium">{previewMsg.sender_name}: </span>
                      )}
                      <HighlightText text={previewMsg.message} query={normalizedQuery} />
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

        {/* Load more / pagination footer */}
        {!loading && (
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-[11px] text-muted-foreground">
              {totalCount != null
                ? `Viser ${allMessages.length} af ${totalCount} beskeder · ${threads.length} tråde`
                : `Viser ${allMessages.length} beskeder · ${threads.length} tråde`}
            </p>
            {hasMore ? (
              <Button
                variant="outline"
                size="sm"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-xl h-8 text-xs"
              >
                {loadingMore ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Indlæser…</>
                ) : (
                  <>Indlæs ældre beskeder</>
                )}
              </Button>
            ) : allMessages.length > 0 && (
              <span className="text-[11px] text-muted-foreground/60">Alle beskeder indlæst</span>
            )}
          </div>
        )}
      </div>

      {/* ── Thread drawer ── */}
      <Sheet open={!!selected} onOpenChange={open => !open && setSelectedId(null)}>
        <SheetContent className="sm:max-w-lg bg-card border-border/50 flex flex-col p-0">
          {selected && (() => {
            const v = roleVisuals(selected.role);
            const unreadInThread = selected.messages.filter(
              m => m.sender_type !== 'admin' && !m.is_read
            ).length;
            return (
              <>
                <div className="px-6 pt-6 pb-4 border-b border-border/30 shrink-0">
                  <SheetHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${v.bg}`}>
                        <v.Icon className={`w-5 h-5 ${v.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <SheetTitle className="text-base truncate">{selected.participantName}</SheetTitle>
                          {allReadFlash && allReadFlash.threadId === selected.id && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium animate-in fade-in slide-in-from-top-1 duration-300"
                              aria-live="polite"
                            >
                              <CheckCheck className="w-3 h-3" />
                              Alle læst
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {v.label}{selected.participantEmail ? ` · ${selected.participantEmail}` : ''} · {selected.messages.length} beskeder
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 rounded-lg shrink-0 gap-1.5"
                        onClick={handleManualMarkRead}
                        disabled={markingRead || unreadInThread === 0}
                        title={unreadInThread === 0 ? 'Ingen ulæste beskeder' : `Markér ${unreadInThread} besked${unreadInThread === 1 ? '' : 'er'} som læst`}
                      >
                        {markingRead ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCheck className="w-3.5 h-3.5" />
                        )}
                        <span className="text-xs">
                          Markér som læst{unreadInThread > 0 ? ` (${unreadInThread})` : ''}
                        </span>
                      </Button>
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
