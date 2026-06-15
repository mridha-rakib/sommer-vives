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
  Mail, ChevronRight, Circle, Loader2, X, CheckCheck, Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import { devLog } from '@/lib/devLog';
import { ChatAttachment } from '@/components/chat/ChatAttachment';
import { notifyChatPush, uploadChatAttachment } from '@/lib/chatAttachments';
import { useChatTyping } from '@/hooks/useChatTyping';
import { useTranslation } from '@/lib/i18n';

const rtLog = devLog('chat:realtime');
const arLog = devLog('chat:auto-read');

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
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
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

type ProfileInfo = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type RoleRow = {
  user_id: string;
  role: string;
};

type ChatRealtimePayload = {
  new?: Record<string, any>;
  old?: Record<string, any>;
};

function getRoleVisuals(role: ParticipantRole, t: (k: string) => string) {
  if (role === 'owner') return { Icon: UserCheck, color: 'text-primary', bg: 'bg-primary/10', label: t('admin.beskeder.role.owner') };
  if (role === 'guest') return { Icon: User, color: 'text-amber-400', bg: 'bg-amber-500/10', label: t('admin.beskeder.role.guest') };
  return { Icon: Bot, color: 'text-muted-foreground', bg: 'bg-muted/30', label: t('admin.beskeder.role.unknown') };
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
  const { t } = useTranslation();
  const [allMessages, setAllMessages] = useState<Msg[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, ProfileInfo>>({});
  const [roleMap, setRoleMap] = useState<Record<string, ParticipantRole>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<ThreadTab>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  // Transient indicator: set when we successfully clear unread in the open thread
  const [allReadFlash, setAllReadFlash] = useState<{ threadId: string; count: number } | null>(null);
  const allReadTimerRef = useRef<number | null>(null);
  // Mirror of selectedId so realtime callbacks always see the latest value
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      ((profs || []) as ProfileInfo[]).forEach((p) => { next[p.id] = p; });
      return next;
    });
    setRoleMap(prev => {
      const next = { ...prev };
      ((roles || []) as RoleRow[]).forEach((r) => {
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
      .select('id, message, sender_type, sender_id, sender_name, recipient_id, thread_id, thread_type, booking_id, created_at, is_read, attachment_url, attachment_name, attachment_type, attachment_size', { count: 'exact' })
      .eq('thread_type', 'support')
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
      .select('id, message, sender_type, sender_id, sender_name, recipient_id, thread_id, thread_type, booking_id, created_at, is_read, attachment_url, attachment_name, attachment_type, attachment_size')
      .eq('thread_type', 'support')
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
  const applyRealtime = (event: 'INSERT' | 'UPDATE' | 'DELETE', payload: ChatRealtimePayload) => {
    if (event === 'INSERT') {
      const m = payload.new as Msg;
      if (m.thread_type !== 'support') return;
      rtLog('INSERT', {
        id: m.id,
        thread_id: m.thread_id,
        sender_type: m.sender_type,
        is_read: m.is_read,
        openThread: selectedIdRef.current,
        willAutoMark:
          selectedIdRef.current != null &&
          m.sender_type !== 'admin' &&
          !m.is_read &&
          // we approximate: if the new message belongs to the open thread, auto-mark will run
          true,
      });
      setAllMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
      setTotalCount(c => (c == null ? c : c + 1));
      const id = m.sender_type === 'admin' ? m.recipient_id : m.sender_id;
      if (id) resolveIdentities([id]);
    } else if (event === 'UPDATE') {
      const m = payload.new as Msg;
      if (m.thread_type !== 'support') return;
      rtLog('UPDATE', { id: m.id, is_read: m.is_read });
      setAllMessages(prev => prev.map(x => (x.id === m.id ? { ...x, ...m } : x)));
    } else if (event === 'DELETE') {
      const m = payload.old as Msg;
      if (m.thread_type !== 'support') return;
      rtLog('DELETE', { id: m.id });
      setAllMessages(prev => prev.filter(x => x.id !== m.id));
      setTotalCount(c => (c == null ? c : Math.max(0, c - 1)));
    }
  };

  useEffect(() => {
    loadInitial();
    const channel = supabase
      .channel('admin-beskeder')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, p => applyRealtime('INSERT', { new: p.new as Msg }))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, p => applyRealtime('UPDATE', { new: p.new as Msg }))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, p => applyRealtime('DELETE', { old: p.old as Msg }))
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
          participantName: profile?.full_name || profile?.email || m.sender_name || t('admin.beskeder.role.unknown'),
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
    buckets.forEach(thread => thread.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    return Array.from(buckets.values())
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }, [allMessages, profilesMap, roleMap, t]);


  // Normalize search query (case + accent insensitive)
  const normalizedQuery = useMemo(
    () => search.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    [search]
  );

  const matches = (text: string | null | undefined) => {
    if (!text) return false;
    const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalized.includes(normalizedQuery);
  };

  type FilteredThread = Thread & { matchedMessage?: Msg };

  const filtered = useMemo<FilteredThread[]>(() => {
    return threads.reduce<FilteredThread[]>((acc, thread) => {
      if (tab !== 'all' && thread.role !== tab) return acc;

      if (!normalizedQuery) {
        acc.push(thread);
        return acc;
      }

      // Header-level match (name / email)
      const headerHit = matches(thread.participantName) || matches(thread.participantEmail);
      // Message-level match (text or per-message sender_name)
      const matchedMessage = thread.messages.find(m => matches(m.message) || matches(m.sender_name) || matches(m.attachment_name));

      if (headerHit || matchedMessage) {
        acc.push({ ...thread, matchedMessage: matchedMessage || undefined });
      }
      return acc;
    }, []);
  }, [threads, tab, normalizedQuery]);

  const counts = useMemo(() => ({
    total: threads.length,
    unread: threads.filter(thread => thread.unread > 0).length,
    owner: threads.filter(thread => thread.role === 'owner').length,
    guest: threads.filter(thread => thread.role === 'guest').length,
  }), [threads]);

  const selected = useMemo(() => threads.find(thread => thread.id === selectedId) || null, [threads, selectedId]);
  const { signalTyping, typingLabel } = useChatTyping({
    channelKey: selected?.id,
    selfKey: user?.id,
    selfName: 'SommerVibes Support',
    selfRole: 'admin',
  });

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

    let lastError: unknown = null;
    for (let attempt = 1; attempt <= MAX_MARK_READ_RETRIES; attempt++) {
      const { data, error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .in('id', ids)
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
              toast.error(t('admin.beskeder.toast.markReadRlsError'));
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
    toast.error(t('admin.beskeder.toast.markReadFailed'));
    setAllMessages(prev => prev.map(m =>
      ids.includes(m.id) ? { ...m, is_read: prevSnapshot.get(m.id) ?? false } : m
    ));
    return false;
  };

  // Mark + show toast/flash. Used by auto-effect AND the manual button.
  const markThreadRead = async (
    threadId: string,
    unreadIds: string[],
    opts: { silentIfNoop?: boolean; trigger?: 'auto' | 'manual' } = {}
  ) => {
    const trigger = opts.trigger || 'auto';
    if (unreadIds.length === 0) {
      arLog('noop — nothing unread', { threadId, trigger });
      if (!opts.silentIfNoop) {
        toast(t('admin.beskeder.toast.noUnreadInThread'), { duration: 1800 });
      }
      return;
    }
    arLog('start', { threadId, trigger, count: unreadIds.length, ids: unreadIds });
    const t0 = performance.now();
    const ok = await markMessagesRead(unreadIds);
    const dt = Math.round(performance.now() - t0);
    if (!ok) {
      arLog.warn('failed after retries', { threadId, trigger, durationMs: dt });
      return;
    }
    arLog('success', { threadId, trigger, count: unreadIds.length, durationMs: dt });
    toast.success(
      unreadIds.length === 1
        ? t('admin.beskeder.toast.markedReadOne')
        : t('admin.beskeder.toast.markedReadMany').replace('{count}', String(unreadIds.length)),
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
      await markThreadRead(selected.id, unreadIds, { trigger: 'manual' });
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
    arLog('auto-trigger', {
      threadId,
      reason: 'thread open or new realtime message arrived',
      unread: unreadIds.length,
    });
    markThreadRead(threadId, unreadIds, { silentIfNoop: true, trigger: 'auto' });
  }, [selectedId, selected?.messages.length]);

  // Auto-scroll inside drawer
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [selected?.messages.length]);

  const sendReply = async () => {
    if (!selected || (!reply.trim() && !replyFile) || sending) return;
    if (!selected.participantId) {
      toast.error(t('admin.beskeder.toast.noSenderId'));
      return;
    }
    setSending(true);
    let attachment = {};
    try {
      if (replyFile) attachment = await uploadChatAttachment(replyFile, selected.id);
    } catch (err: unknown) {
      setSending(false);
      toast.error(err instanceof Error ? err.message : t('admin.beskeder.toast.uploadError'));
      return;
    }
    const { data, error } = await supabase.from('chat_messages').insert({
      thread_type: 'support',
      thread_id: selected.id,
      sender_type: 'admin',
      sender_id: user?.id || null,
      sender_name: 'SommerVibes Support',
      recipient_id: selected.participantId,
      message: reply.trim(),
      ...attachment,
    }).select('id, message, sender_type, sender_id, sender_name, recipient_id, thread_id, thread_type, booking_id, created_at, is_read, attachment_url, attachment_name, attachment_type, attachment_size').single();
    setSending(false);
    if (error) { toast.error(t('admin.beskeder.toast.sendError')); return; }
    if (data) {
      setAllMessages(prev => prev.some(message => message.id === data.id) ? prev : [...prev, data as Msg]);
    }
    setReply('');
    setReplyFile(null);
    notifyChatPush(data?.id);
    // Realtime subscription will append the new message automatically
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title={t('admin.beskeder.title')}
          subtitle={t('admin.beskeder.subtitle')}
          actions={
            counts.unread > 0 ? (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-2.5 py-1">
                {t('admin.beskeder.badge.unread').replace('{count}', String(counts.unread))}
              </Badge>
            ) : null
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: t('admin.beskeder.kpi.allConversations'), value: counts.total, icon: MessageSquare },
            { label: t('admin.beskeder.kpi.unread'), value: counts.unread, icon: Mail },
            { label: t('admin.beskeder.kpi.owners'), value: counts.owner, icon: UserCheck },
            { label: t('admin.beskeder.kpi.guests'), value: counts.guest, icon: User },
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
              placeholder={t('admin.beskeder.search.placeholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-20 h-9 bg-muted/20 border-border/40 rounded-xl text-sm"
            />
            {search ? (
              <button
                type="button"
                onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                aria-label={t('admin.beskeder.search.clearAriaLabel')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex absolute right-2 top-1/2 -translate-y-1/2 items-center px-1.5 h-5 rounded border border-border/40 bg-muted/30 text-[10px] font-mono text-muted-foreground">/</kbd>
            )}
          </div>
          <Tabs value={tab} onValueChange={v => setTab(v as ThreadTab)} className="w-auto">
            <TabsList className="h-9 bg-muted/20 border border-border/30 rounded-xl p-0.5">
              {[
                { key: 'all'   as ThreadTab, label: t('admin.beskeder.tab.all'),   Icon: MessageSquare },
                { key: 'owner' as ThreadTab, label: t('admin.beskeder.tab.owner'), Icon: UserCheck },
                { key: 'guest' as ThreadTab, label: t('admin.beskeder.tab.guest'), Icon: User },
              ].map(cfg => (
                <TabsTrigger key={cfg.key} value={cfg.key} className="text-xs rounded-lg px-3 h-7 gap-1.5">
                  <cfg.Icon className="w-3 h-3" /> {cfg.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {normalizedQuery && (
            <span className="text-[11px] text-muted-foreground">
              {filtered.length === 1
                ? t('admin.beskeder.search.resultsOne').replace('{count}', String(filtered.length))
                : t('admin.beskeder.search.resultsMany').replace('{count}', String(filtered.length))}
            </span>
          )}
        </div>

        {/* Thread list */}
        {loading ? (
          <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card/40 p-16 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t('admin.beskeder.empty.title')}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{t('admin.beskeder.empty.subtitle')}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/40 bg-card/40 divide-y divide-border/30 overflow-hidden">
            {filtered.map(thread => {
              const lastMsg = thread.messages[thread.messages.length - 1];
              // When searching: prefer the matched message as preview snippet
              const previewMsg = thread.matchedMessage || lastMsg;
              const v = getRoleVisuals(thread.role, t);
              const msgCount = thread.messages.length;
              const msgCountLabel = msgCount === 1
                ? t('admin.beskeder.messageCountOne').replace('{count}', String(msgCount))
                : t('admin.beskeder.messageCountMany').replace('{count}', String(msgCount));
              return (
                <button
                  key={thread.id}
                  onClick={() => setSelectedId(thread.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors group ${
                    thread.unread > 0 ? 'bg-primary/[0.03] hover:bg-primary/[0.06]' : 'hover:bg-muted/15'
                  }`}
                >
                  <div className="w-2 shrink-0">
                    {thread.unread > 0 && <Circle className="w-2 h-2 fill-primary text-primary" />}
                  </div>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${v.bg}`}>
                    <v.Icon className={`w-4 h-4 ${v.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate ${thread.unread > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                        <HighlightText text={thread.participantName} query={normalizedQuery} />
                      </p>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-border/40 text-muted-foreground">{v.label}</Badge>
                      {thread.unread > 0 && (
                        <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
                          {thread.unread}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${thread.unread > 0 ? 'text-foreground/70' : 'text-muted-foreground'}`}>
                      {previewMsg.sender_type === 'admin' && <span className="font-medium">{t('admin.beskeder.preview.you')}</span>}
                      {!!thread.matchedMessage && previewMsg.sender_type !== 'admin' && previewMsg.sender_name && (
                        <span className="font-medium">{previewMsg.sender_name}: </span>
                      )}
                      <HighlightText text={previewMsg.message || previewMsg.attachment_name || t('admin.beskeder.preview.attachment')} query={normalizedQuery} />
                    </p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(thread.lastMessageAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
                    </span>
                    <StatusChip label={msgCountLabel} variant="muted" size="sm" />
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
                ? t('admin.beskeder.pagination.showing')
                    .replace('{loaded}', String(allMessages.length))
                    .replace('{total}', String(totalCount))
                    .replace('{threads}', String(threads.length))
                : t('admin.beskeder.pagination.showingNoTotal')
                    .replace('{loaded}', String(allMessages.length))
                    .replace('{threads}', String(threads.length))}
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
                  <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> {t('admin.beskeder.pagination.loading')}</>
                ) : (
                  <>{t('admin.beskeder.pagination.loadMore')}</>
                )}
              </Button>
            ) : allMessages.length > 0 && (
              <span className="text-[11px] text-muted-foreground/60">{t('admin.beskeder.pagination.allLoaded')}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Thread drawer ── */}
      <Sheet open={!!selected} onOpenChange={open => !open && setSelectedId(null)}>
        <SheetContent className="sm:max-w-lg bg-card border-border/50 flex flex-col p-0">
          {selected && (() => {
            const v = getRoleVisuals(selected.role, t);
            const unreadInThread = selected.messages.filter(
              m => m.sender_type !== 'admin' && !m.is_read
            ).length;
            const drawerMsgCount = selected.messages.length;
            const drawerMsgCountLabel = drawerMsgCount === 1
              ? t('admin.beskeder.messageCountOne').replace('{count}', String(drawerMsgCount))
              : t('admin.beskeder.messageCountMany').replace('{count}', String(drawerMsgCount));
            const markReadTitle = unreadInThread === 0
              ? t('admin.beskeder.drawer.noUnread')
              : (unreadInThread === 1
                  ? t('admin.beskeder.drawer.markReadTitle').replace('{count}', String(unreadInThread))
                  : t('admin.beskeder.drawer.markReadTitleMany').replace('{count}', String(unreadInThread)));
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
                              {t('admin.beskeder.drawer.allRead')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {v.label}{selected.participantEmail ? ` · ${selected.participantEmail}` : ''} · {drawerMsgCountLabel}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 rounded-lg shrink-0 gap-1.5"
                        onClick={handleManualMarkRead}
                        disabled={markingRead || unreadInThread === 0}
                        title={markReadTitle}
                      >
                        {markingRead ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCheck className="w-3.5 h-3.5" />
                        )}
                        <span className="text-xs">
                          {unreadInThread > 0
                            ? t('admin.beskeder.drawer.markReadWithCount').replace('{count}', String(unreadInThread))
                            : t('admin.beskeder.drawer.markRead')}
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
                              {isAdmin ? t('admin.beskeder.drawer.senderYou') : (m.sender_name || selected.participantName)}
                            </span>
                            <span className="text-[10px] text-muted-foreground/50">
                              {new Date(m.created_at).toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {m.message && <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>}
                          <ChatAttachment
                            url={m.attachment_url}
                            name={m.attachment_name}
                            size={m.attachment_size}
                            isOwn={isAdmin}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="px-6 py-4 border-t border-border/30 shrink-0">
                  {typingLabel && (
                    <p className="text-[11px] text-muted-foreground mb-2">{t('admin.chat.typing').replace('{name}', typingLabel)}</p>
                  )}
                  {replyFile && (
                    <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                      <span className="truncate">{replyFile.name}</span>
                      <button type="button" onClick={() => setReplyFile(null)} className="shrink-0 hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={e => setReplyFile(e.target.files?.[0] || null)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl h-[44px] w-[44px] px-0 shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!selected.participantId || sending}
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Textarea
                      placeholder={selected.participantId ? t('admin.beskeder.drawer.replyPlaceholder') : t('admin.beskeder.drawer.noReplyAnon')}
                      value={reply}
                      disabled={!selected.participantId || sending}
                      onChange={e => { setReply(e.target.value); signalTyping(); }}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                      className="min-h-[44px] max-h-[120px] bg-muted/20 border-border/40 rounded-xl text-sm resize-none"
                      rows={1}
                    />
                    <Button size="sm" className="rounded-xl h-[44px] px-4 shrink-0" onClick={sendReply} disabled={(!reply.trim() && !replyFile) || sending || !selected.participantId}>
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
