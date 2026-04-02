import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  Search, Plus, Mail, Phone, Building2, MapPin,
  MoreHorizontal, UserCheck, FileText, Wallet, MessageSquare,
  ListChecks, ChevronRight, X, Send, PhoneCall, Download
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { KPICard } from '@/components/admin/ui/KPICard';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Owner {
  id: string; email: string; full_name: string | null; phone: string | null;
  company_name: string | null; case_number: string | null; created_at: string;
  property_count?: number; total_earnings?: number; agreement_status?: string;
  properties?: any[]; bookings_count?: number;
}

const AGREEMENT_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'muted' | 'info' | 'danger' }> = {
  signed: { label: 'Underskrevet', variant: 'success' },
  sent: { label: 'Afventer', variant: 'warning' },
  draft: { label: 'Kladde', variant: 'muted' },
};

export default function AdminOwners() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [drawerOwner, setDrawerOwner] = useState<Owner | null>(null);
  const [tab, setTab] = useState('info');
  const [ownerProperties, setOwnerProperties] = useState<any[]>([]);
  const [ownerAgreements, setOwnerAgreements] = useState<any[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: ownerRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'owner');
    const ownerIds = ownerRoles?.map(r => r.user_id) || [];
    if (ownerIds.length === 0) { setOwners([]); setLoading(false); return; }

    const [{ data: profiles }, { data: properties }, { data: bookings }, { data: agreements }] = await Promise.all([
      supabase.from('profiles').select('*').in('id', ownerIds),
      supabase.from('listings').select('owner_id, id'),
      supabase.from('bookings').select('owner_id, owner_payout').neq('status', 'cancelled'),
      supabase.from('agreements').select('owner_id, status'),
    ]);

    const mapped = (profiles || []).map(p => {
      const propCount = properties?.filter(pr => pr.owner_id === p.id).length || 0;
      const earnings = bookings?.filter(b => b.owner_id === p.id).reduce((s, b) => s + (Number(b.owner_payout) || 0), 0) || 0;
      const latestAgreement = agreements?.find(a => a.owner_id === p.id);
      return { ...p, property_count: propCount, total_earnings: earnings, agreement_status: latestAgreement?.status || null, bookings_count: bookings?.filter(b => b.owner_id === p.id).length || 0 };
    });

    setOwners(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const openDrawer = async (owner: Owner) => {
    setDrawerOwner(owner);
    setTab('info');
    const [{ data: props }, { data: agrs }, { data: bks }] = await Promise.all([
      supabase.from('properties').select('*').eq('owner_id', owner.id),
      supabase.from('agreements').select('*').eq('owner_id', owner.id).order('created_at', { ascending: false }),
      supabase.from('bookings').select('*').eq('owner_id', owner.id).order('check_in', { ascending: false }).limit(20),
    ]);
    setOwnerProperties(props || []);
    setOwnerAgreements(agrs || []);
    setOwnerBookings(bks || []);
  };

  const filtered = owners.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return o.full_name?.toLowerCase().includes(q) || o.email.toLowerCase().includes(q) || o.phone?.includes(q) || o.company_name?.toLowerCase().includes(q);
  });

  const totalEarnings = owners.reduce((s, o) => s + (o.total_earnings || 0), 0);
  const totalProps = owners.reduce((s, o) => s + (o.property_count || 0), 0);
  const signedCount = owners.filter(o => o.agreement_status === 'signed').length;

  const fmt = (v: number) => new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 0 }).format(v);

  const drawerTabs = [
    { key: 'info', label: 'Profil' },
    { key: 'properties', label: 'Boliger' },
    { key: 'agreements', label: 'Aftaler' },
    { key: 'bookings', label: 'Bookings' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader title="Udlejere" subtitle={`${owners.length} ejere i systemet`} />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Ejere" value={owners.length} icon={UserCheck} variant="gold" />
          <KPICard title="Boliger" value={totalProps} icon={Building2} />
          <KPICard title="Underskrevne aftaler" value={signedCount} icon={FileText} variant="success" />
          <KPICard title="Total udbetalt" value={fmt(totalEarnings)} icon={Wallet} variant="gold" />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Søg på navn, email, firma..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl bg-card/60 border-border/40" />
        </div>

        {/* Owner list */}
        {loading ? (
          <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/40 bg-card/60"><CardContent className="p-0"><EmptyState icon={UserCheck} title="Ingen ejere fundet" description="Tilpas din søgning" /></CardContent></Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(o => (
              <Card key={o.id} className="border-border/40 bg-card/60 hover:bg-card/80 hover:border-border/60 transition-all cursor-pointer" onClick={() => openDrawer(o)}>
                <CardContent className="py-4 px-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {(o.full_name || o.email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{o.full_name || o.email}</p>
                      {o.case_number && <span className="text-[10px] text-muted-foreground/60 font-mono">{o.case_number}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{o.email}</span>
                      {o.phone && <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{o.phone}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-medium text-foreground">{o.property_count} {o.property_count === 1 ? 'bolig' : 'boliger'}</p>
                      <p className="text-[11px] text-muted-foreground">{fmt(o.total_earnings || 0)}</p>
                    </div>
                    {o.agreement_status && AGREEMENT_STATUS[o.agreement_status] && (
                      <StatusChip label={AGREEMENT_STATUS[o.agreement_status].label} variant={AGREEMENT_STATUS[o.agreement_status].variant} dot />
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ═══════ DETAIL DRAWER ═══════ */}
      <Sheet open={!!drawerOwner} onOpenChange={open => { if (!open) setDrawerOwner(null); }}>
        <SheetContent className="w-full sm:max-w-lg p-0 border-l border-border/40 bg-background">
          {drawerOwner && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-border/30">
                <SheetHeader className="mb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                      {(drawerOwner.full_name || drawerOwner.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <SheetTitle className="text-lg font-bold text-foreground">{drawerOwner.full_name || 'Ukendt'}</SheetTitle>
                      <div className="flex items-center gap-2 mt-0.5">
                        {drawerOwner.case_number && <span className="text-[11px] text-muted-foreground font-mono">{drawerOwner.case_number}</span>}
                        {drawerOwner.company_name && <><span className="text-[11px] text-muted-foreground/40">·</span><span className="text-[11px] text-muted-foreground">{drawerOwner.company_name}</span></>}
                      </div>
                    </div>
                  </div>
                </SheetHeader>

                {/* Quick actions */}
                <div className="flex gap-2 mt-4">
                  {drawerOwner.phone && (
                    <a href={`tel:${drawerOwner.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/40 bg-card/60 hover:bg-muted/30 text-xs font-medium transition-all">
                      <PhoneCall className="h-3.5 w-3.5 text-primary" />Ring
                    </a>
                  )}
                  <a href={`mailto:${drawerOwner.email}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/40 bg-card/60 hover:bg-muted/30 text-xs font-medium transition-all">
                    <Send className="h-3.5 w-3.5 text-primary" />Email
                  </a>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-4">
                  {drawerTabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', tab === t.key ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground border border-transparent')}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="px-6 py-5 space-y-5">
                  {tab === 'info' && (
                    <>
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">Kontaktoplysninger</p>
                        <div className="space-y-2.5">
                          <InfoRow icon={Mail} label="Email" value={drawerOwner.email} />
                          <InfoRow icon={Phone} label="Telefon" value={drawerOwner.phone || '—'} />
                          {drawerOwner.company_name && <InfoRow icon={Building2} label="Firma" value={drawerOwner.company_name} />}
                          <InfoRow icon={UserCheck} label="Oprettet" value={format(new Date(drawerOwner.created_at), "d. MMMM yyyy", { locale: da })} />
                        </div>
                      </div>
                      <Separator className="bg-border/30" />
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">Overblik</p>
                        <div className="grid grid-cols-3 gap-3">
                          <MiniStat label="Boliger" value={drawerOwner.property_count || 0} />
                          <MiniStat label="Bookings" value={drawerOwner.bookings_count || 0} />
                          <MiniStat label="Udbetalt" value={fmt(drawerOwner.total_earnings || 0)} />
                        </div>
                      </div>
                    </>
                  )}

                  {tab === 'properties' && (
                    ownerProperties.length === 0 ? (
                      <p className="text-xs text-muted-foreground/60 italic py-8 text-center">Ingen boliger endnu</p>
                    ) : ownerProperties.map(p => (
                      <Card key={p.id} className="border-border/40 bg-card/60">
                        <CardContent className="py-3 px-4">
                          <p className="text-sm font-medium text-foreground">{p.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{p.region || p.address}</span>
                            {p.case_number && <span className="text-[10px] text-muted-foreground font-mono">{p.case_number}</span>}
                          </div>
                          <StatusChip label={p.status === 'published' ? 'Live' : p.status} variant={p.status === 'published' ? 'success' : 'muted'} dot className="mt-2" />
                        </CardContent>
                      </Card>
                    ))
                  )}

                  {tab === 'agreements' && (
                    ownerAgreements.length === 0 ? (
                      <p className="text-xs text-muted-foreground/60 italic py-8 text-center">Ingen aftaler endnu</p>
                    ) : ownerAgreements.map(a => (
                      <Card key={a.id} className="border-border/40 bg-card/60">
                        <CardContent className="py-3 px-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{a.property_title || 'Aftale'}</p>
                            <p className="text-[11px] text-muted-foreground">{a.commission_percent}% kommission · {format(new Date(a.created_at), 'd. MMM yyyy', { locale: da })}</p>
                          </div>
                          <StatusChip
                            label={AGREEMENT_STATUS[a.status]?.label || a.status}
                            variant={AGREEMENT_STATUS[a.status]?.variant || 'muted'}
                            dot
                          />
                        </CardContent>
                      </Card>
                    ))
                  )}

                  {tab === 'bookings' && (
                    ownerBookings.length === 0 ? (
                      <p className="text-xs text-muted-foreground/60 italic py-8 text-center">Ingen bookings endnu</p>
                    ) : ownerBookings.map(b => (
                      <Card key={b.id} className="border-border/40 bg-card/60">
                        <CardContent className="py-3 px-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{b.guest_name || b.case_number || b.id.slice(0, 8)}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {format(new Date(b.check_in), 'd. MMM', { locale: da })} → {format(new Date(b.check_out), 'd. MMM yyyy', { locale: da })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-foreground">{fmt(Number(b.total_amount))}</p>
                            <StatusChip label={b.status} variant={b.status === 'confirmed' ? 'success' : b.status === 'pending' ? 'warning' : 'muted'} />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
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

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/40 bg-muted/10 p-3 text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}
