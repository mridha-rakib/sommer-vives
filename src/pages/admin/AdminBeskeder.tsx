import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, UserCheck, User, Bot, Search, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function AdminBeskeder() {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('message_threads')
        .select('*, messages:chat_messages(id, message, sender_type, created_at, is_read)')
        .order('last_message_at', { ascending: false })
        .limit(50);
      setThreads(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = threads.filter(t => {
    if (tab === 'owner') return t.thread_type === 'owner';
    if (tab === 'guest') return t.thread_type === 'booking' || t.thread_type === 'support';
    if (tab === 'system') return t.thread_type === 'system';
    return true;
  }).filter(t => !search || t.subject?.toLowerCase().includes(search.toLowerCase()));

  const typeIcon = (type: string) => {
    if (type === 'owner') return <UserCheck className="h-3.5 w-3.5 text-primary" />;
    if (type === 'system') return <Bot className="h-3.5 w-3.5 text-muted-foreground" />;
    return <User className="h-3.5 w-3.5 text-amber-500" />;
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Beskeder</h1>
          <p className="text-sm text-muted-foreground">Kommunikation med ejere, gæster og systemet</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Søg i beskeder..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all" className="text-xs gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Alle</TabsTrigger>
            <TabsTrigger value="owner" className="text-xs gap-1.5"><UserCheck className="h-3.5 w-3.5" /> Ejere</TabsTrigger>
            <TabsTrigger value="guest" className="text-xs gap-1.5"><User className="h-3.5 w-3.5" /> Gæster</TabsTrigger>
            <TabsTrigger value="system" className="text-xs gap-1.5"><Bot className="h-3.5 w-3.5" /> System</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {loading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Ingen beskeder fundet</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {filtered.map(t => {
                  const msgs = (t.messages as any[]) || [];
                  const unread = msgs.filter(m => !m.is_read).length;
                  const lastMsg = msgs[0];
                  return (
                    <Card key={t.id} className="hover:bg-muted/30 transition-colors cursor-pointer">
                      <CardContent className="py-3 px-4 flex items-center gap-3">
                        {typeIcon(t.thread_type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{t.subject || 'Uden emne'}</p>
                            {unread > 0 && <Badge className="text-[10px] bg-primary text-primary-foreground">{unread}</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{lastMsg?.message || 'Ingen beskeder endnu'}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {t.last_message_at ? new Date(t.last_message_at).toLocaleDateString('da-DK') : ''}
                        </span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
