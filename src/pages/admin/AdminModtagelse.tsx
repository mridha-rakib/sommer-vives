import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { StatusChip, type StatusVariant } from '@/components/admin/ui/StatusChip';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Inbox, FileSignature, Upload, FileText, Search, Filter,
  Eye, Link2, FolderOpen, Archive, ListChecks, User,
  Clock, ChevronRight, CheckCircle2, AlertCircle, MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/* ── Types ── */
type IntakeStatus = 'ny' | 'under_behandling' | 'klar_til_arkivering' | 'arkiveret';
type IntakeType = 'agreement' | 'document' | 'onboarding' | 'personal_data';

interface IntakeItem {
  id: string;
  type: IntakeType;
  title: string;
  sender: string;
  senderEmail?: string;
  date: string;
  status: IntakeStatus;
  linkedEntity?: string;
  linkedEntityType?: 'lead' | 'owner' | 'sag';
  detail?: string;
  raw?: any;
}

/* ── Config ── */
const STATUS_CFG: Record<IntakeStatus, { label: string; variant: StatusVariant; icon: React.ElementType }> = {
  ny:                   { label: 'Ny',                  variant: 'info',    icon: AlertCircle },
  under_behandling:     { label: 'Under behandling',    variant: 'warning', icon: Clock },
  klar_til_arkivering:  { label: 'Klar til arkivering', variant: 'success', icon: CheckCircle2 },
  arkiveret:            { label: 'Arkiveret',           variant: 'muted',   icon: Archive },
};

const TYPE_CFG: Record<IntakeType, { label: string; icon: React.ElementType; color: string }> = {
  agreement:     { label: 'Formidlingsaftale', icon: FileSignature, color: 'text-emerald-400' },
  document:      { label: 'Dokument',          icon: FileText,      color: 'text-blue-400' },
  onboarding:    { label: 'Onboarding',        icon: User,          color: 'text-amber-400' },
  personal_data: { label: 'Persondata',        icon: Upload,        color: 'text-violet-400' },
};

function mapAgreementStatus(s: string): IntakeStatus {
  if (s === 'signed') return 'klar_til_arkivering';
  if (s === 'sent' || s === 'generated') return 'ny';
  return 'arkiveret';
}

