import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  ArrowLeft, Home, MapPin, Users, Bed, Bath, CheckCircle2, Clock, FolderOpen,
  Radio, Globe, FileText, ListChecks, MessageSquare, ShoppingBag,
  Calendar as CalendarIcon, Eye, Pencil, ExternalLink, Image,
  Tag, DollarSign, Wifi, AlertCircle, ChevronRight, StickyNote,
  Sparkles, Rocket, Zap, Camera, Info, ArrowRight
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type SVariant = 'info' | 'warning' | 'success' | 'muted' | 'danger';

const STATUS_MAP: Record<string, { label: string; variant: SVariant }> = {
  draft: { label: 'Kladde', variant: 'muted' },
  preparing: { label: 'Klargøring', variant: 'warning' },
  review: { label: 'Til gennemgang', variant: 'info' },
  ready: { label: 'Klar', variant: 'success' },
  live: { label: 'Live', variant: 'success' },
  paused: { label: 'Pauset', variant: 'danger' },
};

const SYNC_STATUS_MAP: Record<string, { label: string; variant: SVariant }> = {
  not_connected: { label: 'Ikke tilkoblet', variant: 'muted' },
  ready: { label: 'Klar', variant: 'info' },
  pending: { label: 'Venter', variant: 'warning' },
  synced: { label: 'Synkroniseret', variant: 'success' },
  error: { label: 'Fejl', variant: 'danger' },
};

// ─── Smart Next Steps Engine ───
interface NextStep {
  id: string;
  label: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  icon: any;
  tab?: string;
}

function computeNextSteps(listing: any): NextStep[] {
  const steps: NextStep[] = [];

  if (!listing.description) {
    steps.push({ id: 'desc', label: 'Tilføj beskrivelse', description: 'Mangler kort beskrivelse til listingen', priority: 'high', icon: FileText, tab: 'listing' });
  }
  if (!listing.long_description) {
    steps.push({ id: 'longdesc', label: 'Tilføj lang beskrivelse', description: 'Giver gæster det fulde overblik', priority: 'medium', icon: FileText, tab: 'listing' });
  }
  if ((listing.images?.length || 0) < 5) {
    const missing = 5 - (listing.images?.length || 0);
    steps.push({ id: 'images', label: `Upload ${missing} flere billeder`, description: `${listing.images?.length || 0}/5 minimum billeder`, priority: 'high', icon: Camera, tab: 'listing' });
  }
  if ((listing.images?.length || 0) >= 5 && (listing.images?.length || 0) < 15) {
    steps.push({ id: 'moreimages', label: 'Tilføj flere billeder', description: `${listing.images?.length} billeder — 15+ anbefales`, priority: 'low', icon: Camera, tab: 'listing' });
  }
  if (!listing.base_price_per_night) {
    steps.push({ id: 'price', label: 'Sæt pris per nat', description: 'Pris er påkrævet før publicering', priority: 'high', icon: DollarSign, tab: 'listing' });
  }
  if (!listing.house_rules) {
    steps.push({ id: 'rules', label: 'Tilføj husregler', description: 'Sæt klare regler for gæster', priority: 'medium', icon: AlertCircle, tab: 'listing' });
  }
  if (!listing.checkin_info && !listing.check_in_time) {
    steps.push({ id: 'checkin', label: 'Tilføj check-in info', description: 'Gæster har brug for ankomst-info', priority: 'medium', icon: Clock, tab: 'listing' });
  }
  if (!listing.hero_image) {
    steps.push({ id: 'hero', label: 'Vælg hovedbillede', description: 'Sæt et hero-billede til listingen', priority: 'high', icon: Image, tab: 'listing' });
  }
  if (!(listing.amenities?.length > 0)) {
    steps.push({ id: 'amenities', label: 'Tilføj faciliteter', description: 'WiFi, pool, parkering osv.', priority: 'medium', icon: Wifi, tab: 'listing' });
  }
  if (!listing.channel_airbnb_ready) {
    steps.push({ id: 'airbnb', label: 'Forbered Airbnb', description: 'Kanalspecifikt indhold mangler', priority: 'low', icon: Globe, tab: 'kanaler' });
  }
  if (!listing.channel_booking_ready) {
    steps.push({ id: 'booking', label: 'Forbered Booking.com', description: 'Kanalspecifikt indhold mangler', priority: 'low', icon: Globe, tab: 'kanaler' });
  }
  if (!(listing.highlights?.length > 0)) {
    steps.push({ id: 'highlights', label: 'Tilføj highlights', description: 'Fremhæv ejendommens styrker', priority: 'low', icon: Tag, tab: 'listing' });
  }

  // Sort by priority
  const prio: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return steps.sort((a, b) => prio[a.priority] - prio[b.priority]);
}

