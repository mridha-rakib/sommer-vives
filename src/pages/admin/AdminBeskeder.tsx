import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, UserCheck, User, Bot, Search } from 'lucide-react';

export default function AdminBeskeder() {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  useEffect(() => {
    supabase.from('message_threads')
      .select('*, messages:chat_messages(id, message, sender_type, created_at, is_read)')
      .order('last_message_at', { ascending: false }).limit(50)
      .then(({ data }) => { setThreads(data || []); setLoading(false); });
  }, []);

  const filtered = threads.filter(t => {
    if (tab === 'owner') return t.thread_type === 'owner';
    if (tab === 'guest') return t.thread_type === 'booking' || t.thread_type === 'support';
    if (tab === 'system') return t.thread_type === 'system';
    return true;
  }).filter(t => !search || t.subject?.toLowerCase().includes(search.toLowerCase()));

  const typeIcon = (type: string) => {
    if (type === 'owner') return <UserCheck className="h-4 w-4 text-primary" />;
    if (type === 'system') return <Bot className="h-4 w-4 text-muted-foreground" />;
    return <User className="h-4 w-4 text-amber-400" />;
  };

  const tabs = [
    { key: 'all', label: 'Alle', icon: MessageSquare },
    { key: 'owner', label: 'Ejere', icon: UserCheck },
    { key: 'guest', label: 'Gæster', icon: User },
    { key: 'system', label: 'System', icon: Bot },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader title="Beskeder" subtitle="Kommunikation med ejere, gæster og systemet" />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Søg i beskeder..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl bg-card/60 border-border/40" />
          </div>
          <div className="flex gap-1.5">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  tab === t.key
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />{t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/40 bg-card/60">
            <CardContent className="p-0">
              <EmptyState icon={MessageSquare} title="Ingen beskeder fundet" description="Du er helt ajour" />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(t => {
              const msgs = (t.messages as any[]) || [];
              const unread = msgs.filter(m => !m.is_read).length;
              const lastMsg = msgs[0];
              return (
                <Card key={t.id} className="border-border/40 bg-card/60 hover:bg-card/80 transition-all cursor-pointer">
                  <CardContent className="py-3.5 px-5 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                      {typeIcon(t.thread_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{t.subject || 'Uden emne'}</p>
                        {unread > 0 && (
                          <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                            {unread}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{lastMsg?.message || 'Ingen beskeder endnu'}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {t.last_message_at ? new Date(t.last_message_at).toLocaleDateString('da-DK') : ''}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