export default function AdminModtagelse() {
  const [items, setItems] = useState<IntakeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<IntakeType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IntakeStatus | 'all'>('all');
  const [selected, setSelected] = useState<IntakeItem | null>(null);

  useEffect(() => {
    async function load() {
      const [agr, doc] = await Promise.all([
        supabase.from('agreements').select('*').order('updated_at', { ascending: false }).limit(50),
        supabase.from('documents').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      const mapped: IntakeItem[] = [
        ...(agr.data || []).map((a: any) => ({
          id: a.id,
          type: 'agreement' as IntakeType,
          title: a.property_title || 'Formidlingsaftale',
          sender: a.owner_name || a.owner_email || 'Ukendt',
          senderEmail: a.owner_email,
          date: a.signed_at || a.updated_at || a.created_at,
          status: mapAgreementStatus(a.status),
          detail: `${a.commission_percent}% provision · ${a.binding_months} mdr. binding`,
          raw: a,
        })),
        ...(doc.data || []).map((d: any) => ({
          id: d.id,
          type: 'document' as IntakeType,
          title: d.title,
          sender: 'Ejer',
          date: d.created_at,
          status: (d.status === 'active' ? 'ny' : 'arkiveret') as IntakeStatus,
          detail: d.document_type,
          raw: d,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setItems(mapped);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return item.title.toLowerCase().includes(q) || item.sender.toLowerCase().includes(q);
      }
      return true;
    });
  }, [items, typeFilter, statusFilter, search]);

  const counts = useMemo(() => ({
    all: items.length,
    ny: items.filter(i => i.status === 'ny').length,
    under_behandling: items.filter(i => i.status === 'under_behandling').length,
    klar_til_arkivering: items.filter(i => i.status === 'klar_til_arkivering').length,
  }), [items]);

  const updateStatus = (id: string, newStatus: IntakeStatus) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Modtagelsescenter"
          subtitle="Indgående aftaler, dokumenter og onboarding-materiale"
          actions={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-2.5 py-1">
                {counts.ny} nye
              </Badge>
            </div>
          }
        />

        {/* ── KPI row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            { label: 'I alt modtaget', value: counts.all, icon: Inbox, color: 'text-foreground' },
            { label: 'Nye / ubehandlede', value: counts.ny, icon: AlertCircle, color: 'text-blue-400' },
            { label: 'Under behandling', value: counts.under_behandling, icon: Clock, color: 'text-amber-400' },
            { label: 'Klar til arkivering', value: counts.klar_til_arkivering, icon: CheckCircle2, color: 'text-emerald-400' },
          ] as const).map(kpi => (
            <div key={kpi.label} className="rounded-xl border border-border/40 bg-card/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-[11px] text-muted-foreground font-medium">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Søg i modtagelser..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 bg-muted/20 border-border/40 rounded-xl text-sm"
            />
          </div>

          <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as any)} className="w-auto">
            <TabsList className="h-9 bg-muted/20 border border-border/30 rounded-xl p-0.5">
              <TabsTrigger value="all" className="text-xs rounded-lg px-3 h-7">Alle</TabsTrigger>
              <TabsTrigger value="ny" className="text-xs rounded-lg px-3 h-7">Nye</TabsTrigger>
              <TabsTrigger value="under_behandling" className="text-xs rounded-lg px-3 h-7">Behandles</TabsTrigger>
              <TabsTrigger value="klar_til_arkivering" className="text-xs rounded-lg px-3 h-7">Klar</TabsTrigger>
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 rounded-xl border-border/40 text-xs gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                {typeFilter === 'all' ? 'Alle typer' : TYPE_CFG[typeFilter].label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setTypeFilter('all')}>Alle typer</DropdownMenuItem>
              <DropdownMenuSeparator />
              {(Object.entries(TYPE_CFG) as [IntakeType, typeof TYPE_CFG[IntakeType]][]).map(([key, cfg]) => (
                <DropdownMenuItem key={key} onClick={() => setTypeFilter(key)}>
                  <cfg.icon className={`w-3.5 h-3.5 mr-2 ${cfg.color}`} />
                  {cfg.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Inbox list ── */}
        {loading ? (
          <div className="space-y-2">
            {[0,1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Inbox} title="Ingen modtagelser" subtitle="Der er ingen elementer der matcher dine filtre." className="py-16" />
        ) : (
          <div className="rounded-xl border border-border/40 bg-card/40 divide-y divide-border/30 overflow-hidden">
            {filtered.map(item => {
              const typeCfg = TYPE_CFG[item.type];
              const statusCfg = STATUS_CFG[item.status];
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/15 transition-colors cursor-pointer group"
                  onClick={() => setSelected(item)}
                >
                  {/* Type icon */}
                  <div className="w-9 h-9 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                    <typeCfg.icon className={`w-4 h-4 ${typeCfg.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      {item.status === 'ny' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {item.sender}{item.detail ? ` · ${item.detail}` : ''}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="hidden sm:flex items-center gap-3 shrink-0">
                    <StatusChip label={statusCfg.label} variant={statusCfg.variant} dot size="sm" />
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Detail drawer ── */}
      <Sheet open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-lg bg-card border-border/50 overflow-y-auto">
          {selected && (() => {
            const typeCfg = TYPE_CFG[selected.type];
            const statusCfg = STATUS_CFG[selected.status];
            return (
              <>
                <SheetHeader className="pb-4 border-b border-border/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center`}>
                      <typeCfg.icon className={`w-5 h-5 ${typeCfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <SheetTitle className="text-base font-semibold text-foreground truncate">{selected.title}</SheetTitle>
                      <p className="text-xs text-muted-foreground">{typeCfg.label}</p>
                    </div>
                  </div>
                  <StatusChip label={statusCfg.label} variant={statusCfg.variant} dot />
                </SheetHeader>

                {/* Info */}
                <div className="py-5 space-y-4 border-b border-border/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1">Afsender</p>
                      <p className="text-sm font-medium text-foreground">{selected.sender}</p>
                      {selected.senderEmail && <p className="text-[11px] text-muted-foreground">{selected.senderEmail}</p>}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1">Modtaget</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(selected.date).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {selected.detail && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1">Detaljer</p>
                      <p className="text-sm text-foreground">{selected.detail}</p>
                    </div>
                  )}
                  {selected.linkedEntity && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1">Knyttet til</p>
                      <Badge variant="outline" className="text-xs">{selected.linkedEntity}</Badge>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="py-5 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-3">Handlinger</p>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="justify-start gap-2 rounded-xl border-border/40 text-xs h-9">
                      <Eye className="w-3.5 h-3.5" /> Åbn
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start gap-2 rounded-xl border-border/40 text-xs h-9">
                      <FolderOpen className="w-3.5 h-3.5" /> Knyt til sag
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start gap-2 rounded-xl border-border/40 text-xs h-9">
                      <User className="w-3.5 h-3.5" /> Knyt til ejer
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start gap-2 rounded-xl border-border/40 text-xs h-9">
                      <FileText className="w-3.5 h-3.5" /> Opret dokument
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start gap-2 rounded-xl border-border/40 text-xs h-9">
                      <ListChecks className="w-3.5 h-3.5" /> Opret opgave
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start gap-2 rounded-xl border-border/40 text-xs h-9">
                      <Link2 className="w-3.5 h-3.5" /> Knyt til lead
                    </Button>
                  </div>
                </div>

                {/* Status change */}
                <div className="py-5 border-t border-border/30 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-3">Skift status</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(STATUS_CFG) as [IntakeStatus, typeof STATUS_CFG[IntakeStatus]][]).map(([key, cfg]) => (
                      <Button
                        key={key}
                        variant={selected.status === key ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-xl text-xs h-8 gap-1.5"
                        onClick={() => updateStatus(selected.id, key)}
                      >
                        <cfg.icon className="w-3 h-3" />
                        {cfg.label}
                      </Button>
                    ))}
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
