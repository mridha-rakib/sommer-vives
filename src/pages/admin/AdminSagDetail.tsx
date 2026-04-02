import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  ArrowLeft, Home, MapPin, Users, Bed, Bath, CheckCircle2, Clock, FolderOpen,
  Radio, Globe, FileText, ListChecks, MessageSquare, ShoppingBag,
  Calendar as CalendarIcon, Eye, Pencil, ExternalLink, Image,
  Tag, DollarSign, Wifi, AlertCircle, ChevronRight, StickyNote,
  Sparkles, Rocket, Zap, Camera, Info, ArrowRight, X, Plus,
  AlertTriangle, Settings, Type, Plug, RefreshCw, Send, Link2, Download, User, Shield
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Beds24Integration } from '@/components/admin/Beds24Integration';
import { Beds24MappingSection } from '@/components/admin/Beds24MappingSection';
import { Beds24ReadinessEngine } from '@/components/admin/Beds24ReadinessEngine';
import { Beds24PublishDialog } from '@/components/admin/Beds24PublishDialog';
import { Beds24SyncLog } from '@/components/admin/Beds24SyncLog';
import { PublishFlowModal } from '@/components/admin/PublishFlowModal';

type SVariant = 'info' | 'warning' | 'success' | 'muted' | 'danger';

const STATUS_MAP: Record<string, { label: string; variant: SVariant }> = {
  udlejningstjek:  { label: 'Udlejningstjek',           variant: 'warning' },
  foer_salg:       { label: 'Før salg',                  variant: 'info' },
  til_leje:        { label: 'Til leje',                  variant: 'success' },
  retur:           { label: 'Retur',                     variant: 'muted' },
  tabt_vil_ikke:   { label: 'Tabt – Vil ikke udleje',   variant: 'danger' },
  tabt_konkurrent: { label: 'Tabt – Til konkurrent',    variant: 'danger' },
  // Legacy fallbacks
  draft:     { label: 'Kladde',          variant: 'muted' },
  preparing: { label: 'Klargøring',      variant: 'warning' },
  review:    { label: 'Til gennemgang',   variant: 'info' },
  ready:     { label: 'Klar',            variant: 'success' },
  live:      { label: 'Til leje',        variant: 'success' },
  paused:    { label: 'Pauset',          variant: 'danger' },
};

const SYNC_STATUS_MAP: Record<string, { label: string; variant: SVariant }> = {
  not_connected: { label: 'Ikke tilkoblet', variant: 'muted' },
  ready: { label: 'Klar', variant: 'info' },
  pending: { label: 'Venter', variant: 'warning' },
  synced: { label: 'Synkroniseret', variant: 'success' },
  error: { label: 'Fejl', variant: 'danger' },
};

const STAGE_OPTIONS = [
  { key: 'udlejningstjek', label: 'Udlejningstjek' },
  { key: 'foer_salg', label: 'Før salg' },
  { key: 'til_leje', label: 'Til leje' },
  { key: 'retur', label: 'Retur' },
  { key: 'tabt_vil_ikke', label: 'Tabt – Vil ikke' },
  { key: 'tabt_konkurrent', label: 'Tabt – Konkurrent' },
];

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

// ─── Common amenities for quick-select ───
const COMMON_AMENITIES = [
  'WiFi', 'Parkering', 'Opvaskemaskine', 'Vaskemaskine', 'Tørretumbler',
  'Brændeovn', 'Grill', 'Terrasse', 'Have', 'Spa/Jacuzzi',
  'Sauna', 'Pool', 'Husdyr tilladt', 'Børnevenlig', 'Handicapvenlig',
  'Havudsigt', 'Søudsigt', 'Skovudsigt',
];

