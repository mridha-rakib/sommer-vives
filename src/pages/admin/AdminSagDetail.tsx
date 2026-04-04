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
  AlertTriangle, Settings, Type, Plug, RefreshCw, Send, Link2, Download, User, Shield, Upload, UserPlus, Trash2
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

function QuickStat({ label, value }: { label: string; value: number | string }) {
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
// Premium Airbnb-style editor with animations, next/prev nav, celebrations
function InlineListingEditor({ listing, onSaved, staffList }: { listing: any; onSaved: (data: any) => void; staffList?: any[] }) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [sectionAnimDir, setSectionAnimDir] = useState<'left' | 'right'>('right');
  const [animKey, setAnimKey] = useState(0);
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
    long_description: listing.long_description || '',
    extra_sections: (listing.extra_sections || []) as { title: string; body: string; image?: string }[],
    bedroom_images: (listing.bedroom_images || []) as { url: string; label: string; description?: string }[],
    facilities: (listing.facilities || []) as { category: string; items: { name: string; description?: string; included: boolean }[] }[],
    location_title: listing.location_title || '', location_description: listing.location_description || '',
    getting_around: listing.getting_around || '',
    contact_name: listing.contact_name || (() => { const a = staffList?.find((s: any) => s.staff_role === 'annoncerende'); return a?.staff_name || ''; })(),
    contact_role: listing.contact_role || (() => { const a = staffList?.find((s: any) => s.staff_role === 'annoncerende'); return a ? 'Udlejningsrådgiver' : ''; })(),
    contact_email: listing.contact_email || (() => { const a = staffList?.find((s: any) => s.staff_role === 'annoncerende'); return a?.staff_email || ''; })(),
    contact_phone: listing.contact_phone || (() => { const a = staffList?.find((s: any) => s.staff_role === 'annoncerende'); return a?.staff_phone || ''; })(),
    contact_text: listing.contact_text || '', contact_image: listing.contact_image || '',
    reviews_title: listing.reviews_title || '', reviews_rating: listing.reviews_rating || 0,
    reviews_count: listing.reviews_count || 0,
    reviews_entries: (listing.reviews_entries || []) as { text: string; author: string; location?: string; date?: string }[],
    highlights: listing.highlights || [],
    included_items: listing.included_items || [],
    bring_yourself_items: listing.bring_yourself_items || [],
    purchasable_items: listing.purchasable_items || [],
  }));
  const [newAmenity, setNewAmenity] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [publishing, setPublishing] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef(form);
  formRef.current = form;
  const [activeSection, setActiveSection] = useState('hero');
  const [celebration, setCelebration] = useState<string | null>(null);

  const persistFn = useCallback(async (data: typeof form) => {
    setSaving(true);
    const payload: Record<string, any> = {
      name: data.name, description: data.description || null,
      long_description: data.long_description || null,
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
      extra_sections: data.extra_sections, bedroom_images: data.bedroom_images,
      facilities: data.facilities,
      location_title: data.location_title || null, location_description: data.location_description || null,
      getting_around: data.getting_around || null,
      contact_name: data.contact_name || null, contact_role: data.contact_role || null,
      contact_email: data.contact_email || null, contact_phone: data.contact_phone || null,
      contact_text: data.contact_text || null, contact_image: data.contact_image || null,
      reviews_title: data.reviews_title || null, reviews_rating: data.reviews_rating || null,
      reviews_count: data.reviews_count || null, reviews_entries: data.reviews_entries,
      highlights: data.highlights, included_items: data.included_items,
      bring_yourself_items: data.bring_yourself_items, purchasable_items: data.purchasable_items,
    };
    const { error } = await supabase.from('listings').update(payload).eq('id', listing.id);
    setSaving(false);
    if (error) { toast.error(`Fejl: ${error.message}`); } else { setLastSaved(new Date()); onSaved(payload); }
  }, [listing.id, onSaved]);

  const scheduleSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => persistFn(formRef.current), 2000);
  }, [persistFn]);

  const handlePublish = async () => {
    setPublishing(true);
    await persistFn(formRef.current);
    const { error } = await supabase.from('listings').update({
      is_active: true, internal_status: 'til_leje', published_at: new Date().toISOString(),
    }).eq('id', listing.id);
    setPublishing(false);
    if (error) { toast.error('Kunne ikke publicere'); return; }
    setForm(prev => ({ ...prev, is_active: true }));
    onSaved({ is_active: true, internal_status: 'til_leje', published_at: new Date().toISOString() });
    toast.success('✅ Listing publiceret til SommerVibes.dk!');
  };

  const handleTransferToChannels = async () => {
    await persistFn(formRef.current);
    const channelPayload: Record<string, any> = {
      channel_airbnb_title: formRef.current.name,
      channel_airbnb_description: formRef.current.description || formRef.current.long_description || null,
      channel_booking_title: formRef.current.name,
      channel_booking_description: formRef.current.long_description || formRef.current.description || null,
      channel_vrbo_title: formRef.current.name,
      channel_vrbo_description: formRef.current.long_description || formRef.current.description || null,
      channel_airbnb_house_rules: formRef.current.house_rules || null,
      channel_vrbo_rules: formRef.current.house_rules || null,
      channel_airbnb_highlights: formRef.current.amenities?.slice(0, 5) || null,
      channel_vrbo_highlights: formRef.current.amenities?.slice(0, 5) || null,
    };
    const { error } = await supabase.from('listings').update(channelPayload).eq('id', listing.id);
    if (error) { toast.error('Fejl ved overførsel'); return; }
    onSaved(channelPayload);
    toast.success('📡 Metadata overført til Airbnb, Booking.com & Vrbo');
  };

  const handleImageUpload = useCallback(async (files: FileList) => {
    setUploadingImage(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${listing.owner_id}/${listing.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('listing-images').upload(filePath, file, { contentType: file.type });
      if (error) { toast.error(`Upload fejl: ${file.name}`); continue; }
      const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(filePath);
      newUrls.push(urlData.publicUrl);
    }
    if (newUrls.length > 0) {
      const updated = [...formRef.current.images, ...newUrls];
      setForm(prev => ({ ...prev, images: updated }));
      if (!formRef.current.hero_image && newUrls[0]) {
        setForm(prev => ({ ...prev, hero_image: newUrls[0] }));
      }
      scheduleSave();
      toast.success(`${newUrls.length} billede${newUrls.length > 1 ? 'r' : ''} uploadet`);
    }
    setUploadingImage(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
  }, [listing.owner_id, listing.id, scheduleSave]);

  useEffect(() => () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); }, []);

  const upd = (key: string, value: any) => { setForm(prev => ({ ...prev, [key]: value })); scheduleSave(); };
  const toggleAm = (a: string) => {
    const has = form.amenities.includes(a);
    upd('amenities', has ? form.amenities.filter((x: string) => x !== a) : [...form.amenities, a]);
  };

  const addContentSection = () => upd('extra_sections', [...form.extra_sections, { title: '', body: '', image: '' }]);
  const updateContentSection = (idx: number, field: string, value: string) => {
    const updated = [...form.extra_sections]; (updated[idx] as any)[field] = value; upd('extra_sections', updated);
  };
  const removeContentSection = (idx: number) => upd('extra_sections', form.extra_sections.filter((_, i) => i !== idx));
  const addBedroom = () => upd('bedroom_images', [...form.bedroom_images, { url: '', label: `Soveværelse nr. ${form.bedroom_images.length + 1}`, description: '' }]);
  const updateBedroom = (idx: number, field: string, value: string) => {
    const updated = [...form.bedroom_images]; (updated[idx] as any)[field] = value; upd('bedroom_images', updated);
  };
  const removeBedroom = (idx: number) => upd('bedroom_images', form.bedroom_images.filter((_, i) => i !== idx));
  const addReview = () => upd('reviews_entries', [...form.reviews_entries, { text: '', author: '', location: '', date: '' }]);
  const updateReview = (idx: number, field: string, value: string) => {
    const updated = [...form.reviews_entries]; (updated[idx] as any)[field] = value; upd('reviews_entries', updated);
  };
  const removeReview = (idx: number) => upd('reviews_entries', form.reviews_entries.filter((_, i) => i !== idx));
  const addListItem = (field: string) => upd(field, [...(form as any)[field], '']);
  const updateListItem = (field: string, idx: number, value: string) => {
    const updated = [...(form as any)[field]]; updated[idx] = value; upd(field, updated);
  };
  const removeListItem = (field: string, idx: number) => upd(field, (form as any)[field].filter((_: any, i: number) => i !== idx));

  // Sections config
  const sections = useMemo(() => [
    { id: 'hero', icon: Camera, label: 'Billeder', subtitle: `${form.images.length} billeder`, done: form.images.length >= 5, emoji: '📸' },
    { id: 'intro', icon: Type, label: 'Titel & beskrivelse', subtitle: form.name || 'Ikke udfyldt', done: !!form.name && !!form.description, emoji: '✏️' },
    { id: 'details', icon: Home, label: 'Boligoplysninger', subtitle: `${form.max_guests} gæster · ${form.bedrooms} sov.`, done: form.max_guests > 0, emoji: '🏠' },
    { id: 'highlights', icon: Sparkles, label: 'Highlights', subtitle: `${form.highlights.length} highlights`, done: form.highlights.length >= 2, emoji: '⭐' },
    { id: 'content', icon: FileText, label: 'Indholdssektioner', subtitle: `${form.extra_sections.length} sektioner`, done: form.extra_sections.length > 0, emoji: '📝' },
    { id: 'bedrooms', icon: Bed, label: 'Soveværelser', subtitle: `${form.bedroom_images.length} værelser`, done: form.bedroom_images.length > 0, emoji: '🛏️' },
    { id: 'facilities', icon: Wifi, label: 'Faciliteter', subtitle: `${form.facilities.reduce((s: number, c: any) => s + c.items.length, 0)} faciliteter`, done: form.facilities.length > 0, emoji: '🏊' },
    { id: 'included', icon: Tag, label: 'Inkluderet & Extras', subtitle: `${form.included_items.length} inkl.`, done: form.included_items.length > 0, emoji: '✅' },
    { id: 'location', icon: MapPin, label: 'Beliggenhed', subtitle: form.address || 'Ikke udfyldt', done: !!form.address, emoji: '📍' },
    { id: 'reviews', icon: Sparkles, label: 'Anmeldelser', subtitle: `${form.reviews_entries.length} anm.`, done: form.reviews_entries.length > 0, emoji: '💬' },
    { id: 'contact', icon: User, label: 'Kontakt', subtitle: form.contact_name || 'Ikke udfyldt', done: !!form.contact_name, emoji: '👤' },
    { id: 'checkin', icon: Clock, label: 'Ankomst & Regler', subtitle: `${form.check_in_time} / ${form.check_out_time}`, done: !!form.check_in_time, emoji: '🔑' },
    { id: 'pricing', icon: DollarSign, label: 'Priser', subtitle: form.base_price_per_night ? `${form.base_price_per_night} kr/nat` : 'Ikke sat', done: form.base_price_per_night > 0, emoji: '💰' },
  ], [form]);

  const completedCount = sections.filter(s => s.done).length;
  const currentIdx = sections.findIndex(s => s.id === activeSection);
  const canGoNext = currentIdx < sections.length - 1;
  const canGoPrev = currentIdx > 0;

  // Navigate sections with animation direction
  const goToSection = useCallback((id: string) => {
    const newIdx = sections.findIndex(s => s.id === id);
    setSectionAnimDir(newIdx > currentIdx ? 'right' : 'left');
    setAnimKey(k => k + 1);
    setActiveSection(id);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIdx, sections]);

  const goNext = useCallback(() => { if (canGoNext) goToSection(sections[currentIdx + 1].id); }, [canGoNext, currentIdx, goToSection, sections]);
  const goPrev = useCallback(() => { if (canGoPrev) goToSection(sections[currentIdx - 1].id); }, [canGoPrev, currentIdx, goToSection, sections]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  // Celebrate completion
  useEffect(() => {
    if (completedCount === sections.length && !celebration) {
      setCelebration('🎉');
      setTimeout(() => setCelebration(null), 3000);
    }
  }, [completedCount, sections.length, celebration]);

  const PanelTitle = ({ title, subtitle, emoji }: { title: string; subtitle?: string; emoji?: string }) => (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        {emoji && <span className="text-2xl">{emoji}</span>}
        <div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground -mt-1">{hint}</p>}
      {children}
    </div>
  );

  const EmptyAddBlock = ({ onClick, icon: Icon, text, hint }: { onClick: () => void; icon: any; text: string; hint?: string }) => (
    <button onClick={onClick}
      className="w-full rounded-2xl border-2 border-dashed border-border/30 hover:border-primary/40 bg-gradient-to-br from-transparent to-primary/[0.02] hover:to-primary/[0.06] p-8 text-center transition-all group">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-primary/15 transition-all">
        <Icon className="w-6 h-6 text-primary/50 group-hover:text-primary/80 transition-colors" />
      </div>
      <p className="text-sm font-medium text-foreground/80 group-hover:text-foreground">{text}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </button>
  );

  // Navigation footer for each section
  const NavFooter = () => (
    <div className="mt-12 pt-6 border-t border-border/20 flex items-center justify-between">
      <div>
        {canGoPrev && (
          <button onClick={goPrev}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>{sections[currentIdx - 1]?.label}</span>
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
        <span>←→ piletaster</span>
      </div>
      <div>
        {canGoNext && (
          <button onClick={goNext}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group">
            <span>{sections[currentIdx + 1]?.label}</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );

  const renderSection = () => {
    const currentSection = sections.find(s => s.id === activeSection);
    const emoji = currentSection?.emoji;

    switch (activeSection) {
      case 'hero':
        return (
          <>
            <PanelTitle title="Billeder & Galleri" subtitle="Upload mindst 5 billeder — vi anbefaler 15+ for den bedste oplevelse." emoji={emoji} />
            <input ref={imageInputRef} type="file" className="hidden" multiple accept="image/*" onChange={e => e.target.files && handleImageUpload(e.target.files)} />

            {form.images.length === 0 ? (
              <div
                className="rounded-2xl border-2 border-dashed border-border/30 hover:border-primary/50 bg-gradient-to-br from-primary/[0.02] to-primary/[0.06] transition-all p-16 text-center cursor-pointer group"
                onClick={() => imageInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-primary/60', 'bg-primary/10'); }}
                onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-primary/60', 'bg-primary/10'); }}
                onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('border-primary/60', 'bg-primary/10'); if (e.dataTransfer.files.length) handleImageUpload(e.dataTransfer.files); }}
              >
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                  <Camera className="w-9 h-9 text-primary/40 group-hover:text-primary/70 transition-colors" />
                </div>
                <p className="text-lg font-semibold text-foreground/80 group-hover:text-foreground">{uploadingImage ? 'Uploader...' : 'Træk billeder hertil'}</p>
                <p className="text-sm text-muted-foreground mt-2">eller klik for at vælge · JPG, PNG, WebP</p>
                <p className="text-xs text-muted-foreground/50 mt-4">💡 Tip: Brug landskabsbilleder i høj opløsning for bedste resultat</p>
              </div>
            ) : (
              <>
                {/* Upload more button */}
                <div
                  className="rounded-2xl border-2 border-dashed border-border/30 hover:border-primary/40 bg-muted/5 hover:bg-primary/5 transition-all p-6 text-center cursor-pointer group mb-6"
                  onClick={() => imageInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-primary/60', 'bg-primary/10'); }}
                  onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-primary/60', 'bg-primary/10'); }}
                  onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('border-primary/60', 'bg-primary/10'); if (e.dataTransfer.files.length) handleImageUpload(e.dataTransfer.files); }}
                >
                  <div className="flex items-center justify-center gap-3">
                    <Upload className="w-5 h-5 text-primary/50" />
                    <span className="text-sm font-medium text-foreground/80">{uploadingImage ? 'Uploader...' : 'Upload flere billeder'}</span>
                  </div>
                </div>

                {/* Hero image large */}
                {form.hero_image && (
                  <div className="rounded-2xl overflow-hidden border border-primary/20 aspect-video relative group mb-6">
                    <img src={form.hero_image} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <Badge className="absolute bottom-4 left-4 bg-primary text-primary-foreground text-xs px-3 py-1">⭐ Hovedbillede</Badge>
                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg">
                      {form.images.length} billeder
                    </div>
                  </div>
                )}

                {/* Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {form.images.map((img: string, i: number) => (
                    <div key={i} className={cn("relative group rounded-xl overflow-hidden border-2 aspect-[4/3] bg-muted cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg",
                      form.hero_image === img ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-primary/30')}
                      onClick={() => upd('hero_image', img)}
                    >
                      {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : null}
                      <span className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">{i + 1}</span>
                      {form.hero_image === img && <Badge className="absolute bottom-1.5 left-1.5 bg-primary text-primary-foreground text-[9px]">Hero</Badge>}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <button onClick={(e) => { e.stopPropagation(); upd('images', form.images.filter((_: string, idx: number) => idx !== i)); }}
                          className="opacity-0 group-hover:opacity-100 bg-white text-destructive rounded-full p-2 shadow-lg hover:scale-110 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress hint */}
                {form.images.length < 5 && (
                  <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <p className="text-xs text-foreground">Upload mindst <strong>{5 - form.images.length} flere</strong> billeder for at nå minimum. Vi anbefaler 15+.</p>
                  </div>
                )}
                {form.images.length >= 5 && form.images.length < 15 && (
                  <div className="mt-4 rounded-xl bg-primary/5 border border-primary/15 px-4 py-3 flex items-center gap-3">
                    <Info className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-xs text-muted-foreground">{form.images.length} billeder ✓ — Listings med 15+ billeder får 40% flere bookings.</p>
                  </div>
                )}
              </>
            )}
            <NavFooter />
          </>
        );

      case 'intro':
        return (
          <>
            <PanelTitle title="Titel & Beskrivelse" subtitle="Det første gæsten ser — gør det fængende og personligt." emoji={emoji} />
            <div className="space-y-6">
              <Field label="Listingens navn">
                <Input value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Skovhytten" className="text-lg font-semibold h-12 rounded-xl" />
                <p className="text-[11px] text-muted-foreground/60 mt-1">{form.name.length}/50 tegn</p>
              </Field>
              <Field label="Tagline" hint="En kort one-liner der fanger essensen">
                <Input value={form.tagline} onChange={e => upd('tagline', e.target.value)} placeholder="Hyggelig skovhytte ved Kvie Sø" className="h-11 rounded-xl" />
              </Field>
              <Field label="Kort beskrivelse" hint="Gæstens første indtryk — 2-3 sætninger">
                <Textarea value={form.description} onChange={e => upd('description', e.target.value)} rows={3} placeholder="Velkommen til…" className="resize-none rounded-xl" />
                <p className="text-[11px] text-muted-foreground/60 mt-1">{form.description.length}/500 tegn</p>
              </Field>
              <Field label="Detaljeret beskrivelse" hint="Fortæl hele historien om boligen og oplevelsen">
                <Textarea value={form.long_description} onChange={e => upd('long_description', e.target.value)} rows={6} placeholder="Denne charmerende bolig byder på…" className="resize-none rounded-xl" />
              </Field>
            </div>
            <NavFooter />
          </>
        );

      case 'details':
        return (
          <>
            <PanelTitle title="Boligoplysninger" subtitle="Grundlæggende fakta om boligen." emoji={emoji} />
            <div className="space-y-6">
              <Field label="Boligtype">
                <Input value={form.property_type} onChange={e => upd('property_type', e.target.value)} placeholder="Sommerhus, Hytte, Lejlighed..." className="h-11 rounded-xl" />
              </Field>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Max gæster', key: 'max_guests', icon: Users },
                  { label: 'Soveværelser', key: 'bedrooms', icon: Bed },
                  { label: 'Badeværelser', key: 'bathrooms', icon: Bath },
                ].map(item => (
                  <div key={item.key} className="rounded-2xl border border-border/30 p-5 text-center space-y-3 hover:border-primary/30 hover:shadow-sm transition-all">
                    <item.icon className="h-6 w-6 text-muted-foreground/60 mx-auto" />
                    <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => upd(item.key, Math.max(0, (form as any)[item.key] - 1))}
                        className="w-10 h-10 rounded-full border border-border/50 hover:border-primary hover:bg-primary/5 flex items-center justify-center text-lg text-muted-foreground hover:text-foreground transition-all active:scale-90">−</button>
                      <span className="text-2xl font-bold text-foreground w-8 text-center tabular-nums">{(form as any)[item.key]}</span>
                      <button onClick={() => upd(item.key, (form as any)[item.key] + 1)}
                        className="w-10 h-10 rounded-full border border-border/50 hover:border-primary hover:bg-primary/5 flex items-center justify-center text-lg text-muted-foreground hover:text-foreground transition-all active:scale-90">+</button>
                    </div>
                  </div>
                ))}
              </div>
              <Field label="Adresse">
                <Input value={form.address} onChange={e => upd('address', e.target.value)} placeholder="Skovvej 12, 6800 Varde" className="h-11 rounded-xl" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Region"><Input value={form.region} onChange={e => upd('region', e.target.value)} placeholder="Vestjylland" className="rounded-xl" /></Field>
                <Field label="By"><Input value={form.city} onChange={e => upd('city', e.target.value)} placeholder="Varde" className="rounded-xl" /></Field>
              </div>
            </div>
            <NavFooter />
          </>
        );

      case 'highlights':
        return (
          <>
            <PanelTitle title="Highlights" subtitle="De 3-5 vigtigste USP'er. Vises som ikoner under intro-teksten." emoji={emoji} />
            <div className="space-y-3">
              {form.highlights.map((h: string, i: number) => (
                <div key={i} className="flex items-center gap-3 group animate-in slide-in-from-left-2 duration-200" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">{i + 1}</div>
                  <Input value={h} onChange={e => updateListItem('highlights', i, e.target.value)} placeholder="F.eks. Privat sø, Brændeovn, Skovudsigt..." className="flex-1 h-11 rounded-xl" />
                  <Button size="sm" variant="ghost" onClick={() => removeListItem('highlights', i)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              {form.highlights.length < 5 && (
                <EmptyAddBlock onClick={() => addListItem('highlights')} icon={Sparkles} text="Tilføj highlight" hint="F.eks. Privat sø, Brændeovn, Skovudsigt" />
              )}
            </div>
            <NavFooter />
          </>
        );

      case 'content':
        return (
          <>
            <PanelTitle title="Indholdssektioner" subtitle="Redaktionelle blokke med billede + tekst — vises som karusellen på listingen." emoji={emoji} />
            <div className="space-y-4">
              {form.extra_sections.map((section, i) => (
                <div key={i} className="rounded-2xl border border-border/30 overflow-hidden group hover:border-primary/20 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between px-5 py-3 bg-muted/5 border-b border-border/20">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📖</span>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sektion {i + 1}</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removeContentSection(i)} className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                  <div className="p-5 space-y-4">
                    <Input value={section.title} onChange={e => updateContentSection(i, 'title', e.target.value)} placeholder="Sektionens overskrift" className="text-base font-semibold h-11 rounded-xl" />
                    <Textarea value={section.body} onChange={e => updateContentSection(i, 'body', e.target.value)} rows={4} placeholder="Beskrivende tekst…" className="resize-none rounded-xl" />
                    <Field label="Billede URL (valgfrit)">
                      <Input value={section.image || ''} onChange={e => updateContentSection(i, 'image', e.target.value)} placeholder="https://..." className="text-sm rounded-xl" />
                    </Field>
                    {section.image && (
                      <div className="rounded-xl overflow-hidden aspect-video bg-muted border border-border/20">
                        <img src={section.image} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <EmptyAddBlock onClick={addContentSection} icon={FileText} text="Tilføj indholdssektion" hint="Billede + tekst blok til listingen" />
            </div>
            <NavFooter />
          </>
        );

      case 'bedrooms':
        return (
          <>
            <PanelTitle title="Soveværelser" subtitle="Fortæl gæsten hvad de kan forvente i hvert værelse." emoji={emoji} />
            <div className="space-y-4">
              {form.bedroom_images.map((br, i) => (
                <div key={i} className="rounded-2xl border border-border/30 p-5 space-y-4 group hover:border-primary/20 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Bed className="h-5 w-5 text-primary/60" /></div>
                      <Input value={br.label} onChange={e => updateBedroom(i, 'label', e.target.value)} placeholder="Soveværelse nr. 1" className="text-base font-semibold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent" />
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removeBedroom(i)} className="opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                  </div>
                  <Field label="Beskrivelse"><Textarea value={br.description || ''} onChange={e => updateBedroom(i, 'description', e.target.value)} rows={2} placeholder="1 dobbeltseng, natborde, garderobeskab..." className="resize-none rounded-xl" /></Field>
                  <Field label="Billede URL"><Input value={br.url} onChange={e => updateBedroom(i, 'url', e.target.value)} placeholder="https://..." className="text-sm rounded-xl" /></Field>
                  {br.url && (
                    <div className="rounded-xl overflow-hidden aspect-video bg-muted border border-border/20">
                      <img src={br.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ))}
              <EmptyAddBlock onClick={addBedroom} icon={Bed} text="Tilføj soveværelse" hint="Beskriv hvert værelse med billede og detaljer" />
            </div>
            <NavFooter />
          </>
        );

      case 'facilities':
        return (
          <>
            <PanelTitle title="Faciliteter" subtitle="Hvad tilbyder boligen? Vælg fra listen eller tilføj dine egne." emoji={emoji} />
            <div className="space-y-2 mb-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hurtig-tilføj</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_AMENITIES.filter(a => !form.amenities.includes(a)).slice(0, 12).map(a => (
                  <button key={a} onClick={() => toggleAm(a)}
                    className="text-sm px-3 py-1.5 rounded-full border border-border/30 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all active:scale-95">
                    + {a}
                  </button>
                ))}
              </div>
              {form.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.amenities.map((a: string) => (
                    <span key={a} className="text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5 animate-in zoom-in-95 duration-200">
                      {a} <button onClick={() => toggleAm(a)} className="hover:text-destructive transition-colors"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Separator className="my-6" />
            <p className="text-sm font-medium text-foreground mb-4">Kategoriserede faciliteter</p>
            <div className="space-y-3">
              {form.facilities.map((cat, ci) => (
                <div key={ci} className="rounded-2xl border border-border/30 overflow-hidden group hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3 px-5 py-3 bg-muted/5 border-b border-border/20">
                    <Input value={cat.category} onChange={e => { const u = [...form.facilities]; u[ci].category = e.target.value; upd('facilities', u); }}
                      className="flex-1 text-sm font-semibold border-0 p-0 h-auto bg-transparent focus-visible:ring-0" />
                    <Badge variant="secondary" className="text-[10px]">{cat.items.length}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => upd('facilities', form.facilities.filter((_, i) => i !== ci))} className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="px-5 pb-4 pt-2 space-y-2">
                    {cat.items.map((item, ii) => (
                      <div key={ii} className="flex items-center gap-3">
                        <Switch checked={item.included} onCheckedChange={v => { const u = [...form.facilities]; (u[ci].items[ii] as any).included = v; upd('facilities', u); }} className="scale-75" />
                        <Input value={item.name} onChange={e => { const u = [...form.facilities]; (u[ci].items[ii] as any).name = e.target.value; upd('facilities', u); }}
                          placeholder="Facilitetsnavn" className="flex-1 text-sm h-9 rounded-lg" />
                        <Button size="sm" variant="ghost" onClick={() => { const u = [...form.facilities]; u[ci].items.splice(ii, 1); upd('facilities', u); }}
                          className="h-7 w-7 p-0 opacity-50 hover:opacity-100"><X className="h-3 w-3" /></Button>
                      </div>
                    ))}
                    <button onClick={() => { const u = [...form.facilities]; u[ci].items.push({ name: '', included: true }); upd('facilities', u); }}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 pt-1"><Plus className="h-3 w-3" /> Tilføj facilitet</button>
                  </div>
                </div>
              ))}
              <EmptyAddBlock onClick={() => upd('facilities', [...form.facilities, { category: 'Ny kategori', items: [] }])} icon={Wifi} text="Tilføj kategori" hint="Organisér faciliteter i kategorier" />
            </div>
            <NavFooter />
          </>
        );

      case 'included':
        return (
          <>
            <PanelTitle title="Inkluderet & Extras" subtitle="Hvad er med i prisen, hvad skal gæsten medbringe, og hvad kan tilkøbes?" emoji={emoji} />
            {[
              { field: 'included_items', title: '✅ Inkluderet i opholdet', placeholder: 'Kaffestation, toiletpapir...', icon: CheckCircle2 },
              { field: 'bring_yourself_items', title: '🎒 Medbring selv', placeholder: 'Sengelinned, håndklæder...', icon: Info },
              { field: 'purchasable_items', title: '🛒 Kan tilkøbes', placeholder: 'Brænde, slutrengøring...', icon: ShoppingBag },
            ].map(({ field, title, placeholder, icon: Icon }) => (
              <div key={field} className="mb-8">
                <p className="text-sm font-semibold text-foreground mb-3">{title}</p>
                <div className="space-y-2">
                  {(form as any)[field].map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 group">
                      <span className="w-6 h-6 rounded-full bg-muted/30 flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">{i + 1}</span>
                      <Input value={item} onChange={e => updateListItem(field, i, e.target.value)} placeholder={placeholder} className="flex-1 h-10 rounded-lg" />
                      <Button size="sm" variant="ghost" onClick={() => removeListItem(field, i)} className="opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                    </div>
                  ))}
                  <button onClick={() => addListItem(field)}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 pt-1"><Plus className="h-3 w-3" /> Tilføj</button>
                </div>
              </div>
            ))}
            <NavFooter />
          </>
        );

      case 'location':
        return (
          <>
            <PanelTitle title="Beliggenhed" subtitle="Fortæl gæsten om området og hvordan de finder boligen." emoji={emoji} />
            <div className="space-y-6">
              <Field label="Overskrift"><Input value={form.location_title} onChange={e => upd('location_title', e.target.value)} placeholder="Midt i naturen ved Kvie Sø" className="h-11 rounded-xl" /></Field>
              <Field label="Beskrivelse af området"><Textarea value={form.location_description} onChange={e => upd('location_description', e.target.value)} rows={4} placeholder="Boligen ligger i rolige omgivelser..." className="resize-none rounded-xl" /></Field>
              <Field label="Transport & omgivelser"><Textarea value={form.getting_around} onChange={e => upd('getting_around', e.target.value)} rows={3} placeholder="Nærmeste supermarked 5 min i bil..." className="resize-none rounded-xl" /></Field>
            </div>
            <NavFooter />
          </>
        );

      case 'reviews':
        return (
          <>
            <PanelTitle title="Anmeldelser" subtitle="Social proof fra gæster — vises på listingen." emoji={emoji} />
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Field label="Overordnet titel"><Input value={form.reviews_title} onChange={e => upd('reviews_title', e.target.value)} placeholder="Gæster elsker dette sted" className="rounded-xl" /></Field>
                <Field label="Rating (0-5)"><Input type="number" step={0.01} min={0} max={5} value={form.reviews_rating} onChange={e => upd('reviews_rating', parseFloat(e.target.value) || 0)} className="rounded-xl" /></Field>
                <Field label="Antal"><Input type="number" min={0} value={form.reviews_count} onChange={e => upd('reviews_count', parseInt(e.target.value) || 0)} className="rounded-xl" /></Field>
              </div>
              <div className="space-y-4">
                {form.reviews_entries.map((review, i) => (
                  <div key={i} className="rounded-2xl border border-border/30 p-5 space-y-3 group hover:border-primary/20 hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💬</span>
                        <span className="text-sm font-semibold text-foreground">Anmeldelse {i + 1}</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeReview(i)} className="opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                    </div>
                    <Textarea value={review.text} onChange={e => updateReview(i, 'text', e.target.value)} rows={2} placeholder="Det er et smukt sted i skoven…" className="resize-none rounded-xl" />
                    <div className="grid grid-cols-3 gap-3">
                      <Input value={review.author} onChange={e => updateReview(i, 'author', e.target.value)} placeholder="Mariella" className="rounded-lg" />
                      <Input value={review.location || ''} onChange={e => updateReview(i, 'location', e.target.value)} placeholder="Houten, NL" className="rounded-lg" />
                      <Input value={review.date || ''} onChange={e => updateReview(i, 'date', e.target.value)} placeholder="dec. 2025" className="rounded-lg" />
                    </div>
                  </div>
                ))}
                <EmptyAddBlock onClick={addReview} icon={Sparkles} text="Tilføj anmeldelse" hint="Tilføj social proof fra gæster" />
              </div>
            </div>
            <NavFooter />
          </>
        );

      case 'contact':
        return (
          <>
            <PanelTitle title="Kontakt" subtitle="Kontaktpersonen der vises i bunden af listingen." emoji={emoji} />
            <div className="space-y-6">
              {form.contact_image && (
                <div className="flex items-center gap-4 mb-2">
                  <img src={form.contact_image} alt="" className="w-16 h-16 rounded-2xl object-cover border border-border/30" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{form.contact_name || 'Kontaktperson'}</p>
                    <p className="text-xs text-muted-foreground">{form.contact_role || 'Udlejningschef'}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Navn"><Input value={form.contact_name} onChange={e => upd('contact_name', e.target.value)} placeholder="Emil Klockmann" className="h-11 rounded-xl" /></Field>
                <Field label="Rolle"><Input value={form.contact_role} onChange={e => upd('contact_role', e.target.value)} placeholder="Udlejningschef" className="h-11 rounded-xl" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="E-mail"><Input value={form.contact_email} onChange={e => upd('contact_email', e.target.value)} placeholder="ek@klockmann.dk" className="h-11 rounded-xl" /></Field>
                <Field label="Telefon"><Input value={form.contact_phone} onChange={e => upd('contact_phone', e.target.value)} placeholder="+45 42 44 07 27" className="h-11 rounded-xl" /></Field>
              </div>
              <Field label="Kontakttekst"><Textarea value={form.contact_text} onChange={e => upd('contact_text', e.target.value)} rows={3} placeholder="Har du spørgsmål? Skriv til mig…" className="resize-none rounded-xl" /></Field>
              <Field label="Profilbillede URL"><Input value={form.contact_image} onChange={e => upd('contact_image', e.target.value)} placeholder="https://..." className="rounded-xl" /></Field>
            </div>
            <NavFooter />
          </>
        );

      case 'checkin':
        return (
          <>
            <PanelTitle title="Ankomst & Regler" subtitle="Check-in info, husregler og praktisk information." emoji={emoji} />
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: 'Check-in', key: 'check_in_time', icon: '🔑' },
                  { label: 'Check-out', key: 'check_out_time', icon: '👋' },
                ].map(t => (
                  <div key={t.key} className="rounded-2xl border border-border/30 p-6 text-center space-y-3 hover:border-primary/30 hover:shadow-sm transition-all">
                    <span className="text-3xl">{t.icon}</span>
                    <p className="text-xs font-medium text-muted-foreground">{t.label}</p>
                    <Input value={(form as any)[t.key]} onChange={e => upd(t.key, e.target.value)} className="text-center text-xl font-bold h-12 rounded-xl" />
                  </div>
                ))}
              </div>
              <Field label="Ankomst-info"><Textarea value={form.checkin_info} onChange={e => upd('checkin_info', e.target.value)} rows={3} placeholder="Nøgleboks ved hoveddøren..." className="resize-none rounded-xl" /></Field>
              <Field label="Afrejse-info"><Textarea value={form.checkout_info} onChange={e => upd('checkout_info', e.target.value)} rows={3} placeholder="Tøm køleskab, tænd opvaskemaskine..." className="resize-none rounded-xl" /></Field>
              <Field label="Husregler"><Textarea value={form.house_rules} onChange={e => upd('house_rules', e.target.value)} rows={3} placeholder="Ingen rygning, max 8 gæster…" className="resize-none rounded-xl" /></Field>
              <Field label="Praktisk info"><Textarea value={form.practical_info} onChange={e => upd('practical_info', e.target.value)} rows={3} placeholder="WiFi: SommerNet, kode: 1234…" className="resize-none rounded-xl" /></Field>
            </div>
            <NavFooter />
          </>
        );

      case 'pricing':
        return (
          <>
            <PanelTitle title="Priser & Ophold" subtitle="Basispris, weekendtillæg og opholdskrav." emoji={emoji} />
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Pris pr. nat', key: 'base_price_per_night', suffix: 'kr', emoji: '💰' },
                  { label: 'Weekend-pris', key: 'weekend_price_per_night', suffix: 'kr', emoji: '🌙' },
                  { label: 'Rengøring', key: 'cleaning_fee', suffix: 'kr', emoji: '🧹' },
                ].map(p => (
                  <div key={p.key} className="rounded-2xl border border-border/30 p-5 text-center space-y-2 hover:border-primary/30 hover:shadow-sm transition-all">
                    <span className="text-xl">{p.emoji}</span>
                    <p className="text-xs font-medium text-muted-foreground">{p.label}</p>
                    <div className="flex items-center justify-center gap-1">
                      <Input type="number" min={0} step={50} value={(form as any)[p.key]}
                        onChange={e => upd(p.key, parseFloat(e.target.value) || 0)}
                        className="text-center text-xl font-bold h-12 w-28 border-0 focus-visible:ring-0 bg-transparent" />
                      <span className="text-sm text-muted-foreground">{p.suffix}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Min. nætter"><Input type="number" min={1} value={form.min_nights} onChange={e => upd('min_nights', parseInt(e.target.value) || 1)} className="h-11 rounded-xl" /></Field>
                <Field label="Max nætter"><Input type="number" min={1} value={form.max_nights} onChange={e => upd('max_nights', parseInt(e.target.value) || 30)} className="h-11 rounded-xl" /></Field>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-border/30 p-5 hover:shadow-sm transition-all">
                <Switch checked={form.is_active} onCheckedChange={v => upd('is_active', v)} />
                <div>
                  <p className="text-sm font-medium text-foreground">Synlig på SommerVibes.dk</p>
                  <p className="text-xs text-muted-foreground">Når slået til, kan gæster finde og booke denne listing</p>
                </div>
              </div>
            </div>
            <NavFooter />
          </>
        );

      default: return null;
    }
  };

  return (
    <div className="flex gap-0 -mx-4 md:-mx-8 -mt-2">
      {/* ── LEFT SIDEBAR ── */}
      <div className="w-72 shrink-0 border-r border-border/20 bg-card/20 sticky top-0 self-start h-[calc(100vh-8rem)] overflow-y-auto">
        {/* Progress header */}
        <div className="p-4 border-b border-border/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {celebration ? '🎉 Komplet!' : 'Fremskridt'}
            </span>
            <span className={cn("text-xs font-bold tabular-nums", completedCount === sections.length ? 'text-primary' : 'text-muted-foreground')}>
              {completedCount}/{sections.length}
            </span>
          </div>
          <div className="w-full bg-muted/20 rounded-full h-2 overflow-hidden">
            <div className={cn("h-2 rounded-full transition-all duration-700 ease-out", completedCount === sections.length ? 'bg-emerald-500' : 'bg-primary')}
              style={{ width: `${(completedCount / sections.length) * 100}%` }} />
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground">
            {saving ? <><Clock className="h-3 w-3 animate-spin" /> Gemmer…</>
              : lastSaved ? <><CheckCircle2 className="h-3 w-3 text-primary" /> Auto-gemt {format(lastSaved, 'HH:mm')}</>
              : <><CheckCircle2 className="h-3 w-3" /> Auto-gem aktiv</>}
          </div>
        </div>

        {/* Preview thumbnail */}
        {form.hero_image && (
          <div className="p-4 border-b border-border/20">
            <div className="rounded-xl overflow-hidden aspect-video bg-muted shadow-sm">
              <img src={form.hero_image} alt="" className="w-full h-full object-cover" />
            </div>
            <p className="text-sm font-semibold text-foreground mt-2 truncate">{form.name || 'Unavngivet listing'}</p>
            <p className="text-[11px] text-muted-foreground">{form.images.length} billeder · {form.region || '—'}</p>
          </div>
        )}

        {/* Section nav */}
        <nav className="p-2 space-y-0.5">
          {sections.map((s, idx) => (
            <button key={s.id} onClick={() => goToSection(s.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group',
                activeSection === s.id
                  ? 'bg-primary/10 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/15 hover:text-foreground'
              )}>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all text-sm',
                activeSection === s.id ? 'bg-primary/20 scale-105' : 'bg-muted/15 group-hover:bg-muted/30')}>
                {s.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{s.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">{s.subtitle}</p>
              </div>
              {s.done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
            </button>
          ))}
        </nav>

        {/* Keyboard hint */}
        <div className="p-4 border-t border-border/20">
          <p className="text-[10px] text-muted-foreground/40 text-center">←→ piletaster til navigation</p>
        </div>
      </div>

      {/* ── RIGHT CONTENT PANEL ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top action bar */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/20 px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{sections.find(s => s.id === activeSection)?.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-foreground">{sections.find(s => s.id === activeSection)?.label}</p>
              <p className="text-[10px] text-muted-foreground">Trin {currentIdx + 1} af {sections.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {listing.slug && (
              <a href={`https://sommervibes.dk/listing/${listing.slug}`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="ghost" className="rounded-xl gap-1.5 text-xs h-8"><Eye className="h-3.5 w-3.5" /> Preview</Button>
              </a>
            )}
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-xs h-8" onClick={handleTransferToChannels}>
              <Send className="h-3.5 w-3.5" /> Platforme
            </Button>
            <Button size="sm" className="rounded-xl gap-1.5 text-xs h-8 bg-primary hover:bg-primary/90" onClick={handlePublish} disabled={publishing}>
              <Globe className="h-3.5 w-3.5" /> {publishing ? 'Publicerer…' : 'Publicér'}
            </Button>
          </div>
        </div>

        {/* Content with transition */}
        <div ref={contentRef} className="flex-1 overflow-y-auto">
          <div key={animKey} className="p-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            {renderSection()}
          </div>
        </div>
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
  const [statusOpen, setStatusOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishFlowOpen, setPublishFlowOpen] = useState(false);
  const [sagDocs, setSagDocs] = useState<any[]>([]);
  const [docTemplates, setDocTemplates] = useState<any[]>([]);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editDocValues, setEditDocValues] = useState<Record<string, string>>({});
  const [ownerEditOpen, setOwnerEditOpen] = useState(false);
  const [ownerForm, setOwnerForm] = useState<any>({});
  // Actors state
  const [actors, setActors] = useState<any[]>([]);
  const [actorForm, setActorForm] = useState({ name: '', role: 'kontakt', email: '', phone: '', notes: '' });
  const [addingActor, setAddingActor] = useState(false);
  // Staff state
  const [staff, setStaff] = useState<any[]>([]);
  const [teamMembers] = useState([
    { id: '74a122fb-b6fc-48bc-8cee-944801ee2448', name: 'Emil Klockmann', email: 'ek@klockmann.dk' },
  ]);
  const [staffForm, setStaffForm] = useState({ staff_user_id: '74a122fb-b6fc-48bc-8cee-944801ee2448', staff_role: 'annoncerende' });
  const [addingStaff, setAddingStaff] = useState(false);

  const [taskFilter, setTaskFilter] = useState<'all' | 'not_started' | 'in_progress' | 'waiting' | 'done'>('all');

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'all') return tasks;
    return tasks.filter(t => t.status === taskFilter);
  }, [tasks, taskFilter]);
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
        const [{ data: prof }, { data: ts }, { data: docs }, { data: adds }, { data: bks }, { data: acts }, { data: stf }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', l.owner_id).single(),
          supabase.from('system_tasks').select('*').eq('linked_type', 'listing').eq('linked_id', id).order('due_date', { ascending: true }),
          supabase.from('documents').select('*').eq('owner_id', l.owner_id).limit(20),
          supabase.from('add_ons').select('*').eq('listing_id', id),
          supabase.from('bookings').select('*').eq('property_id', id).order('check_in', { ascending: false }).limit(20),
          supabase.from('listing_actors').select('*').eq('listing_id', id).order('sort_order'),
          supabase.from('listing_staff').select('*').eq('listing_id', id).order('created_at'),
        ]);
        setOwner(prof);
        setTasks(ts || []);
        setDocuments(docs || []);
        setAddons(adds || []);
        setBookings(bks || []);
        setActors(acts || []);
        setStaff(stf || []);
        loadSagDocs(id, l.owner_id);
      }
      setLoading(false);
    };
    load();
  }, [id, loadSagDocs]);

  

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
    { key: 'aktorer', label: 'Aktører', icon: UserPlus },
    { key: 'opgaver', label: 'Sagsopgaver', icon: ListChecks },
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
  const fmt = (v: number) => new Intl.NumberFormat('da-DK', { style: 'currency', currency: listing.currency || 'DKK', maximumFractionDigits: 0 }).format(v);

  return (
    <AdminLayout>
      <div className="space-y-0">

        {/* ═══════ DEDICATED SAG HEADER ═══════ */}
        <div className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border/40">
          {/* Row 1: Back + Title + Status */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/sager')} className="h-8 w-8 rounded-lg shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {cover && <img src={cover} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0 border border-border/30" />}

            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-foreground truncate">{listing.name}</h1>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {listing.region && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{listing.region}</span>}
                {owner && <><span className="text-muted-foreground/30">·</span><span>Ejer: {owner.full_name || owner.email}</span></>}
              </div>
            </div>

            {/* Status dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setStatusOpen(!statusOpen)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {st.label}
                <ChevronRight className={cn('h-3 w-3 transition-transform', statusOpen && 'rotate-90')} />
              </button>
              {statusOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setStatusOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border/40 rounded-xl shadow-xl p-1 min-w-[180px]">
                    {STAGE_OPTIONS.map(opt => {
                      const active = (listing.internal_status || 'draft') === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={async () => {
                            const isLive = opt.key === 'til_leje';
                            const { error } = await supabase.from('listings').update({
                              internal_status: opt.key,
                              is_active: isLive,
                            }).eq('id', listing.id);
                            if (error) { toast.error('Kunne ikke skifte stadie'); return; }
                            setListing({ ...listing, internal_status: opt.key, is_active: isLive });
                            toast.success(`Sag flyttet til "${opt.label}"${isLive ? ' — nu synlig på hjemmesiden' : ''}`);
                            setStatusOpen(false);
                          }}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left',
                            active
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'
                          )}
                        >
                          {active && <CheckCircle2 className="h-3 w-3" />}
                          {!active && <span className="w-3" />}
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Channel dots */}
            <ChannelDotsLarge airbnb={listing.channel_airbnb_ready} booking={listing.channel_booking_ready} vrbo={listing.channel_vrbo_ready} />
          </div>

          {/* Row 2: Tab navigation */}
          <div className="flex gap-0.5 overflow-x-auto px-4 pb-0">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-all border-b-2 -mb-px',
                  tab === t.key
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                )}
              >
                <t.icon className="h-3.5 w-3.5" />{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════ TAB CONTENT (with top padding for sticky header) ═══════ */}
        <div className="p-4 space-y-6">

        {/* ═══════ TAB CONTENT ═══════ */}

        {tab === 'overblik' && (
          <div className="space-y-6">
            {/* Key info grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

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
              <QuickStat label="Opgaver" value={`${tasks.filter(t => t.status === 'done').length}/${tasks.length}`} />
              <QuickStat label="Dokumenter" value={sagDocs.length + documents.length} />
              <QuickStat label="Tilkøb" value={addons.length} />
            </div>
          </div>
        )}

        {tab === 'listing' && <InlineListingEditor listing={listing} staffList={staff} onSaved={(updated) => setListing({ ...listing, ...updated })} />}

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

        {tab === 'aktorer' && (
          <>
          {/* ── Interne medarbejder-roller ── */}
          <SectionCard title="Medarbejder-roller" icon={Shield}>
            {addingStaff ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-4 space-y-3">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Tilføj medarbejder til rolle</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Medarbejder *</Label>
                    <select value={staffForm.staff_user_id} onChange={e => setStaffForm(f => ({ ...f, staff_user_id: e.target.value }))}
                      className="w-full h-9 rounded-xl border border-border/40 bg-muted/20 px-3 text-sm text-foreground">
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select></div>
                  <div><Label className="text-xs text-muted-foreground">Rolle *</Label>
                    <select value={staffForm.staff_role} onChange={e => setStaffForm(f => ({ ...f, staff_role: e.target.value }))}
                      className="w-full h-9 rounded-xl border border-border/40 bg-muted/20 px-3 text-sm text-foreground">
                      <option value="annoncerende">Annoncerende udlejningsrådgiver</option>
                      <option value="ansvarlig">Ansvarlig udlejningsrådgiver</option>
                      <option value="udlejningschef">Udlejningschef</option>
                      <option value="sagsbehandler">Sagsbehandler</option>
                    </select></div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setAddingStaff(false)}>Annuller</Button>
                  <Button size="sm" onClick={async () => {
                    const member = teamMembers.find(m => m.id === staffForm.staff_user_id);
                    if (!member) { toast.error('Vælg en medarbejder'); return; }
                    const { data: newStaff, error } = await supabase.from('listing_staff').insert({
                      listing_id: id!,
                      staff_name: member.name,
                      staff_role: staffForm.staff_role,
                      staff_email: member.email,
                      staff_user_id: member.id,
                    }).select().single();
                    if (error) { toast.error(error.message); return; }
                    setStaff(prev => [...prev, newStaff]);
                    setStaffForm({ staff_user_id: '74a122fb-b6fc-48bc-8cee-944801ee2448', staff_role: 'annoncerende' });
                    setAddingStaff(false);
                    toast.success(`${member.name} tilføjet som ${staffForm.staff_role}`);
                  }}>Tilføj</Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="mb-4 gap-1.5 rounded-xl" onClick={() => setAddingStaff(true)}>
                <Plus className="h-3.5 w-3.5" />Tilføj medarbejder
              </Button>
            )}

            {staff.length === 0 && !addingStaff ? (
              <p className="text-xs text-muted-foreground/50 italic py-4 text-center">Ingen medarbejdere tilknyttet endnu</p>
            ) : (
              <div className="space-y-2">
                {staff.map(s => {
                  const staffRoleLabels: Record<string, string> = {
                    annoncerende: 'Annoncerende udlejningsrådgiver',
                    ansvarlig: 'Ansvarlig udlejningsrådgiver',
                    kommissionerende: 'Ansvarlig udlejningsrådgiver',
                    udlejningschef: 'Udlejningschef',
                    sagsbehandler: 'Sagsbehandler',
                  };
                  return (
                    <div key={s.id} className="rounded-xl border border-border/30 bg-muted/10 p-3 flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-lg bg-accent/30 flex items-center justify-center shrink-0">
                        <Shield className="h-4 w-4 text-accent-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{s.staff_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px]">{staffRoleLabels[s.staff_role] || s.staff_role}</Badge>
                          {s.staff_email && <span className="text-[11px] text-muted-foreground">{s.staff_email}</span>}
                          {s.staff_phone && <span className="text-[11px] text-muted-foreground">{s.staff_phone}</span>}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                        onClick={async () => {
                          await supabase.from('listing_staff').delete().eq('id', s.id);
                          setStaff(prev => prev.filter(x => x.id !== s.id));
                          toast.success('Medarbejder fjernet');
                        }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* ── Eksterne aktører & kontakter ── */}
          <SectionCard title="Aktører & kontakter" icon={UserPlus}>
            {/* Add actor form */}
            {addingActor ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-4 space-y-3">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Tilføj aktør</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Navn *</Label>
                    <Input value={actorForm.name} onChange={e => setActorForm(f => ({ ...f, name: e.target.value }))} placeholder="Navn" /></div>
                  <div><Label className="text-xs text-muted-foreground">Rolle</Label>
                    <select value={actorForm.role} onChange={e => setActorForm(f => ({ ...f, role: e.target.value }))}
                      className="w-full h-9 rounded-xl border border-border/40 bg-muted/20 px-3 text-sm text-foreground">
                      <option value="kontakt">Kontaktperson</option>
                      <option value="rengoring">Rengøring</option>
                      <option value="handvaerker">Håndværker</option>
                      <option value="aegtefaelle">Ægtefælle / medejer</option>
                      <option value="noegleholder">Nøgleholder</option>
                      <option value="vicevært">Vicevært</option>
                      <option value="andet">Andet</option>
                    </select></div>
                  <div><Label className="text-xs text-muted-foreground">E-mail</Label>
                    <Input type="email" value={actorForm.email} onChange={e => setActorForm(f => ({ ...f, email: e.target.value }))} placeholder="email@eksempel.dk" /></div>
                  <div><Label className="text-xs text-muted-foreground">Telefon</Label>
                    <Input value={actorForm.phone} onChange={e => setActorForm(f => ({ ...f, phone: e.target.value }))} placeholder="+45 12345678" /></div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Note</Label>
                  <Textarea value={actorForm.notes} onChange={e => setActorForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Kontekst, relation, tilgængelighed..." /></div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setAddingActor(false)}>Annuller</Button>
                  <Button size="sm" onClick={async () => {
                    if (!actorForm.name.trim()) { toast.error('Navn er påkrævet'); return; }
                    const { data: newActor, error } = await supabase.from('listing_actors').insert({
                      listing_id: id!,
                      name: actorForm.name.trim(),
                      role: actorForm.role,
                      email: actorForm.email || null,
                      phone: actorForm.phone || null,
                      notes: actorForm.notes || null,
                      sort_order: actors.length,
                    }).select().single();
                    if (error) { toast.error(error.message); return; }
                    setActors(prev => [...prev, newActor]);
                    setActorForm({ name: '', role: 'kontakt', email: '', phone: '', notes: '' });
                    setAddingActor(false);
                    toast.success('Aktør tilføjet');
                  }}>Tilføj</Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="mb-4 gap-1.5 rounded-xl" onClick={() => setAddingActor(true)}>
                <Plus className="h-3.5 w-3.5" />Tilføj aktør
              </Button>
            )}

            {actors.length === 0 && !addingActor ? (
              <p className="text-xs text-muted-foreground/50 italic py-4 text-center">Ingen aktører tilknyttet — tilføj ægtefæller, rengøringspersonale, håndværkere mv.</p>
            ) : (
              <div className="space-y-2">
                {actors.map(a => {
                  const roleLabels: Record<string, string> = {
                    kontakt: 'Kontaktperson', rengoring: 'Rengøring', handvaerker: 'Håndværker',
                    aegtefaelle: 'Ægtefælle / medejer', noegleholder: 'Nøgleholder', vicevært: 'Vicevært', andet: 'Andet',
                  };
                  return (
                    <div key={a.id} className="rounded-xl border border-border/30 bg-muted/10 p-3 flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{a.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px]">{roleLabels[a.role] || a.role}</Badge>
                          {a.email && <span className="text-[11px] text-muted-foreground">{a.email}</span>}
                          {a.phone && <span className="text-[11px] text-muted-foreground">{a.phone}</span>}
                        </div>
                        {a.notes && <p className="text-[11px] text-muted-foreground mt-1">{a.notes}</p>}
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                        onClick={async () => {
                          await supabase.from('listing_actors').delete().eq('id', a.id);
                          setActors(prev => prev.filter(x => x.id !== a.id));
                          toast.success('Aktør fjernet');
                        }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
           </SectionCard>
          </>
        )}


        {tab === 'opgaver' && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Ikke startet', count: tasks.filter(t => t.status === 'not_started').length, color: 'text-muted-foreground' },
                { label: 'I gang', count: tasks.filter(t => t.status === 'in_progress').length, color: 'text-blue-500' },
                { label: 'Afventer', count: tasks.filter(t => t.status === 'waiting').length, color: 'text-amber-500' },
                { label: 'Færdig', count: tasks.filter(t => t.status === 'done').length, color: 'text-emerald-500' },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-border/40 bg-card/60 p-3 text-center">
                  <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Task filter */}
            <div className="flex gap-2 items-center">
              {(['all', 'not_started', 'in_progress', 'waiting', 'done'] as const).map(f => (
                <button key={f}
                  onClick={() => setTaskFilter(f)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    taskFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'
                  )}>
                  {f === 'all' ? 'Alle' : f === 'not_started' ? 'Ikke startet' : f === 'in_progress' ? 'I gang' : f === 'waiting' ? 'Afventer' : 'Færdig'}
                </button>
              ))}
              <span className="ml-auto text-xs text-muted-foreground">{filteredTasks.length} opgaver</span>
            </div>

            {/* Task list */}
            <div className="space-y-1.5">
              {filteredTasks.map(t => {
                const priorityColor = t.priority === 'urgent' ? 'border-l-red-500' : t.priority === 'high' ? 'border-l-amber-500' : t.priority === 'normal' ? 'border-l-blue-400' : 'border-l-muted';
                const isDone = t.status === 'done';
                const isOverdue = t.due_date && new Date(t.due_date) < new Date() && !isDone;
                return (
                  <div key={t.id} className={cn(
                    'rounded-lg border border-border/30 bg-card/60 px-4 py-3 flex items-center gap-3 transition-all border-l-[3px]',
                    priorityColor,
                    isDone && 'opacity-50'
                  )}>
                    <button
                      onClick={async () => {
                        const newStatus = isDone ? 'not_started' : 'done';
                        await supabase.from('system_tasks').update({
                          status: newStatus,
                          completed_at: newStatus === 'done' ? new Date().toISOString() : null,
                        }).eq('id', t.id);
                        setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null } : x));
                      }}
                      className={cn(
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                        isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/30 hover:border-primary'
                      )}>
                      {isDone && <CheckCircle2 className="h-3 w-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', isDone ? 'line-through text-muted-foreground' : 'text-foreground')}>{t.title}</p>
                      {t.description && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{t.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                      {t.due_date && (
                        <span className={cn('text-[10px]', isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground')}>
                          {format(new Date(t.due_date), 'd. MMM', { locale: da })}
                        </span>
                      )}
                      {t.assigned_name && (
                        <span className="text-[10px] bg-muted/30 rounded-full px-2 py-0.5 text-muted-foreground">{t.assigned_name?.split(' ').map((n: string) => n[0]).join('')}</span>
                      )}
                      {/* Quick status buttons */}
                      {!isDone && (
                        <select
                          value={t.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value as any;
                            await supabase.from('system_tasks').update({ status: newStatus } as any).eq('id', t.id);
                            setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: newStatus } : x));
                          }}
                          className="text-[10px] bg-muted/20 border-none rounded px-1 py-0.5 text-muted-foreground appearance-auto"
                        >
                          <option value="not_started">Ikke startet</option>
                          <option value="in_progress">I gang</option>
                          <option value="waiting">Afventer</option>
                          <option value="done">Færdig</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredTasks.length === 0 && (
                <p className="text-xs text-muted-foreground/50 italic py-8 text-center">Ingen opgaver matcher filteret</p>
              )}
            </div>
          </div>
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
