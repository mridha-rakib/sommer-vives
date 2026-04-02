import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { KPICard } from '@/components/admin/ui/KPICard';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, Archive, Target, MapPin, Mail, Phone, CalendarDays, RotateCcw, Trophy, XCircle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SOURCE_MAP: Record<string, string> = {
  beregn_lejeindtaegt: 'Beregn lejeindtægt', udlejningstjek: 'Book udlejningstjek',
  vil_udleje: 'Vil udleje', contact: 'Kontaktformular', website: 'Hjemmeside',
  referral: 'Anbefaling', social: 'SoMe', phone: 'Telefon', partner: 'Partner', other: 'Andet',
};

export default function AdminCrmArkiv() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [drawerLead, setDrawerLead] = useState<any | null>(null);

  const load = () => {
    setLoading(true);
    supabase.from('leads').select('*')
      .in('status', ['won', 'lost', 'converted', 'archived'])
      .order('updated_at', { ascending: false })
      .limit(200)
      .then(({ data }) => { setLeads(data || []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const reopen = async (lead: any) => {
    await supabase.from('leads').update({ status: 'new' }).eq('id', lead.id);
    toast.success(`${lead.name} genåbnet som nyt lead`);
    setDrawerLead(null);
    load();
  };

  const filtered = leads.filter(l => {
    if (tab === 'won' && l.status !== 'won' && l.status !== 'converted') return false;
    if (tab === 'lost' && l.status !== 'lost') return false;
    if (search && !l.name?.toLowerCase().includes(search.toLowerCase()) && !l.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const wonCount = leads.filter(l => l.status === 'won' || l.status === 'converted').length;
  const lostCount = leads.filter(l => l.status === 'lost').length;

  const tabs = [
    { key: 'all', label: 'Alle', count: leads.length },
    { key: 'won', label: 'Vundet', count: wonCount },
    { key: 'lost', label: 'Tabt', count: lostCount },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader title="Behandlede leads" subtitle="Arkiverede leads — vundne og tabte" />

        <div className="grid grid-cols-3 gap-4">
          <KPICard title="Totalt arkiveret" value={leads.length} icon={Archive} />
          <KPICard title="Vundne" value={wonCount} icon={Trophy} variant="success" />
          <KPICard title="Tabte" value={lostCount} icon={XCircle} variant="danger" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Søg i arkiv..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl bg-card/60 border-border/40" />
          </div>
          <div className="flex gap-1.5">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  tab === t.key
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
                )}
              >
                {t.label} <span className="text-muted-foreground/60 ml-0.5">{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/40 bg-card/60">
            <CardContent className="p-0">
              <EmptyState icon={Archive} title="Ingen arkiverede leads" description="Vundne og tabte leads vises her" />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(l => (
              <Card key={l.id} className="border-border/40 bg-card/60 hover:bg-card/80 hover:border-border/60 transition-all cursor-pointer" onClick={() => setDrawerLead(l)}>
                <CardContent className="py-3.5 px-5 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center shrink-0">
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{l.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {l.email && <span className="text-[11px] text-muted-foreground">{l.email}</span>}
                      {l.region && <span className="text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{l.region}</span>}
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {format(new Date(l.updated_at), 'd. MMM yyyy', { locale: da })}
                  </span>
                  <StatusChip
                    label={l.status === 'won' || l.status === 'converted' ? 'Vundet' : 'Tabt'}
                    variant={l.status === 'won' || l.status === 'converted' ? 'success' : 'danger'}
                    dot
                  />
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ═══════ DETAIL DRAWER ═══════ */}
      <Sheet open={!!drawerLead} onOpenChange={open => { if (!open) setDrawerLead(null); }}>
        <SheetContent className="w-full sm:max-w-lg p-0 border-l border-border/40 bg-background">
          {drawerLead && (
            <div className="flex flex-col h-full">
              <div className="px-6 pt-6 pb-4 border-b border-border/30">
                <SheetHeader className="mb-0">
                  <SheetTitle className="text-lg font-bold text-foreground">{drawerLead.name}</SheetTitle>
                  <div className="flex items-center gap-2 mt-1.5">
                    <StatusChip
                      label={drawerLead.status === 'won' || drawerLead.status === 'converted' ? 'Vundet' : 'Tabt'}
                      variant={drawerLead.status === 'won' || drawerLead.status === 'converted' ? 'success' : 'danger'}
                      dot size="md"
                    />
                    <span className="text-[11px] text-muted-foreground">·</span>
                    <span className="text-[11px] text-muted-foreground">{SOURCE_MAP[drawerLead.source] || drawerLead.source}</span>
                  </div>
                </SheetHeader>
              </div>

              <ScrollArea className="flex-1">
                <div className="px-6 py-5 space-y-5">
                  {/* Reopen action */}
                  <button
                    onClick={() => reopen(drawerLead)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all"
                  >
                    <RotateCcw className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Genåbn som nyt lead</span>
                  </button>

                  <Separator className="bg-border/30" />

                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">Kontaktoplysninger</p>
                    <div className="space-y-2.5">
                      {drawerLead.email && <InfoRow icon={Mail} label="Email" value={drawerLead.email} />}
                      {drawerLead.phone && <InfoRow icon={Phone} label="Telefon" value={drawerLead.phone} />}
                      {drawerLead.region && <InfoRow icon={MapPin} label="Region" value={drawerLead.region} />}
                      <InfoRow icon={Target} label="Kilde" value={SOURCE_MAP[drawerLead.source] || drawerLead.source} />
                      <InfoRow icon={CalendarDays} label="Oprettet" value={format(new Date(drawerLead.created_at), "d. MMMM yyyy", { locale: da })} />
                      <InfoRow icon={CalendarDays} label="Arkiveret" value={format(new Date(drawerLead.updated_at), "d. MMMM yyyy", { locale: da })} />
                    </div>
                  </div>

                  <Separator className="bg-border/30" />

                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">Noter</p>
                    <div className="rounded-xl bg-muted/15 border border-border/30 p-3.5">
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{drawerLead.notes || 'Ingen noter.'}</p>
                    </div>
                  </div>

                  {drawerLead.assigned_to && (
                    <>
                      <Separator className="bg-border/30" />
                      <div className="text-[11px] text-muted-foreground/50">
                        Ansvarlig: {drawerLead.assigned_to}
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>

              <div className="px-6 py-4 border-t border-border/30">
                <Button size="sm" className="rounded-xl w-full" onClick={() => setDrawerLead(null)}>Luk</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0"><Icon className="h-3.5 w-3.5 text-muted-foreground" /></div>
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium text-foreground">{value}</p></div>
    </div>
  );
}