// ─── Inline Listing Editor ───
function InlineListingEditor({ listing, onSaved }: { listing: any; onSaved: (data: any) => void }) {
  const [editSection, setEditSection] = useState(0);
  const [form, setForm] = useState(() => ({
    name: listing.name || '', description: listing.description || '', address: listing.address || '',
    region: listing.region || '', city: listing.city || '', tagline: listing.tagline || '',
    property_type: listing.property_type || '',
    max_guests: listing.max_guests || 1, bedrooms: listing.bedrooms || 1, bathrooms: listing.bathrooms || 1,
    base_price_per_night: (listing.base_price_per_night || 0) / 100,
    cleaning_fee: (listing.cleaning_fee || 0) / 100,
    weekend_price_per_night: (listing.weekend_price_per_night || 0) / 100,
    min_nights: listing.min_nights || 1, max_nights: listing.max_nights || 30,
    check_in_time: listing.check_in_time || '15:00', check_out_time: listing.check_out_time || '10:00',
    is_active: listing.is_active, house_rules: listing.house_rules || '',
    practical_info: listing.practical_info || '', checkin_info: listing.checkin_info || '',
    checkout_info: listing.checkout_info || '',
    hero_image: listing.hero_image || '', amenities: listing.amenities || [], images: listing.images || [],
  }));
  const [newAmenity, setNewAmenity] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef(form);
  formRef.current = form;

  const persistFn = useCallback(async (data: typeof form) => {
    setSaving(true);
    const payload: Record<string, any> = {
      name: data.name, description: data.description || null,
      address: data.address || null, region: data.region || null, city: data.city || null,
      max_guests: data.max_guests, bedrooms: data.bedrooms, bathrooms: data.bathrooms,
      base_price_per_night: Math.round(data.base_price_per_night * 100),
      cleaning_fee: Math.round(data.cleaning_fee * 100),
      weekend_price_per_night: Math.round(data.weekend_price_per_night * 100) || null,
      min_nights: data.min_nights, max_nights: data.max_nights,
      check_in_time: data.check_in_time, check_out_time: data.check_out_time,
      is_active: data.is_active, house_rules: data.house_rules || null,
      practical_info: data.practical_info || null,
      checkin_info: data.checkin_info || null, checkout_info: data.checkout_info || null,
      amenities: data.amenities, images: data.images,
      hero_image: data.hero_image || (data.images.length > 0 ? data.images[0] : null),
      property_type: data.property_type || null, tagline: data.tagline || null,
    };
    const { error } = await supabase.from('listings').update(payload).eq('id', listing.id);
    setSaving(false);
    if (error) { toast.error(`Fejl: ${error.message}`); } else { setLastSaved(new Date()); onSaved(payload); }
  }, [listing.id, onSaved]);

  const scheduleSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => persistFn(formRef.current), 2000);
  }, [persistFn]);

  useEffect(() => () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); }, []);

  const upd = (key: string, value: any) => { setForm(prev => ({ ...prev, [key]: value })); scheduleSave(); };
  const toggleAm = (a: string) => {
    const has = form.amenities.includes(a);
    upd('amenities', has ? form.amenities.filter((x: string) => x !== a) : [...form.amenities, a]);
  };

  const EF = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div className="space-y-1.5"><Label className="text-sm font-medium text-foreground">{label}</Label>{hint && <p className="text-xs text-muted-foreground -mt-0.5">{hint}</p>}{children}</div>
  );
  const ER = ({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 }) => (
    <div className={`grid ${cols === 3 ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'} gap-4`}>{children}</div>
  );

  const readinessChecks = [
    { label: 'Titel', ok: !!form.name.trim(), fix: 'Tilføj en titel', s: 0 },
    { label: 'Adresse', ok: !!form.address.trim(), fix: 'Tilføj adresse', s: 0 },
    { label: 'Beskrivelse', ok: form.description.trim().length >= 20, fix: 'Skriv en beskrivelse (min. 20 tegn)', s: 1 },
    { label: 'Hero-billede', ok: !!form.hero_image.trim(), fix: 'Vælg et hovedbillede', s: 2 },
    { label: 'Min. 5 billeder', ok: form.images.filter((i: string) => i.trim()).length >= 5, fix: `Mangler ${Math.max(0, 5 - form.images.filter((i: string) => i.trim()).length)} billeder`, s: 2 },
    { label: 'Faciliteter', ok: form.amenities.length >= 3, fix: `Tilføj ${Math.max(0, 3 - form.amenities.length)} flere`, s: 3 },
    { label: 'Pris pr. nat', ok: form.base_price_per_night > 0, fix: 'Sæt en pris per nat', s: 4 },
    { label: 'Check-in info', ok: !!form.checkin_info.trim(), fix: 'Beskriv ankomst-procedure', s: 5 },
    { label: 'Husregler', ok: !!form.house_rules.trim(), fix: 'Tilføj husregler', s: 1 },
  ];
  const rPassed = readinessChecks.filter(c => c.ok).length;
  const rScore = Math.round((rPassed / readinessChecks.length) * 100);
  const sLabels = ['Grunddata', 'Beskrivelse', 'Billeder', 'Faciliteter', 'Priser', 'Klargøring'];
  const sIcons = [MapPin, Type, Image, Sparkles, DollarSign, Settings];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {sLabels.map((s, i) => { const Ic = sIcons[i]; return (
            <button key={s} onClick={() => setEditSection(i)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                editSection === i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>
              <Ic className="h-3 w-3" />{s}
            </button>
          ); })}
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
          {saving ? <span className="flex items-center gap-1"><Clock className="h-3 w-3 animate-spin" /> Gemmer…</span>
           : lastSaved ? <span className="flex items-center gap-1 text-primary"><CheckCircle2 className="h-3 w-3" /> Gemt</span>
           : <span>Auto-gem</span>}
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/60 p-5 space-y-4">
        {editSection === 0 && (<>
          <EF label="Titel" hint="Det navn gæsten ser"><Input value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Strandvillaen i Hornbæk" /></EF>
          <EF label="Tagline"><Input value={form.tagline} onChange={e => upd('tagline', e.target.value)} placeholder="Moderne sommerhus med havudsigt" /></EF>
          <ER><EF label="Boligtype"><Input value={form.property_type} onChange={e => upd('property_type', e.target.value)} placeholder="Sommerhus" /></EF><EF label="Region"><Input value={form.region} onChange={e => upd('region', e.target.value)} placeholder="Nordsjælland" /></EF></ER>
          <EF label="Adresse"><Input value={form.address} onChange={e => upd('address', e.target.value)} placeholder="Søvej 28, 3100 Hornbæk" /></EF>
          <EF label="By"><Input value={form.city} onChange={e => upd('city', e.target.value)} placeholder="Hornbæk" /></EF>
          <ER cols={3}>
            <EF label="Max gæster"><Input type="number" min={1} value={form.max_guests} onChange={e => upd('max_guests', parseInt(e.target.value) || 1)} /></EF>
            <EF label="Soveværelser"><Input type="number" min={0} value={form.bedrooms} onChange={e => upd('bedrooms', parseInt(e.target.value) || 0)} /></EF>
            <EF label="Badeværelser"><Input type="number" min={0} value={form.bathrooms} onChange={e => upd('bathrooms', parseInt(e.target.value) || 0)} /></EF>
          </ER>
          <div className="flex items-center gap-3 pt-2"><Label className="text-sm">Aktiv</Label><Switch checked={form.is_active} onCheckedChange={v => upd('is_active', v)} /></div>
        </>)}
        {editSection === 1 && (<>
          <EF label="Hovedbeskrivelse" hint="Beskriv boligen og stemningen"><Textarea value={form.description} onChange={e => upd('description', e.target.value)} rows={6} placeholder="Velkommen til…" /></EF>
          <EF label="Husregler"><Textarea value={form.house_rules} onChange={e => upd('house_rules', e.target.value)} rows={3} placeholder="Ingen rygning…" /></EF>
          <EF label="Praktisk info"><Textarea value={form.practical_info} onChange={e => upd('practical_info', e.target.value)} rows={3} placeholder="WiFi: SommerNet…" /></EF>
        </>)}
        {editSection === 2 && (<>
          <EF label="Hero-billede"><Input value={form.hero_image} onChange={e => upd('hero_image', e.target.value)} placeholder="https://…" /></EF>
          {form.hero_image && <div className="rounded-xl overflow-hidden border border-border h-40"><img src={form.hero_image} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} /></div>}
          <Label className="text-sm font-medium">Galleri</Label>
          {form.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {form.images.map((img: string, i: number) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border border-border aspect-[4/3] bg-muted">
                  {img ? <img src={img} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} /> : <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Tom</div>}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <button onClick={() => upd('images', form.images.filter((_: string, idx: number) => idx !== i))} className="opacity-0 group-hover:opacity-100 bg-white/90 text-destructive rounded-full p-1.5"><X className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => upd('images', [...form.images, ''])} className="gap-1.5 w-full"><Plus className="h-3.5 w-3.5" /> Tilføj billede</Button>
        </>)}
        {editSection === 3 && (<>
          <Label className="text-sm font-medium mb-2 block">Hurtigvalg</Label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_AMENITIES.map(a => (
              <button key={a} onClick={() => toggleAm(a)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                form.amenities.includes(a) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/40')}>{a}</button>
            ))}
          </div>
          {form.amenities.filter((a: string) => !COMMON_AMENITIES.includes(a)).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {form.amenities.filter((a: string) => !COMMON_AMENITIES.includes(a)).map((a: string) => (
                <Badge key={a} variant="secondary" className="gap-1 text-xs">{a}<button onClick={() => upd('amenities', form.amenities.filter((x: string) => x !== a))} className="ml-0.5 hover:text-destructive"><X className="h-3 w-3" /></button></Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <Input value={newAmenity} onChange={e => setNewAmenity(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newAmenity.trim()) { toggleAm(newAmenity.trim()); setNewAmenity(''); } } }}
              placeholder="Tilføj egen facilitet…" className="flex-1" />
            <Button size="sm" variant="outline" onClick={() => { if (newAmenity.trim()) { toggleAm(newAmenity.trim()); setNewAmenity(''); } }}><Plus className="h-4 w-4" /></Button>
          </div>
        </>)}
        {editSection === 4 && (<>
          <ER><EF label="Pris pr. nat (DKK)"><Input type="number" min={0} step={50} value={form.base_price_per_night} onChange={e => upd('base_price_per_night', parseFloat(e.target.value) || 0)} /></EF><EF label="Weekend-pris (DKK)"><Input type="number" min={0} step={50} value={form.weekend_price_per_night} onChange={e => upd('weekend_price_per_night', parseFloat(e.target.value) || 0)} /></EF></ER>
          <ER><EF label="Rengøringsgebyr (DKK)"><Input type="number" min={0} step={50} value={form.cleaning_fee} onChange={e => upd('cleaning_fee', parseFloat(e.target.value) || 0)} /></EF><div /></ER>
          <ER><EF label="Min. nætter"><Input type="number" min={1} value={form.min_nights} onChange={e => upd('min_nights', parseInt(e.target.value) || 1)} /></EF><EF label="Max nætter"><Input type="number" min={1} value={form.max_nights} onChange={e => upd('max_nights', parseInt(e.target.value) || 30)} /></EF></ER>
        </>)}
        {editSection === 5 && (<>
          <div className="flex items-center gap-5 pb-4 border-b border-border">
            {(() => { const c = 2 * Math.PI * 40; const o = c - (rScore / 100) * c; return (
              <div className="relative w-20 h-20 shrink-0"><svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="7" className="text-muted/30" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="7" strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round" className={rScore >= 80 ? 'text-primary' : rScore >= 50 ? 'text-accent-foreground' : 'text-destructive'} />
              </svg><div className="absolute inset-0 flex items-center justify-center"><span className="text-lg font-bold text-foreground">{rScore}%</span></div></div>
            ); })()}
            <div><p className="text-sm font-semibold text-foreground">{rScore === 100 ? 'Klar! 🎉' : rScore >= 80 ? 'Næsten klar' : 'Mangler data'}</p><p className="text-xs text-muted-foreground mt-0.5">{rPassed} af {readinessChecks.length} udfyldt</p></div>
          </div>
          {readinessChecks.filter(c => !c.ok).length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mangler</p>
              {readinessChecks.filter(c => !c.ok).map(item => (
                <button key={item.label} onClick={() => setEditSection(item.s)} className="w-full flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left hover:bg-muted/50 transition-colors group">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground">{item.label}</p><p className="text-xs text-muted-foreground">{item.fix}</p></div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </button>
              ))}
            </div>
          )}
          {rPassed > 0 && <div className="flex flex-wrap gap-1.5">{readinessChecks.filter(c => c.ok).map(item => (
            <span key={item.label} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"><CheckCircle2 className="h-3 w-3" /> {item.label}</span>
          ))}</div>}
          <div className="pt-3 border-t border-border space-y-4">
            <ER><EF label="Check-in tid"><Input type="time" value={form.check_in_time} onChange={e => upd('check_in_time', e.target.value)} /></EF><EF label="Check-out tid"><Input type="time" value={form.check_out_time} onChange={e => upd('check_out_time', e.target.value)} /></EF></ER>
            <EF label="Check-in instruktioner"><Textarea value={form.checkin_info} onChange={e => upd('checkin_info', e.target.value)} rows={3} placeholder="Nøgleboksen sidder…" /></EF>
            <EF label="Check-out instruktioner"><Textarea value={form.checkout_info} onChange={e => upd('checkout_info', e.target.value)} rows={3} placeholder="Tøm køleskab…" /></EF>
          </div>
        </>)}
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
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishFlowOpen, setPublishFlowOpen] = useState(false);
  const [sagDocs, setSagDocs] = useState<any[]>([]);
  const [docTemplates, setDocTemplates] = useState<any[]>([]);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editDocValues, setEditDocValues] = useState<Record<string, string>>({});
  const [ownerEditOpen, setOwnerEditOpen] = useState(false);
  const [ownerForm, setOwnerForm] = useState<any>({});

  const loadSagDocs = useCallback(async (listingId: string, ownerId: string) => {
    const [{ data: sd }, { data: tpls }] = await Promise.all([
      supabase.from('sag_documents').select('*').eq('listing_id', listingId).order('created_at'),
      supabase.from('document_templates').select('*').eq('is_active', true).order('sort_order'),
    ]);
    setSagDocs(sd || []);
    setDocTemplates(tpls || []);

    // Auto-generate missing sag documents from templates
    if (tpls && tpls.length > 0 && sd !== null) {
      const existingTemplateIds = (sd || []).map((d: any) => d.template_id);
      const missing = tpls.filter((t: any) => !existingTemplateIds.includes(t.id));
      if (missing.length > 0) {
        const inserts = missing.map((t: any) => ({
          listing_id: listingId,
          template_id: t.id,
          owner_id: ownerId,
          title: t.name,
          category: t.category,
          body_html: t.body_html,
          custom_values: {},
          status: 'draft',
        }));
        const { data: newDocs } = await supabase.from('sag_documents').insert(inserts).select();
        if (newDocs) setSagDocs(prev => [...prev, ...newDocs]);
      }
    }
  }, []);

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
        loadSagDocs(id, l.owner_id);
      }
      setLoading(false);
    };
    load();
  }, [id, loadSagDocs]);

  const nextSteps = useMemo(() => listing ? computeNextSteps(listing) : [], [listing]);

  const handleImproveText = async () => {
    if (!listing) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('improve-listing-text', {
        body: { listing, action: 'improve_all' },
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
    { key: 'integrationer', label: 'Integrationer', icon: Plug },
    { key: 'kanaler', label: 'Kanaler', icon: Radio },
    { key: 'kalender', label: 'Kalender', icon: CalendarIcon },
    { key: 'priser', label: 'Priser', icon: DollarSign },
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
                {/* Stage switcher */}
                <div className="flex items-center gap-1 mt-3 flex-wrap">
                  {STAGE_OPTIONS.map(opt => {
                    const active = (listing.internal_status || 'draft') === opt.key;
                    return (
                      <button
                        key={opt.key}
                        disabled={active}
                        onClick={async () => {
                          const isLive = opt.key === 'til_leje';
                          const { error } = await supabase.from('listings').update({
                            internal_status: opt.key,
                            is_active: isLive,
                          }).eq('id', listing.id);
                          if (error) { toast.error('Kunne ikke skifte stadie'); return; }
                          setListing({ ...listing, internal_status: opt.key, is_active: isLive });
                          toast.success(`Sag flyttet til "${opt.label}"${isLive ? ' — nu synlig på hjemmesiden' : ''}`);
                        }}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border',
                          active
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'text-muted-foreground border-border/30 hover:bg-muted/20 hover:text-foreground'
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
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
            <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setPublishFlowOpen(true)}>
              <Globe className="h-3.5 w-3.5" />Publicér listing
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => setTab('listing')}>
              <Pencil className="h-3.5 w-3.5" />Redigér listing
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => setTab('overblik')}>
              <Rocket className="h-3.5 w-3.5" />Klargør listing
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={handleImproveText} disabled={aiLoading}>
              <Sparkles className="h-3.5 w-3.5" />{aiLoading ? 'AI arbejder…' : 'Forbedr tekst med AI'}
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
              <QuickStat label="Dokumenter" value={sagDocs.length + documents.length} />
              <QuickStat label="Tilkøb" value={addons.length} />
            </div>
          </div>
        )}

        {tab === 'listing' && <InlineListingEditor listing={listing} onSaved={(updated) => setListing({ ...listing, ...updated })} />}

        {tab === 'integrationer' && (
          <div className="space-y-4">
            <Beds24ReadinessEngine
              listing={listing}
              onNavigateTab={(t) => setTab(t)}
              onStatusReady={async () => {
                const { error } = await supabase.from('listings').update({ sync_status: 'ready' }).eq('id', listing.id);
                if (error) { toast.error('Kunne ikke opdatere status'); return; }
                setListing({ ...listing, sync_status: 'ready' });
                toast.success('Listing markeret som klar til Beds24');
              }}
            />
            {/* Send til Beds24 action */}
            {(listing.sync_status === 'ready' || listing.sync_status === 'error') && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">Klar til publicering</p>
                  <p className="text-[11px] text-muted-foreground">Send listing-data til Beds24 channel manager</p>
                </div>
                <Button size="sm" className="rounded-xl text-xs gap-1.5" onClick={() => setPublishOpen(true)}>
                  <Send className="h-3.5 w-3.5" />Send til Beds24
                </Button>
              </div>
            )}
            <Beds24Integration listing={listing} onUpdate={(updated: any) => setListing({ ...listing, ...updated })} />
            <Beds24MappingSection listing={listing} />
            <Beds24PublishDialog
              listing={listing}
              open={publishOpen}
              onClose={() => setPublishOpen(false)}
              onConfirmed={(updated) => setListing({ ...listing, ...updated })}
            />
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
          <div className="space-y-4">
            {/* Sync source bar */}
            <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
              <div className="px-5 py-3 border-b border-border/30">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Tilgængelighed — Datakilde</p>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border/30 bg-muted/10 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Kilde</p>
                  <p className="text-xs font-semibold text-foreground">{listing.channel_manager_partner === 'beds24' ? 'Beds24' : 'SommerVibes'}</p>
                </div>
                <div className="rounded-lg border border-border/30 bg-muted/10 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Sync status</p>
                  <StatusChip label={listing.sync_status === 'synced' ? 'Synkroniseret' : listing.sync_status === 'pending' ? 'Venter' : 'Manuel'} variant={listing.sync_status === 'synced' ? 'success' : listing.sync_status === 'pending' ? 'warning' : 'muted'} dot size="sm" />
                </div>
                <div className="rounded-lg border border-border/30 bg-muted/10 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Sidst synket</p>
                  <p className="text-xs font-medium text-foreground">{listing.last_sync_at ? format(new Date(listing.last_sync_at), "d. MMM HH:mm", { locale: da }) : '—'}</p>
                </div>
                <div className="rounded-lg border border-border/30 bg-muted/10 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Partner-ID</p>
                  <p className="text-xs font-medium text-foreground font-mono">{listing.external_property_id || '—'}</p>
                </div>
              </div>
            </div>

            {/* Date legend */}
            <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
              <div className="px-5 py-3 border-b border-border/30">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Datoforklaring</p>
              </div>
              <div className="px-5 py-3 flex flex-wrap gap-4">
                {[
                  { color: 'bg-emerald-500', label: 'Tilgængelig' },
                  { color: 'bg-primary', label: 'Booket' },
                  { color: 'bg-muted-foreground', label: 'Blokeret' },
                  { color: 'bg-amber-500', label: 'Ejer-brug' },
                  { color: 'bg-blue-500', label: 'Synket fra partner' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className={cn('w-2.5 h-2.5 rounded-sm', l.color)} />
                    <span className="text-[11px] text-muted-foreground">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bookings list */}
            <SectionCard title="Bookings" icon={CalendarIcon}>
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
          </div>
        )}

        {tab === 'priser' && (
          <div className="space-y-4">
            {/* Pricing source bar */}
            <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
              <div className="px-5 py-3 border-b border-border/30">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Prisstyring — Datakilde</p>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border/30 bg-muted/10 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Priskilde</p>
                  <p className="text-xs font-semibold text-foreground">{listing.channel_manager_partner === 'beds24' ? 'Beds24 (fremtidigt)' : 'SommerVibes'}</p>
                </div>
                <div className="rounded-lg border border-border/30 bg-muted/10 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Sync status</p>
                  <StatusChip label={listing.sync_status === 'synced' ? 'Synkroniseret' : 'Manuel'} variant={listing.sync_status === 'synced' ? 'success' : 'muted'} dot size="sm" />
                </div>
                <div className="rounded-lg border border-border/30 bg-muted/10 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Sidst synket</p>
                  <p className="text-xs font-medium text-foreground">{listing.last_sync_at ? format(new Date(listing.last_sync_at), "d. MMM HH:mm", { locale: da }) : '—'}</p>
                </div>
                <div className="rounded-lg border border-border/30 bg-muted/10 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Partner-kontrol</p>
                  <StatusChip label="SommerVibes styrer" variant="info" dot size="sm" />
                </div>
              </div>
            </div>

            {/* Price sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="Basispris" icon={DollarSign}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Pr. nat (hverdag)</span>
                    <span className="text-sm font-bold text-foreground">{listing.base_price_per_night ? fmt(listing.base_price_per_night / 100) : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Weekend-pris</span>
                    <span className="text-sm font-medium text-foreground">{listing.weekend_price_per_night ? fmt(listing.weekend_price_per_night / 100) : 'Auto (×1.25)'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Rengøring</span>
                    <span className="text-sm font-medium text-foreground">{listing.cleaning_fee ? fmt(listing.cleaning_fee / 100) : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Depositum</span>
                    <span className="text-sm font-medium text-foreground">{listing.deposit ? fmt(listing.deposit / 100) : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Min. ophold</span>
                    <span className="text-sm font-medium text-foreground">{listing.min_nights || 2} nætter</span>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Sæsonpriser" icon={CalendarIcon}>
                <p className="text-[11px] text-muted-foreground mb-3">Sæsonregler styres under Priser-modulet og synkes automatisk til Beds24 ved publicering.</p>
                <div className="rounded-lg border border-border/20 bg-muted/10 p-3 text-center">
                  <p className="text-xs text-muted-foreground/50 italic">Sæsonregler vises her når de er oprettet</p>
                </div>
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="Specialperioder" icon={Tag}>
                <p className="text-[11px] text-muted-foreground mb-3">Daglige prisoverrides for helligdage, events eller særlige perioder.</p>
                <div className="rounded-lg border border-border/20 bg-muted/10 p-3 text-center">
                  <p className="text-xs text-muted-foreground/50 italic">Ingen specialperioder konfigureret</p>
                </div>
              </SectionCard>

              <SectionCard title="Partner-prisstyring" icon={Plug}>
                <p className="text-[11px] text-muted-foreground mb-3">Når Beds24-sync er aktiv, kan priser styres fra partner eller internt.</p>
                <div className="rounded-xl border border-border/30 bg-muted/10 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Priskontrol</span>
                    <StatusChip label="SommerVibes → Beds24" variant="info" size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Retning</span>
                    <span className="text-[11px] text-muted-foreground">Push (SV styrer priser)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Auto-sync</span>
                    <StatusChip label="Ikke aktiv" variant="muted" size="sm" />
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
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
            {/* Owner details banner */}
            {owner && (!owner.cpr_number || !owner.address) && (
              <button onClick={() => { setOwnerForm({ cpr_number: owner.cpr_number || '', address: owner.address || '', country: owner.country || 'Danmark' }); setOwnerEditOpen(true); }}
                className="w-full flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-left mb-4 hover:bg-amber-500/15 transition-colors">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <div className="flex-1"><p className="text-sm font-medium text-foreground">Kundeoplysninger mangler</p>
                <p className="text-xs text-muted-foreground">Tilføj CPR-nr. og adresse for at kunne generere dokumenter korrekt</p></div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            )}

            {/* Owner edit inline */}
            {ownerEditOpen && (
              <div className="rounded-xl border border-border/40 bg-card/80 p-4 mb-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2"><User className="h-3.5 w-3.5" /> Kundeoplysninger</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">CPR-nummer</Label><Input placeholder="DDMMÅÅ-XXXX" value={ownerForm.cpr_number} onChange={e => setOwnerForm({ ...ownerForm, cpr_number: e.target.value })} /></div>
                  <div><Label className="text-xs text-muted-foreground">Adresse</Label><Input placeholder="Vejnavn 123, 1234 By" value={ownerForm.address} onChange={e => setOwnerForm({ ...ownerForm, address: e.target.value })} /></div>
                  <div><Label className="text-xs text-muted-foreground">Land</Label><Input value={ownerForm.country} onChange={e => setOwnerForm({ ...ownerForm, country: e.target.value })} /></div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setOwnerEditOpen(false)}>Annuller</Button>
                  <Button size="sm" onClick={async () => {
                    await supabase.from('profiles').update({ cpr_number: ownerForm.cpr_number, address: ownerForm.address, country: ownerForm.country }).eq('id', owner.id);
                    setOwner({ ...owner, ...ownerForm });
                    setOwnerEditOpen(false);
                    toast.success('Kundeoplysninger opdateret');
                  }}>Gem</Button>
                </div>
              </div>
            )}

            {/* Sag documents list */}
            <div className="space-y-3">
              {sagDocs.length === 0 ? (
                <p className="text-xs text-muted-foreground/50 italic py-4 text-center">Genererer dokumenter...</p>
              ) : sagDocs.map(sd => {
                const isEditing = editingDocId === sd.id;
                const statusMap: Record<string, { label: string; variant: SVariant }> = {
                  draft: { label: 'Kladde', variant: 'muted' },
                  sent: { label: 'Sendt til underskrift', variant: 'warning' },
                  signed: { label: 'Underskrevet', variant: 'success' },
                };
                const st = statusMap[sd.status] || statusMap.draft;
                const isAftale = sd.category === 'aftale';
                const isRapport = sd.category === 'rapport';
                const icon = isAftale ? Shield : isRapport ? Zap : FileText;
                const IconComp = icon;

                // Compute dynamic stats for rapport
                const totalBookings = bookings.length;
                const confirmedBookings = bookings.filter((b: any) => b.status === 'confirmed' || b.status === 'completed' || b.status === 'checked_in' || b.status === 'checked_out').length;
                const totalRevenue = bookings.reduce((s: number, b: any) => s + (Number(b.total_amount) || 0), 0);
                const totalGuests = bookings.reduce((s: number, b: any) => s + (Number(b.guests_count) || 0), 0);
                const avgBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;
                const totalNights = bookings.reduce((s: number, b: any) => s + (Number(b.nights) || 0), 0);
                const activeChannels = listing?.is_active ? 1 : 0;

                // Resolve placeholders
                const resolveBody = (html: string, custom: Record<string, string> = {}) => {
                  const vals: Record<string, string> = {
                    owner_name: owner?.full_name || '',
                    owner_email: owner?.email || '',
                    owner_phone: owner?.phone || '',
                    owner_address: owner?.address || '',
                    owner_cpr: owner?.cpr_number || '',
                    property_name: listing?.name || '',
                    property_address: listing?.address || '',
                    commission_percent: custom.commission_percent || '15',
                    binding_months: custom.binding_months || '6',
                    notice_days: custom.notice_days || '30',
                    report_date: format(new Date(), 'd. MMMM yyyy', { locale: da }),
                    total_bookings: String(totalBookings),
                    confirmed_bookings: String(confirmedBookings),
                    total_revenue: totalRevenue.toLocaleString('da-DK'),
                    total_guests: String(totalGuests),
                    avg_booking_value: avgBookingValue.toLocaleString('da-DK'),
                    total_nights: String(totalNights),
                    active_channels: String(activeChannels),
                    readiness_score: String(listing?.readiness_score || 0),
                    custom_achievements: custom.custom_achievements || 'Løbende optimering af din listing',
                    boost_price: custom.boost_price || '2.995',
                    boost_description: custom.boost_description || 'Engangsbetaling — ingen binding',
                    next_steps: custom.next_steps || 'Vi anbefaler at opgradere til Boost-pakken for at øge din synlighed og booking-rate.',
                    ...custom,
                  };
                  let resolved = html;
                  Object.entries(vals).forEach(([k, v]) => {
                    resolved = resolved.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v || '—');
                  });
                  return resolved;
                };

                return (
                  <div key={sd.id} className="rounded-xl border border-border/30 bg-muted/10 overflow-hidden">
                    {/* Header row */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", isAftale ? "bg-primary/15" : "bg-muted/30")}>
                          <IconComp className={cn("h-4 w-4", isAftale ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{sd.title}</p>
                          <p className="text-[11px] text-muted-foreground">{isAftale ? 'Aftale' : isRapport ? 'Statusrapport' : 'Standard dokument'} · {format(new Date(sd.created_at), 'd. MMM yyyy', { locale: da })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusChip label={st.label} variant={st.variant} dot />
                        <Button size="sm" variant="ghost" onClick={() => {
                          if (isEditing) { setEditingDocId(null); } else {
                            setEditingDocId(sd.id);
                            setEditDocValues(sd.custom_values || {});
                          }
                        }}>
                          {isEditing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>

                    {/* Edit / Preview panel */}
                    {isEditing && (
                      <div className="border-t border-border/30 px-4 py-4 space-y-4">
                        {isAftale && (
                          <div className="grid grid-cols-3 gap-3">
                            <div><Label className="text-xs text-muted-foreground">Kommission %</Label>
                              <Input type="number" min={0} max={100} value={editDocValues.commission_percent || '15'} onChange={e => setEditDocValues({ ...editDocValues, commission_percent: e.target.value })} /></div>
                            <div><Label className="text-xs text-muted-foreground">Bindingsperiode (mdr)</Label>
                              <Input type="number" min={0} value={editDocValues.binding_months || '6'} onChange={e => setEditDocValues({ ...editDocValues, binding_months: e.target.value })} /></div>
                            <div><Label className="text-xs text-muted-foreground">Opsigelse (dage)</Label>
                              <Input type="number" min={0} value={editDocValues.notice_days || '30'} onChange={e => setEditDocValues({ ...editDocValues, notice_days: e.target.value })} /></div>
                          </div>
                        )}

                        {isRapport && (
                          <div className="space-y-3">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tilpas rapport</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div><Label className="text-xs text-muted-foreground">Boost-pris (DKK)</Label>
                                <Input value={editDocValues.boost_price || '2.995'} onChange={e => setEditDocValues({ ...editDocValues, boost_price: e.target.value })} /></div>
                              <div><Label className="text-xs text-muted-foreground">Boost-beskrivelse</Label>
                                <Input value={editDocValues.boost_description || 'Engangsbetaling — ingen binding'} onChange={e => setEditDocValues({ ...editDocValues, boost_description: e.target.value })} /></div>
                            </div>
                            <div><Label className="text-xs text-muted-foreground">Særlige præstationer</Label>
                              <Textarea rows={2} value={editDocValues.custom_achievements || 'Løbende optimering af din listing'} onChange={e => setEditDocValues({ ...editDocValues, custom_achievements: e.target.value })} /></div>
                            <div><Label className="text-xs text-muted-foreground">Næste skridt</Label>
                              <Textarea rows={2} value={editDocValues.next_steps || 'Vi anbefaler at opgradere til Boost-pakken for at øge din synlighed og booking-rate.'} onChange={e => setEditDocValues({ ...editDocValues, next_steps: e.target.value })} /></div>
                          </div>
                        )}

                        {/* Preview */}
                        <div className="rounded-lg border border-border/20 bg-background/50 p-4">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Forhåndsvisning</p>
                          <div className="prose prose-sm max-w-none text-foreground [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-semibold [&_p]:text-xs [&_p]:leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: resolveBody(sd.body_html, editDocValues) }} />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={async () => {
                            await supabase.from('sag_documents').update({ custom_values: editDocValues }).eq('id', sd.id);
                            setSagDocs(prev => prev.map(d => d.id === sd.id ? { ...d, custom_values: editDocValues } : d));
                            toast.success('Tilpasninger gemt');
                            setEditingDocId(null);
                          }}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Gem tilpasninger
                          </Button>
                          {isAftale && sd.status === 'draft' && (
                            <Button size="sm" onClick={async () => {
                              await supabase.from('sag_documents').update({ status: 'sent', sent_at: new Date().toISOString(), custom_values: editDocValues }).eq('id', sd.id);
                              setSagDocs(prev => prev.map(d => d.id === sd.id ? { ...d, status: 'sent', sent_at: new Date().toISOString(), custom_values: editDocValues } : d));
                              toast.success('Sendt til underskrift (MitID-integration kommer snart)');
                              setEditingDocId(null);
                            }}>
                              <Send className="h-3.5 w-3.5 mr-1.5" /> Send til underskrift
                            </Button>
                          )}
                          {!isAftale && (
                            <Button size="sm" variant="outline" onClick={() => {
                              const w = window.open('', '_blank');
                              if (w) { w.document.write(resolveBody(sd.body_html, editDocValues)); w.document.close(); }
                            }}>
                              <Download className="h-3.5 w-3.5 mr-1.5" /> Åbn dokument
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legacy uploaded documents */}
            {documents.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border/30">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Uploadede dokumenter</p>
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
      <PublishFlowModal
        listing={listing}
        open={publishFlowOpen}
        onClose={() => setPublishFlowOpen(false)}
        onPublished={(updated) => setListing({ ...listing, ...updated })}
      />
    </AdminLayout>
  );
}