// ─── Subcomponents ───
function ReadinessRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="relative w-20 h-20">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="7" className="text-muted/30" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="7" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={color} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-foreground">{score}%</span>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0"><Icon className="h-3.5 w-3.5 text-muted-foreground" /></div>
      <div className="flex-1 min-w-0"><p className="text-xs text-muted-foreground">{label}</p><div className="text-sm font-medium text-foreground">{value}</div></div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, className }: { title: string; icon?: any; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-5', className)}>
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ChannelCard({ name, ready, title, description }: { name: string; ready: boolean | null; title: string | null; description: string | null }) {
  return (
    <div className={cn('rounded-xl border p-4 transition-all', ready ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border/40 bg-card/60')}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-foreground">{name}</span>
        <StatusChip label={ready ? 'Klar' : 'Ikke klar'} variant={ready ? 'success' : 'muted'} dot />
      </div>
      {title && <p className="text-xs text-muted-foreground truncate">Titel: {title}</p>}
      {description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>}
      {!title && !description && <p className="text-xs text-muted-foreground/50 italic">Ingen kanalspecifikt indhold endnu</p>}
    </div>
  );
}

function ChannelDotsLarge({ airbnb, booking, vrbo }: { airbnb: boolean | null; booking: boolean | null; vrbo: boolean | null }) {
  const Dot = ({ active, label }: { active: boolean | null; label: string }) => (
    <div className="flex items-center gap-1.5">
      <span className={cn('w-2.5 h-2.5 rounded-full', active ? 'bg-emerald-500' : 'bg-muted-foreground/30')} />
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5">
      <Dot active={airbnb} label="Airbnb" />
      <Dot active={booking} label="Booking" />
      <Dot active={vrbo} label="Vrbo" />
    </div>
  );
}

function MiniStat({ label, value, ok }: { label: string; value: string | number; ok: boolean }) {
  return (
    <div className={cn('rounded-lg border p-2.5 text-center', ok ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border/30 bg-muted/10')}>
      <p className={cn('text-sm font-bold', ok ? 'text-emerald-400' : 'text-muted-foreground')}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-4 text-center">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function TimelineItem({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-primary/40 shrink-0" />
      <div className="flex-1">
        <p className="text-xs text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{format(new Date(date), "d. MMMM yyyy 'kl.' HH:mm", { locale: da })}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───
export default function AdminSagDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<any>(null);
  const [owner, setOwner] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overblik');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: l } = await supabase.from('listings').select('*').eq('id', id).single();
      setListing(l);
      if (l) {
        const [{ data: prof }, { data: ts }, { data: docs }, { data: adds }, { data: bks }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', l.owner_id).single(),
          supabase.from('tasks').select('*').in('property_id', [id]).order('scheduled_date'),
          supabase.from('documents').select('*').eq('owner_id', l.owner_id).limit(20),
          supabase.from('add_ons').select('*').eq('listing_id', id),
          supabase.from('bookings').select('*').eq('property_id', id).order('check_in', { ascending: false }).limit(20),
        ]);
        setOwner(prof);
        setTasks(ts || []);
        setDocuments(docs || []);
        setAddons(adds || []);
        setBookings(bks || []);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const nextSteps = useMemo(() => listing ? computeNextSteps(listing) : [], [listing]);

  const handleImproveText = async () => {
    if (!listing) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('improve-listing-text', {
        body: { listing_id: listing.id },
      });
      if (error) throw error;
      toast.success('AI-tekst genereret — opdater listing manuelt');
    } catch (e: any) {
      toast.error(`AI-fejl: ${e.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const tabs = [
    { key: 'overblik', label: 'Overblik', icon: Eye },
    { key: 'listing', label: 'Listing', icon: Home },
    { key: 'kanaler', label: 'Kanaler', icon: Radio },
    { key: 'kalender', label: 'Kalender', icon: CalendarIcon },
    { key: 'tilkoeb', label: 'Tilkøb', icon: ShoppingBag },
    { key: 'dokumenter', label: 'Dokumenter', icon: FileText },
    { key: 'opgaver', label: 'Opgaver', icon: ListChecks },
    { key: 'noter', label: 'Noter', icon: StickyNote },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-56 rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
        </div>
      </AdminLayout>
    );
  }

  if (!listing) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => navigate('/admin/sager')} className="gap-2 rounded-xl"><ArrowLeft className="h-4 w-4" />Tilbage</Button>
          <EmptyState icon={FolderOpen} title="Sag ikke fundet" description="Denne sag eksisterer ikke" />
        </div>
      </AdminLayout>
    );
  }

  const st = STATUS_MAP[listing.internal_status || 'draft'] || STATUS_MAP.draft;
  const syncSt = SYNC_STATUS_MAP[listing.sync_status || 'not_connected'] || SYNC_STATUS_MAP.not_connected;
  const cover = listing.hero_image || listing.images?.[0];
  const score = listing.readiness_score || 0;
  const fmt = (v: number) => new Intl.NumberFormat('da-DK', { style: 'currency', currency: listing.currency || 'DKK', maximumFractionDigits: 0 }).format(v);

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* ═══════ TOP HERO SECTION ═══════ */}
        <div className="rounded-2xl border border-border/40 bg-card/60 overflow-hidden">
          {/* Cover band */}
          <div className="h-32 bg-muted/30 overflow-hidden relative">
            {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Home className="h-10 w-10 text-muted-foreground/15" /></div>}
            <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/50 to-transparent" />
            {/* Back button */}
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/sager')} className="absolute top-3 left-3 h-8 w-8 rounded-lg bg-background/60 backdrop-blur-sm hover:bg-background/80">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {/* Channel dots */}
            <div className="absolute top-3 right-3">
              <ChannelDotsLarge airbnb={listing.channel_airbnb_ready} booking={listing.channel_booking_ready} vrbo={listing.channel_vrbo_ready} />
            </div>
          </div>

          {/* Core info row */}
          <div className="px-6 pb-5 -mt-10 relative">
            <div className="flex flex-col lg:flex-row lg:items-end gap-5">
              {/* Left: Name + status + owner */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-foreground truncate">{listing.name}</h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <StatusChip label={st.label} variant={st.variant} dot size="md" />
                  {listing.region && <span className="text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{listing.region}</span>}
                  {owner && (
                    <>
                      <span className="text-muted-foreground/30">·</span>
                      <span className="text-[11px] text-muted-foreground">Ejer: <span className="font-medium text-foreground">{owner.full_name || owner.email}</span></span>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Readiness ring */}
              <div className="flex items-center gap-4 shrink-0">
                <ReadinessRing score={score} />
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Readiness</p>
                  <p className={cn('text-sm font-bold', score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400')}>
                    {score >= 80 ? 'Klar til publicering' : score >= 50 ? 'Næsten klar' : 'Kræver opmærksomhed'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Primary Actions Bar ─── */}
          <div className="px-6 pb-5 flex flex-wrap gap-2">
            <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setTab('listing')}>
              <Pencil className="h-3.5 w-3.5" />Redigér listing
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => setTab('overblik')}>
              <Rocket className="h-3.5 w-3.5" />Klargør listing
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={handleImproveText} disabled={aiLoading}>
              <Sparkles className="h-3.5 w-3.5" />{aiLoading ? 'AI arbejder…' : 'Forbedr tekst med AI'}
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => setTab('kanaler')}>
              <Globe className="h-3.5 w-3.5" />Forbered Airbnb
            </Button>
          </div>

          {/* ─── Smart Next Steps ─── */}
          {nextSteps.length > 0 && (
            <div className="px-6 pb-5">
              <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-primary" />
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">Næste skridt</p>
                  <span className="text-[10px] text-primary/60 bg-primary/10 px-2 py-0.5 rounded-full font-medium">{nextSteps.length} mangler</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {nextSteps.slice(0, 6).map(step => (
                    <button
                      key={step.id}
                      onClick={() => step.tab && setTab(step.tab)}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border text-left transition-all hover:shadow-sm',
                        step.priority === 'high'
                          ? 'border-red-500/20 bg-red-500/5 hover:border-red-500/30'
                          : step.priority === 'medium'
                          ? 'border-amber-500/15 bg-amber-500/5 hover:border-amber-500/25'
                          : 'border-border/30 bg-card/40 hover:border-border/50'
                      )}
                    >
                      <step.icon className={cn(
                        'h-4 w-4 mt-0.5 shrink-0',
                        step.priority === 'high' ? 'text-red-400' : step.priority === 'medium' ? 'text-amber-400' : 'text-muted-foreground'
                      )} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground">{step.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{step.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══════ TABS ═══════ */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all',
                tab === t.key
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/20 border border-transparent'
              )}
            >
              <t.icon className="h-3.5 w-3.5" />{t.label}
            </button>
          ))}
        </div>

        {/* ═══════ TAB CONTENT ═══════ */}

        {tab === 'overblik' && (
          <div className="space-y-6">
            {/* Key info grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <SectionCard title="Readiness" icon={CheckCircle2}>
                <div className="flex items-center justify-center py-2">
                  <ReadinessRing score={score} />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <MiniStat label="Billeder" value={listing.images?.length || 0} ok={(listing.images?.length || 0) >= 5} />
                  <MiniStat label="Beskrivelse" value={listing.description ? '✓' : '—'} ok={!!listing.description} />
                  <MiniStat label="Pris" value={listing.base_price_per_night ? '✓' : '—'} ok={!!listing.base_price_per_night} />
                  <MiniStat label="Regler" value={listing.house_rules ? '✓' : '—'} ok={!!listing.house_rules} />
                </div>
              </SectionCard>

              <SectionCard title="Nøgletal" icon={Home}>
                <div className="space-y-2.5">
                  <InfoRow icon={Users} label="Gæster" value={`${listing.max_guests}`} />
                  <InfoRow icon={Bed} label="Soveværelser" value={`${listing.bedrooms || '—'}`} />
                  <InfoRow icon={Bath} label="Badeværelser" value={`${listing.bathrooms || '—'}`} />
                  <InfoRow icon={DollarSign} label="Pris / nat" value={fmt(listing.base_price_per_night)} />
                  {listing.cleaning_fee && <InfoRow icon={Tag} label="Rengøring" value={fmt(listing.cleaning_fee)} />}
                  <InfoRow icon={Clock} label="Check-in / out" value={`${listing.check_in_time || '15:00'} / ${listing.check_out_time || '10:00'}`} />
                </div>
              </SectionCard>

              <SectionCard title="Ejer" icon={Eye}>
                {owner ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {(owner.full_name || owner.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{owner.full_name || 'Ukendt'}</p>
                        <p className="text-[11px] text-muted-foreground">{owner.email}</p>
                      </div>
                    </div>
                    {owner.phone && <p className="text-xs text-muted-foreground">{owner.phone}</p>}
                    <Button variant="outline" size="sm" className="rounded-xl text-xs w-full" onClick={() => navigate('/admin/crm/udlejere')}>Se ejerprofil</Button>
                  </div>
                ) : <p className="text-xs text-muted-foreground/50 italic">Ingen ejer tilknyttet</p>}
              </SectionCard>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickStat label="Bookings" value={bookings.length} />
              <QuickStat label="Opgaver" value={tasks.length} />
              <QuickStat label="Dokumenter" value={documents.length} />
              <QuickStat label="Tilkøb" value={addons.length} />
            </div>
          </div>
        )}

        {tab === 'listing' && (
          <div className="space-y-4">
            <SectionCard title="Indhold" icon={FileText}>
              <div className="space-y-4">
                <div><p className="text-xs text-muted-foreground mb-1">Tagline</p><p className="text-sm text-foreground">{listing.tagline || <span className="text-muted-foreground/50 italic">Ikke udfyldt</span>}</p></div>
                <Separator className="bg-border/30" />
                <div><p className="text-xs text-muted-foreground mb-1">Kort beskrivelse</p><p className="text-sm text-foreground whitespace-pre-wrap">{listing.description || <span className="text-muted-foreground/50 italic">Ikke udfyldt</span>}</p></div>
                <Separator className="bg-border/30" />
                <div><p className="text-xs text-muted-foreground mb-1">Lang beskrivelse</p><p className="text-sm text-foreground whitespace-pre-wrap line-clamp-6">{listing.long_description || <span className="text-muted-foreground/50 italic">Ikke udfyldt</span>}</p></div>
              </div>
            </SectionCard>

            <SectionCard title="Billeder" icon={Image}>
              {listing.images?.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {listing.images.map((img: string, i: number) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted/30">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground/50 italic">Ingen billeder uploadet</p>}
            </SectionCard>

            <SectionCard title="Faciliteter" icon={Wifi}>
              {listing.amenities?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map((a: string) => (
                    <span key={a} className="px-2.5 py-1 rounded-lg bg-muted/20 border border-border/30 text-xs text-foreground">{a}</span>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground/50 italic">Ingen faciliteter</p>}
            </SectionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="Highlights" icon={Tag}>
                {listing.highlights?.length > 0 ? (
                  <ul className="space-y-1.5">
                    {listing.highlights.map((h: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />{h}</li>
                    ))}
                  </ul>
                ) : <p className="text-xs text-muted-foreground/50 italic">Ingen highlights</p>}
              </SectionCard>

              <SectionCard title="Husregler" icon={AlertCircle}>
                <p className="text-sm text-foreground whitespace-pre-wrap">{listing.house_rules || <span className="text-muted-foreground/50 italic">Ikke udfyldt</span>}</p>
              </SectionCard>
            </div>
          </div>
        )}

        {tab === 'kanaler' && (
          <div className="space-y-4">
            <SectionCard title="Integration" icon={Globe}>
              <div className="space-y-2.5">
                <InfoRow icon={Globe} label="Channel Manager" value={listing.channel_manager_partner || 'Ingen'} />
                <InfoRow icon={ExternalLink} label="Eksternt listing ID" value={listing.external_listing_id || '—'} />
                <InfoRow icon={ExternalLink} label="Eksternt property ID" value={listing.external_property_id || '—'} />
                <InfoRow icon={Clock} label="Sidst synkroniseret" value={listing.last_sync_at ? format(new Date(listing.last_sync_at), "d. MMM yyyy 'kl.' HH:mm", { locale: da }) : 'Aldrig'} />
                <InfoRow icon={Radio} label="Sync status" value={<StatusChip label={syncSt.label} variant={syncSt.variant} dot />} />
                {listing.sync_error_message && <InfoRow icon={AlertCircle} label="Fejlbesked" value={listing.sync_error_message} />}
              </div>
            </SectionCard>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <ChannelCard name="Airbnb" ready={listing.channel_airbnb_ready} title={listing.channel_airbnb_title} description={listing.channel_airbnb_description} />
              <ChannelCard name="Booking.com" ready={listing.channel_booking_ready} title={listing.channel_booking_title} description={listing.channel_booking_description} />
              <ChannelCard name="Vrbo" ready={listing.channel_vrbo_ready} title={listing.channel_vrbo_title} description={listing.channel_vrbo_description} />
            </div>
          </div>
        )}

        {tab === 'kalender' && (
          <SectionCard title="Kalender & bookings" icon={CalendarIcon}>
            {bookings.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 italic py-4 text-center">Ingen bookings endnu</p>
            ) : (
              <div className="space-y-2">
                {bookings.map(b => (
                  <div key={b.id} className="rounded-xl border border-border/30 bg-muted/10 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{b.guest_name || b.case_number || b.id.slice(0, 8)}</p>
                      <p className="text-[11px] text-muted-foreground">{format(new Date(b.check_in), 'd. MMM', { locale: da })} → {format(new Date(b.check_out), 'd. MMM yyyy', { locale: da })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{fmt(Number(b.total_amount))}</p>
                      <StatusChip label={b.status || 'pending'} variant={b.status === 'confirmed' ? 'success' : b.status === 'cancelled' ? 'danger' : 'warning'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {tab === 'tilkoeb' && (
          <SectionCard title="Tilkøb & ekstraydelser" icon={ShoppingBag}>
            {addons.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 italic py-4 text-center">Ingen tilkøb konfigureret</p>
            ) : (
              <div className="space-y-2">
                {addons.map(a => (
                  <div key={a.id} className="rounded-xl border border-border/30 bg-muted/10 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.name}</p>
                      {a.description && <p className="text-[11px] text-muted-foreground mt-0.5">{a.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{a.price} kr</span>
                      <StatusChip label={a.is_active ? 'Aktiv' : 'Inaktiv'} variant={a.is_active ? 'success' : 'muted'} dot />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {tab === 'dokumenter' && (
          <SectionCard title="Dokumenter" icon={FileText}>
            {documents.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 italic py-4 text-center">Ingen dokumenter endnu</p>
            ) : (
              <div className="space-y-2">
                {documents.map(d => (
                  <div key={d.id} className="rounded-xl border border-border/30 bg-muted/10 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center"><FileText className="h-4 w-4 text-muted-foreground" /></div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.title}</p>
                        <p className="text-[11px] text-muted-foreground">{d.document_type} · {format(new Date(d.created_at), 'd. MMM yyyy', { locale: da })}</p>
                      </div>
                    </div>
                    <StatusChip label={d.status} variant={d.status === 'active' ? 'success' : 'muted'} />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {tab === 'opgaver' && (
          <SectionCard title="Opgaver" icon={ListChecks}>
            {tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 italic py-4 text-center">Ingen opgaver endnu</p>
            ) : (
              <div className="space-y-2">
                {tasks.map(t => (
                  <div key={t.id} className="rounded-xl border border-border/30 bg-muted/10 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.task_type}</p>
                      <p className="text-[11px] text-muted-foreground">{format(new Date(t.scheduled_date), 'd. MMM yyyy', { locale: da })} {t.assigned_to ? `· ${t.assigned_to}` : ''}</p>
                    </div>
                    <StatusChip label={t.status || 'pending'} variant={t.status === 'completed' ? 'success' : t.status === 'in_progress' ? 'info' : 'warning'} />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {tab === 'noter' && (
          <SectionCard title="Noter & aktivitet" icon={MessageSquare}>
            <div className="rounded-xl bg-muted/15 border border-border/30 p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {listing.practical_info || 'Ingen interne noter endnu.'}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-border/30">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">Tidslinje</p>
              <div className="space-y-3">
                <TimelineItem label="Sag oprettet" date={listing.created_at} />
                <TimelineItem label="Sidst opdateret" date={listing.updated_at} />
                {listing.last_sync_at && <TimelineItem label="Sidst synkroniseret" date={listing.last_sync_at} />}
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </AdminLayout>
  );
}
