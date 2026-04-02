import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ListingCalendarPricing } from './ListingCalendarPricing';
import { ChannelDataSection } from './ChannelDataSection';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowLeft, Loader2, Save, X, Plus, Home, ImageIcon, DollarSign, CheckCircle2, Globe,
  Star, AlertTriangle, Info, ClipboardCheck, Rocket, Sparkles, Zap,
  CircleDot, Circle, Check, Languages, Wand2, FileText,
  Link2, RefreshCw, WifiOff, Wifi, Clock, AlertCircle,
  Eye, Settings, Tag, Puzzle, FileCheck, StickyNote, Calendar as CalendarIcon, ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ──
interface ListingFull {
  id: string; slug: string; name: string; description: string | null;
  address: string | null; max_guests: number; bedrooms: number | null; bathrooms: number | null;
  base_price_per_night: number; cleaning_fee: number | null;
  check_in_time: string | null; check_out_time: string | null;
  is_active: boolean; amenities: string[] | null; house_rules: string | null;
  practical_info: string | null; images: string[] | null; hero_image: string | null;
  currency: string; region: string | null; city: string | null; owner_id: string; sort_order: number;
  tagline: string | null; long_description: string | null; about_property: string | null;
  about_area: string | null; highlights: string[] | null; sqm: number | null;
  property_type: string | null; weekend_price_per_night: number | null;
  min_nights: number | null; deposit: number | null;
  channel_airbnb_ready: boolean | null; channel_booking_ready: boolean | null; channel_vrbo_ready: boolean | null;
  channel_airbnb_title: string | null; channel_booking_title: string | null; channel_vrbo_title: string | null;
  channel_airbnb_description: string | null; channel_booking_description: string | null; channel_vrbo_description: string | null;
  channel_airbnb_highlights: string[] | null; channel_airbnb_image_order: string[] | null;
  channel_airbnb_house_rules: string | null; channel_airbnb_checkin_notes: string | null;
  channel_booking_room_setup: string | null; channel_booking_facilities_mapping: Record<string, any> | null;
  channel_booking_policies: string | null; channel_booking_checkin_checkout: string | null;
  channel_vrbo_highlights: string[] | null; channel_vrbo_rules: string | null; channel_vrbo_photo_order: string[] | null;
  readiness_score: number | null; internal_status: string | null;
  checkin_info: string | null; checkout_info: string | null;
  image_captions: Record<string, string> | null;
  channel_manager_partner: string | null; external_listing_id: string | null;
  external_property_id: string | null; last_sync_at: string | null;
  sync_status: string | null; sync_error_message: string | null;
  updated_at: string;
}

interface Props { listingId: string; onBack: () => void; }

// ── UI Helpers ──
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-4">
      <div>
        <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

// ── Constants ──
const AMENITIES_PRESETS = [
  'WiFi', 'Køkken', 'Parkering', 'EV-lader', 'Sauna', 'Spa / Jacuzzi',
  'Vaskemaskine', 'Tørretumbler', 'Opvaskemaskine', 'Brændeovn', 'Terrasse',
  'Havudsigt', 'Grill', 'Trampolin', 'Legeplads', 'Cykel-udlån',
  'Kajak', 'Pool', 'Husdjur tilladt', 'Røgfrit', 'TV', 'Aircondition',
];

const PROPERTY_TYPES = [
  { value: 'summerhouse', label: 'Sommerhus' },
  { value: 'villa', label: 'Villa' },
  { value: 'apartment', label: 'Lejlighed' },
  { value: 'cabin', label: 'Hytte' },
  { value: 'farmhouse', label: 'Bondegård' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Kladde', icon: Circle, color: 'text-muted-foreground' },
  { value: 'preparing', label: 'Under klargøring', icon: CircleDot, color: 'text-amber-500' },
  { value: 'ready', label: 'Klar', icon: Check, color: 'text-emerald-500' },
  { value: 'live', label: 'Live', icon: Zap, color: 'text-primary' },
  { value: 'paused', label: 'Pauset', icon: Circle, color: 'text-orange-500' },
];

// ── Readiness ──
function calcReadiness(f: Partial<ListingFull>) {
  const checks: [string, boolean][] = [
    ['Navn', !!f.name], ['Beskrivelse', !!(f.description && f.description.length > 20)],
    ['Adresse', !!f.address], ['Region', !!f.region], ['Max gæster', (f.max_guests || 0) > 0],
    ['Soveværelser', (f.bedrooms || 0) > 0], ['Basispris', (f.base_price_per_night || 0) > 0],
    ['Rengøringsgebyr', (f.cleaning_fee || 0) > 0], ['Hero-billede', !!f.hero_image],
    ['Mindst 3 billeder', (f.images?.length || 0) >= 3], ['Faciliteter (3+)', (f.amenities?.length || 0) >= 3],
    ['Husregler', !!(f.house_rules && f.house_rules.length > 10)],
    ['Check-in tid', !!f.check_in_time], ['Check-out tid', !!f.check_out_time],
  ];
  const passed = checks.filter(([, ok]) => ok).map(([n]) => n);
  const missing = checks.filter(([, ok]) => !ok).map(([n]) => n);
  return { score: Math.round((passed.length / checks.length) * 100), missing, passed };
}

type ChannelReadinessResult = { score: number; missing: { field: string; tab: string; action: string }[]; passed: string[] };
function calcChannelReadiness(f: Partial<ListingFull>, channel: 'airbnb' | 'booking' | 'vrbo'): ChannelReadinessResult {
  const shared: [string, boolean, string, string][] = [
    ['Hero-billede', !!f.hero_image, 'billeder', 'Upload et hero-billede'],
    ['Min. 3 galleri-billeder', (f.images?.length || 0) >= 3, 'billeder', 'Tilføj flere billeder'],
    ['Adresse', !!f.address, 'grunddata', 'Udfyld adressen'],
    ['Gæstekapacitet', (f.max_guests || 0) > 0, 'grunddata', 'Angiv max gæster'],
    ['Soveværelser', (f.bedrooms || 0) > 0, 'grunddata', 'Angiv antal soveværelser'],
    ['Basispris', (f.base_price_per_night || 0) > 0, 'priser', 'Sæt en basispris'],
    ['Check-in tid', !!f.check_in_time, 'grunddata', 'Angiv check-in tid'],
    ['Check-out tid', !!f.check_out_time, 'grunddata', 'Angiv check-out tid'],
    ['Faciliteter (3+)', (f.amenities?.length || 0) >= 3, 'faciliteter', 'Tilføj faciliteter'],
  ];
  const channelChecks: Record<string, [string, boolean, string, string][]> = {
    airbnb: [
      ['Airbnb-titel', !!(f.channel_airbnb_title && f.channel_airbnb_title.length >= 5), 'kanaler', 'Skriv en Airbnb-titel'],
      ['Airbnb-beskrivelse', !!(f.channel_airbnb_description && f.channel_airbnb_description.length >= 20), 'kanaler', 'Skriv en Airbnb-beskrivelse'],
      ['Airbnb-husregler', !!(f.channel_airbnb_house_rules && f.channel_airbnb_house_rules.length > 5), 'kanaler', 'Tilføj husregler'],
      ['Airbnb-highlights', (f.channel_airbnb_highlights?.length || 0) >= 2, 'kanaler', 'Tilføj highlights'],
      ['Airbnb check-in noter', !!(f.channel_airbnb_checkin_notes && f.channel_airbnb_checkin_notes.length > 5), 'kanaler', 'Beskriv check-in'],
    ],
    booking: [
      ['Booking.com-titel', !!(f.channel_booking_title && f.channel_booking_title.length >= 5), 'kanaler', 'Skriv en titel'],
      ['Booking.com-beskrivelse', !!(f.channel_booking_description && f.channel_booking_description.length >= 20), 'kanaler', 'Skriv en beskrivelse'],
      ['Værelseopsætning', !!(f.channel_booking_room_setup && f.channel_booking_room_setup.length > 3), 'kanaler', 'Beskriv værelserne'],
      ['Politikker', !!(f.channel_booking_policies && f.channel_booking_policies.length > 5), 'kanaler', 'Tilføj politik'],
      ['Check-in/out info', !!(f.channel_booking_checkin_checkout && f.channel_booking_checkin_checkout.length > 5), 'kanaler', 'Udfyld check-in/out'],
    ],
    vrbo: [
      ['Vrbo-titel', !!(f.channel_vrbo_title && f.channel_vrbo_title.length >= 5), 'kanaler', 'Skriv en titel'],
      ['Vrbo-beskrivelse', !!(f.channel_vrbo_description && f.channel_vrbo_description.length >= 20), 'kanaler', 'Skriv en beskrivelse'],
      ['Vrbo-highlights', (f.channel_vrbo_highlights?.length || 0) >= 2, 'kanaler', 'Tilføj highlights'],
      ['Vrbo-regler', !!(f.channel_vrbo_rules && f.channel_vrbo_rules.length > 5), 'kanaler', 'Tilføj regler'],
    ],
  };
  const all = [...shared, ...channelChecks[channel]];
  const passed = all.filter(([, ok]) => ok).map(([n]) => n);
  const missing = all.filter(([, ok]) => !ok).map(([n, , tab, action]) => ({ field: n, tab, action }));
  return { score: Math.round((passed.length / all.length) * 100), missing, passed };
}

function ReadinessRing({ score, size = 48, strokeWidth = 3 }: { score: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const color = score >= 80 ? 'hsl(142, 71%, 45%)' : score >= 50 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 84%, 60%)';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${(score / 100) * c} ${c}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-foreground">{score}%</span>
      </div>
    </div>
  );
}

// ── Top-level tabs ──
const TOP_TABS = [
  { value: 'overblik', label: 'Overblik', icon: Eye },
  { value: 'listing', label: 'Listing', icon: Home },
  { value: 'integrationer', label: 'Integrationer', icon: Puzzle },
  { value: 'kanaler', label: 'Kanaler', icon: Globe },
  { value: 'kalender', label: 'Kalender', icon: CalendarIcon },
  { value: 'priser', label: 'Priser', icon: DollarSign },
  { value: 'tilkoeb', label: 'Tilkøb', icon: ShoppingBag },
  { value: 'dokumenter', label: 'Dokumenter', icon: FileText },
  { value: 'opgaver', label: 'Opgaver', icon: ClipboardCheck },
  { value: 'noter', label: 'Noter', icon: StickyNote },
];

// Sub-tabs for the "Listing" top tab
const LISTING_SUB_TABS = [
  { value: 'grunddata', label: 'Grunddata', icon: Settings },
  { value: 'beskrivelse', label: 'Beskrivelse', icon: FileText },
  { value: 'billeder', label: 'Billeder', icon: ImageIcon },
  { value: 'faciliteter', label: 'Faciliteter', icon: Tag },
  { value: 'priser_sub', label: 'Priser', icon: DollarSign },
  { value: 'klargoering', label: 'Klargøring', icon: FileCheck },
];

// ── Main Component ──
export function ListingEditorV2({ listingId, onBack }: Props) {
  const { toast } = useToast();
  const [listing, setListing] = useState<ListingFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [newAmenity, setNewAmenity] = useState('');
  const [newHighlight, setNewHighlight] = useState('');
  const [topTab, setTopTab] = useState('listing');
  const [subTab, setSubTab] = useState('grunddata');

  // AI states
  const [aiImproving, setAiImproving] = useState(false);
  const [aiAction, setAiAction] = useState<string | null>(null);
  const [aiPreview, setAiPreview] = useState<any>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [airbnbPreparing, setAirbnbPreparing] = useState(false);
  const [channelPreparing, setChannelPreparing] = useState(false);

  // Auto-save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const autoSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => handleSaveInner(), 2000);
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('listings').select('*').eq('id', listingId).single();
      if (data) setListing(data as unknown as ListingFull);
      setLoading(false);
    };
    load();
  }, [listingId]);

  const update = <K extends keyof ListingFull>(key: K, value: ListingFull[K]) => {
    setListing(prev => prev ? { ...prev, [key]: value } : prev);
    setIsDirty(true);
  };

  const readiness = useMemo(() => listing ? calcReadiness(listing) : { score: 0, missing: [], passed: [] }, [listing]);
  const channelReadiness = useMemo(() => {
    if (!listing) return { airbnb: { score: 0, missing: [], passed: [] }, booking: { score: 0, missing: [], passed: [] }, vrbo: { score: 0, missing: [], passed: [] } };
    return { airbnb: calcChannelReadiness(listing, 'airbnb'), booking: calcChannelReadiness(listing, 'booking'), vrbo: calcChannelReadiness(listing, 'vrbo') };
  }, [listing]);

  const handleSaveInner = async () => {
    if (!listing) return;
    setSaving(true);
    const score = calcReadiness(listing).score;
    const { error } = await supabase.from('listings').update({
      name: listing.name, description: listing.description, address: listing.address,
      region: listing.region, city: listing.city, max_guests: listing.max_guests, bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms, base_price_per_night: listing.base_price_per_night,
      cleaning_fee: listing.cleaning_fee, check_in_time: listing.check_in_time,
      check_out_time: listing.check_out_time, is_active: listing.is_active,
      house_rules: listing.house_rules, practical_info: listing.practical_info,
      amenities: listing.amenities, images: listing.images, hero_image: listing.hero_image,
      tagline: listing.tagline, long_description: listing.long_description,
      about_property: listing.about_property, about_area: listing.about_area,
      highlights: listing.highlights, sqm: listing.sqm, property_type: listing.property_type,
      weekend_price_per_night: listing.weekend_price_per_night, min_nights: listing.min_nights,
      deposit: listing.deposit, channel_airbnb_ready: listing.channel_airbnb_ready,
      channel_booking_ready: listing.channel_booking_ready, channel_vrbo_ready: listing.channel_vrbo_ready,
      channel_airbnb_title: listing.channel_airbnb_title, channel_booking_title: listing.channel_booking_title,
      channel_vrbo_title: listing.channel_vrbo_title, channel_airbnb_description: listing.channel_airbnb_description,
      channel_booking_description: listing.channel_booking_description,
      channel_vrbo_description: listing.channel_vrbo_description,
      channel_airbnb_highlights: listing.channel_airbnb_highlights as any,
      channel_airbnb_house_rules: listing.channel_airbnb_house_rules,
      channel_airbnb_checkin_notes: listing.channel_airbnb_checkin_notes,
      channel_booking_room_setup: listing.channel_booking_room_setup,
      channel_booking_policies: listing.channel_booking_policies,
      channel_booking_checkin_checkout: listing.channel_booking_checkin_checkout,
      channel_vrbo_highlights: listing.channel_vrbo_highlights as any,
      channel_vrbo_rules: listing.channel_vrbo_rules,
      readiness_score: score, internal_status: listing.internal_status,
      checkin_info: listing.checkin_info, checkout_info: listing.checkout_info,
      image_captions: listing.image_captions as any,
    }).eq('id', listing.id);
    setSaving(false);
    if (error) { toast({ title: 'Fejl ved gem', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Gemt!' }); setIsDirty(false); }
  };

  const handleSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    handleSaveInner();
  };

  // AI Actions
  const handleAiAction = async (action: string) => {
    if (!listing) return;
    setAiImproving(true); setAiAction(action); setAiDialogOpen(true); setAiPreview(null);
    try {
      const { data, error } = await supabase.functions.invoke('improve-listing-text', { body: { listing, action } });
      if (error) throw error;
      if (data?.improved) setAiPreview({ ...data.improved, _action: action });
      else if (data?.error) { toast({ title: 'AI-fejl', description: data.error, variant: 'destructive' }); setAiDialogOpen(false); }
    } catch (e: any) { toast({ title: 'Fejl', description: e.message, variant: 'destructive' }); setAiDialogOpen(false); }
    finally { setAiImproving(false); }
  };

  const applyAiSuggestions = () => {
    if (!aiPreview || !listing) return;
    const action = aiPreview._action || 'improve_all';
    if (action === 'improve_title' && aiPreview.suggestions?.length) update('description', aiPreview.suggestions[0]);
    else if (action === 'improve_description' && aiPreview.description) update('description', aiPreview.description);
    else if (action === 'improve_long_description' && aiPreview.long_description) update('long_description', aiPreview.long_description);
    else if (action === 'generate_highlights' && aiPreview.highlights?.length) update('highlights', aiPreview.highlights);
    else if (action === 'channel_airbnb') {
      if (aiPreview.title) update('channel_airbnb_title', aiPreview.title);
      if (aiPreview.description) update('channel_airbnb_description', aiPreview.description);
      if (aiPreview.highlights) update('channel_airbnb_highlights', aiPreview.highlights);
      if (aiPreview.house_rules) update('channel_airbnb_house_rules', aiPreview.house_rules);
      if (aiPreview.checkin_notes) update('channel_airbnb_checkin_notes', aiPreview.checkin_notes);
    } else if (action === 'channel_booking') {
      if (aiPreview.title) update('channel_booking_title', aiPreview.title);
      if (aiPreview.description) update('channel_booking_description', aiPreview.description);
      if (aiPreview.room_setup) update('channel_booking_room_setup', aiPreview.room_setup);
      if (aiPreview.policies) update('channel_booking_policies', aiPreview.policies);
      if (aiPreview.checkin_checkout) update('channel_booking_checkin_checkout', aiPreview.checkin_checkout);
    } else if (action === 'channel_vrbo') {
      if (aiPreview.title) update('channel_vrbo_title', aiPreview.title);
      if (aiPreview.description) update('channel_vrbo_description', aiPreview.description);
      if (aiPreview.highlights) update('channel_vrbo_highlights', aiPreview.highlights);
      if (aiPreview.rules) update('channel_vrbo_rules', aiPreview.rules);
    } else {
      if (aiPreview.title) update('description', aiPreview.title);
      if (aiPreview.tagline) update('tagline', aiPreview.tagline);
      if (aiPreview.long_description) update('long_description', aiPreview.long_description);
      if (aiPreview.highlights?.length) update('highlights', aiPreview.highlights);
    }
    toast({ title: 'AI-indhold anvendt!' }); setAiDialogOpen(false); setAiPreview(null);
  };

  const handlePrepareChannel = async (channel: 'airbnb' | 'booking' | 'vrbo') => {
    if (!listing) return;
    if (channel === 'airbnb') {
      setAirbnbPreparing(true);
      try {
        const { data, error } = await supabase.functions.invoke('improve-listing-text', { body: { listing, channel: 'airbnb' } });
        if (!error && data?.improved) {
          update('channel_airbnb_title', data.improved.title || listing.description || listing.name);
          update('channel_airbnb_description', data.improved.long_description || data.improved.description || listing.long_description || listing.description || '');
        } else {
          if (!listing.channel_airbnb_title) update('channel_airbnb_title', listing.description || listing.name);
          if (!listing.channel_airbnb_description) update('channel_airbnb_description', [listing.long_description, listing.about_property, listing.about_area].filter(Boolean).join('\n\n') || listing.description || '');
        }
        if (readiness.score >= 70) update('channel_airbnb_ready', true);
        toast({ title: 'Airbnb-indhold forberedt!' });
      } catch { /* fallback */ }
      finally { setAirbnbPreparing(false); }
      return;
    }
    setChannelPreparing(true);
    const titleKey = `channel_${channel}_title` as keyof ListingFull;
    const descKey = `channel_${channel}_description` as keyof ListingFull;
    const readyKey = `channel_${channel}_ready` as keyof ListingFull;
    if (!listing[titleKey]) update(titleKey as any, listing.description || listing.name);
    if (!listing[descKey]) update(descKey as any, [listing.long_description, listing.about_property, listing.about_area].filter(Boolean).join('\n\n') || listing.description || '');
    if (readiness.score >= 70 && !listing[readyKey]) update(readyKey as any, true);
    setChannelPreparing(false);
    toast({ title: `${channel === 'booking' ? 'Booking.com' : 'Vrbo'}-indhold forberedt!` });
  };

  if (loading || !listing) {
    return <div className="flex items-center justify-center py-24 text-muted-foreground gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Henter listing...</div>;
  }

  const currentStatus = STATUS_OPTIONS.find(s => s.value === (listing.internal_status || 'draft')) || STATUS_OPTIONS[0];

  return (
    <div className="space-y-0 pb-24">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9"><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl font-bold text-foreground truncate">{listing.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">{listing.slug}</span>
            <span className="text-muted-foreground/30">·</span>
            <div className="flex items-center gap-1">
              <div className={`h-1.5 rounded-full ${readiness.score >= 80 ? 'bg-emerald-500' : readiness.score >= 50 ? 'bg-amber-400' : 'bg-destructive'}`} style={{ width: `${Math.max(readiness.score * 0.4, 6)}px` }} />
              <span className="text-xs font-medium text-muted-foreground">{readiness.score}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={listing.internal_status || 'draft'} onValueChange={v => update('internal_status', v)}>
            <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(s => (
                <SelectItem key={s.value} value={s.value}>
                  <span className="flex items-center gap-1.5"><s.icon className={`h-3 w-3 ${s.color}`} />{s.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleSave} disabled={saving || !isDirty} className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Gem
          </Button>
        </div>
      </div>

      {/* ── TOP TABS ── */}
      <div className="border-b border-border -mx-5 md:-mx-8 px-5 md:px-8 overflow-x-auto scrollbar-hide">
        <div className="flex gap-0 min-w-max">
          {TOP_TABS.map(tab => (
            <button key={tab.value} onClick={() => setTopTab(tab.value)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap',
                topTab === tab.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}>
              <tab.icon className="h-3.5 w-3.5" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SUB TABS (only for Listing tab) ── */}
      {topTab === 'listing' && (
        <div className="flex items-center gap-1 mt-4 mb-6 overflow-x-auto scrollbar-hide">
          {LISTING_SUB_TABS.map(tab => (
            <button key={tab.value} onClick={() => setSubTab(tab.value)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full border transition-all whitespace-nowrap',
                subTab === tab.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-transparent text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
              )}>
              <tab.icon className="h-3 w-3" /> {tab.label}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground/50 shrink-0">Auto-gem</span>
        </div>
      )}

      {/* ═══════════════════════ LISTING TAB ═══════════════════════ */}
      {topTab === 'listing' && (
        <div className="space-y-6 mt-2">
          {/* ── GRUNDDATA ── */}
          {subTab === 'grunddata' && (
            <div className="space-y-6">
              <Section title="Grunddata" description="Kerneoplysninger om boligen">
                <Field label="Titel" hint="Det navn gæsten ser">
                  <Input value={listing.name} onChange={e => update('name', e.target.value)} />
                </Field>
                <Field label="Tagline">
                  <Input value={listing.tagline || ''} onChange={e => update('tagline', e.target.value)} placeholder="Moderne sommerhus med havudsigt" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Boligtype">
                    <Select value={listing.property_type || 'summerhouse'} onValueChange={v => update('property_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Region">
                    <Input value={listing.region || ''} onChange={e => update('region', e.target.value)} placeholder="Nordsjælland" />
                  </Field>
                </div>
                <Field label="Adresse">
                  <Input value={listing.address || ''} onChange={e => update('address', e.target.value)} placeholder="Skovvej 12, 4573 Højby" />
                </Field>
                <Field label="By">
                  <Input value={listing.city || ''} onChange={e => update('city' as any, e.target.value)} placeholder="Hornbæk" />
                </Field>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Max gæster">
                    <Input type="number" min={1} value={listing.max_guests} onChange={e => update('max_guests', parseInt(e.target.value) || 1)} />
                  </Field>
                  <Field label="Soveværelser">
                    <Input type="number" min={0} value={listing.bedrooms || 0} onChange={e => update('bedrooms', parseInt(e.target.value) || 0)} />
                  </Field>
                  <Field label="Badeværelser">
                    <Input type="number" min={0} value={listing.bathrooms || 0} onChange={e => update('bathrooms', parseInt(e.target.value) || 0)} />
                  </Field>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Switch checked={listing.is_active} onCheckedChange={v => update('is_active', v)} />
                  <Label className="text-sm">Aktiv</Label>
                </div>
              </Section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Section title="Check-in">
                  <Field label="Check-in tid">
                    <Input type="time" value={listing.check_in_time || '15:00'} onChange={e => update('check_in_time', e.target.value)} />
                  </Field>
                  <Field label="Check-in instruktioner">
                    <Textarea value={listing.checkin_info || ''} onChange={e => update('checkin_info', e.target.value)} rows={3} placeholder="Instruktioner til check-in..." />
                  </Field>
                </Section>
                <Section title="Check-out">
                  <Field label="Check-out tid">
                    <Input type="time" value={listing.check_out_time || '10:00'} onChange={e => update('check_out_time', e.target.value)} />
                  </Field>
                  <Field label="Check-out instruktioner">
                    <Textarea value={listing.checkout_info || ''} onChange={e => update('checkout_info', e.target.value)} rows={3} placeholder="Instruktioner til check-out..." />
                  </Field>
                </Section>
              </div>
            </div>
          )}

          {/* ── BESKRIVELSE ── */}
          {subTab === 'beskrivelse' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="ghost" size="sm" onClick={() => handleAiAction('improve_title')} disabled={aiImproving} className="gap-1 text-xs h-7 text-primary/70 hover:text-primary">
                  <Wand2 className="h-3 w-3" /> AI Titel
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleAiAction('improve_description')} disabled={aiImproving} className="gap-1 text-xs h-7 text-primary/70 hover:text-primary">
                  <FileText className="h-3 w-3" /> AI Beskrivelse
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleAiAction('generate_highlights')} disabled={aiImproving} className="gap-1 text-xs h-7 text-primary/70 hover:text-primary">
                  <Star className="h-3 w-3" /> AI Highlights
                </Button>
                <div className="w-px h-4 bg-border" />
                <Button variant="ghost" size="sm" onClick={() => handleAiAction('translate_en')} disabled={aiImproving} className="gap-1 text-xs h-7 text-muted-foreground">
                  <Languages className="h-3 w-3" /> EN
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleAiAction('translate_de')} disabled={aiImproving} className="gap-1 text-xs h-7 text-muted-foreground">
                  <Languages className="h-3 w-3" /> DE
                </Button>
              </div>

              <Section title="Kort beskrivelse" description="Vises i listing-kortet og søgeresultater">
                <Textarea value={listing.description || ''} onChange={e => update('description', e.target.value)} rows={3} placeholder="En kort, fængende beskrivelse..." />
              </Section>
              <Section title="Lang beskrivelse" description="Detaljeret beskrivelse til listingsiden">
                <Textarea value={listing.long_description || ''} onChange={e => update('long_description', e.target.value)} rows={6} placeholder="Beskriv boligen i detaljer..." />
              </Section>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Section title="Om boligen">
                  <Textarea value={listing.about_property || ''} onChange={e => update('about_property', e.target.value)} rows={4} placeholder="Boligen er bygget i..." />
                </Section>
                <Section title="Om området">
                  <Textarea value={listing.about_area || ''} onChange={e => update('about_area', e.target.value)} rows={4} placeholder="Området byder på..." />
                </Section>
              </div>
              <Section title="Highlights" description="Fremhævede features for denne bolig">
                <div className="flex flex-wrap gap-2 mb-3">
                  {(listing.highlights || []).map((h, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 text-xs">
                      <Star className="h-3 w-3 text-amber-500" /> {h}
                      <button onClick={() => update('highlights', (listing.highlights || []).filter((_, idx) => idx !== i))} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newHighlight} onChange={e => setNewHighlight(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newHighlight.trim()) { update('highlights', [...(listing.highlights || []), newHighlight.trim()]); setNewHighlight(''); } } }}
                    placeholder="F.eks. Havudsigt, Nyistandsat..." className="flex-1" />
                  <Button variant="outline" size="sm" onClick={() => { if (newHighlight.trim()) { update('highlights', [...(listing.highlights || []), newHighlight.trim()]); setNewHighlight(''); } }}><Plus className="h-4 w-4" /></Button>
                </div>
              </Section>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Section title="Husregler">
                  <Textarea value={listing.house_rules || ''} onChange={e => update('house_rules', e.target.value)} rows={4} placeholder="Ingen rygning, ingen fester..." />
                </Section>
                <Section title="Praktisk info">
                  <Textarea value={listing.practical_info || ''} onChange={e => update('practical_info', e.target.value)} rows={4} placeholder="WiFi-kode, parkering..." />
                </Section>
              </div>
            </div>
          )}

          {/* ── BILLEDER ── */}
          {subTab === 'billeder' && (
            <div className="space-y-6">
              <Section title="Hero-billede" description="Hovedbilledet der vises øverst">
                <Field label="Hero URL">
                  <Input value={listing.hero_image || ''} onChange={e => update('hero_image', e.target.value)} placeholder="https://..." />
                </Field>
                {listing.hero_image && (
                  <div className="w-full max-w-md rounded-xl overflow-hidden border border-border">
                    <img src={listing.hero_image} alt="Hero" className="w-full h-48 object-cover" />
                  </div>
                )}
              </Section>
              <Section title="Galleri" description="Tilføj, fjern og omsortér billeder">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(listing.images || []).map((img, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden border border-border bg-muted">
                      {img ? <img src={img} alt="" className="w-full h-32 object-cover" /> : (
                        <div className="w-full h-32 flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground/20" /></div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button variant="secondary" size="sm" className="h-7 text-[10px]" onClick={() => update('hero_image', img)}><Star className="h-3 w-3 mr-1" /> Hero</Button>
                        <Button variant="destructive" size="sm" className="h-7 text-[10px]" onClick={() => update('images', (listing.images || []).filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></Button>
                      </div>
                      <Input value={img} onChange={e => { const n = [...(listing.images || [])]; n[i] = e.target.value; update('images', n); }}
                        className="rounded-none border-0 border-t text-[11px] h-8" placeholder="Billede URL" />
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => update('images', [...(listing.images || []), ''])} className="gap-1.5 mt-2"><Plus className="h-3.5 w-3.5" /> Tilføj billede</Button>
              </Section>
            </div>
          )}

          {/* ── FACILITETER ── */}
          {subTab === 'faciliteter' && (
            <Section title="Faciliteter & Udstyr" description="Vælg fra listen eller tilføj egne">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {AMENITIES_PRESETS.map(a => {
                  const sel = (listing.amenities || []).includes(a);
                  return (
                    <button key={a} onClick={() => { if (sel) update('amenities', (listing.amenities || []).filter(x => x !== a)); else update('amenities', [...(listing.amenities || []), a]); }}
                      className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-all ${sel ? 'bg-primary/10 border-primary/30 text-primary font-medium' : 'bg-card border-border text-muted-foreground hover:border-primary/20'}`}>
                      <CheckCircle2 className={`h-3.5 w-3.5 inline mr-1.5 ${sel ? 'text-primary' : 'text-muted-foreground/30'}`} />{a}
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-xs text-muted-foreground mb-2">Egne faciliteter:</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(listing.amenities || []).filter(a => !AMENITIES_PRESETS.includes(a)).map(a => (
                    <Badge key={a} variant="secondary" className="gap-1 text-xs">{a}
                      <button onClick={() => update('amenities', (listing.amenities || []).filter(x => x !== a))} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 max-w-sm">
                  <Input value={newAmenity} onChange={e => setNewAmenity(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newAmenity.trim() && !(listing.amenities || []).includes(newAmenity.trim())) { update('amenities', [...(listing.amenities || []), newAmenity.trim()]); setNewAmenity(''); } } }}
                    placeholder="Tilføj egen facilitet..." />
                  <Button variant="outline" size="sm" onClick={() => { if (newAmenity.trim() && !(listing.amenities || []).includes(newAmenity.trim())) { update('amenities', [...(listing.amenities || []), newAmenity.trim()]); setNewAmenity(''); } }}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            </Section>
          )}

          {/* ── PRISER (sub) ── */}
          {subTab === 'priser_sub' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Section title="Grundpriser" description="Priser er i øre (100 = 1 DKK)">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Basispris pr. nat">
                      <Input type="number" min={0} step={100} value={listing.base_price_per_night} onChange={e => update('base_price_per_night', parseInt(e.target.value) || 0)} />
                    </Field>
                    <Field label="Weekend-pris pr. nat">
                      <Input type="number" min={0} step={100} value={listing.weekend_price_per_night || ''} onChange={e => update('weekend_price_per_night', parseInt(e.target.value) || null)} placeholder="Samme som basis" />
                    </Field>
                  </div>
                  <Field label="Rengøringsgebyr">
                    <Input type="number" min={0} step={100} value={listing.cleaning_fee || 0} onChange={e => update('cleaning_fee', parseInt(e.target.value) || 0)} />
                  </Field>
                  <Field label="Depositum">
                    <Input type="number" min={0} step={100} value={listing.deposit || 0} onChange={e => update('deposit', parseInt(e.target.value) || 0)} />
                  </Field>
                </Section>
                <Section title="Regler">
                  <Field label="Minimum nætter">
                    <Input type="number" min={1} value={listing.min_nights || 2} onChange={e => update('min_nights', parseInt(e.target.value) || 1)} />
                  </Field>
                  <Field label="m²">
                    <Input type="number" min={0} value={listing.sqm || ''} onChange={e => update('sqm', parseInt(e.target.value) || null)} placeholder="120" />
                  </Field>
                </Section>
              </div>
            </div>
          )}

          {/* ── KLARGØRING ── */}
          {subTab === 'klargoering' && (
            <div className="space-y-6">
              <Section title="Listing Readiness" description="Oversigt over hvad der mangler for at gå live">
                <div className="flex items-center gap-4 mb-4">
                  <ReadinessRing score={readiness.score} size={64} strokeWidth={4} />
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {readiness.score === 100 ? 'Alt er klar!' : readiness.score >= 80 ? 'Næsten klar!' : readiness.score >= 50 ? 'Godt på vej' : 'Mere data mangler'}
                    </h4>
                    <p className="text-sm text-muted-foreground">{readiness.passed.length} af {readiness.passed.length + readiness.missing.length} felter udfyldt</p>
                  </div>
                </div>
                {readiness.passed.length > 0 && (
                  <div className="space-y-1 mb-4">
                    <p className="text-xs font-semibold text-emerald-600">✓ Udfyldt</p>
                    {readiness.passed.map(p => (
                      <div key={p} className="flex items-center gap-2 text-xs text-muted-foreground py-0.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {p}</div>
                    ))}
                  </div>
                )}
                {readiness.missing.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-amber-600">⚠ Mangler</p>
                    {readiness.missing.map(m => (
                      <div key={m} className="flex items-center gap-2 text-xs text-amber-600 py-0.5"><AlertTriangle className="h-3.5 w-3.5" /> {m}</div>
                    ))}
                  </div>
                )}
                {readiness.score === 100 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-center gap-3 mt-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <p className="text-sm text-emerald-600 font-medium">Alle felter er udfyldt — listingen er klar til at gå live!</p>
                  </div>
                )}
              </Section>
              <Section title="Intern status">
                <Select value={listing.internal_status || 'draft'} onValueChange={v => update('internal_status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}><span className="flex items-center gap-1.5"><s.icon className={`h-3 w-3 ${s.color}`} />{s.label}</span></SelectItem>)}</SelectContent>
                </Select>
              </Section>
              <Section title="Systeminfo">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
                  <div><span className="font-medium text-foreground block">Slug</span>{listing.slug}</div>
                  <div><span className="font-medium text-foreground block">ID</span><code className="font-mono">{listing.id}</code></div>
                  <div><span className="font-medium text-foreground block">Owner ID</span><code className="font-mono">{listing.owner_id}</code></div>
                </div>
              </Section>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════ OVERBLIK TAB ═══════════════════════ */}
      {topTab === 'overblik' && (
        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <ReadinessRing score={readiness.score} size={56} strokeWidth={4} />
              <p className="text-xs font-semibold mt-2">Readiness</p>
            </div>
            {(['airbnb', 'booking', 'vrbo'] as const).map(ch => (
              <div key={ch} className="rounded-xl border border-border bg-card p-4 text-center">
                <ReadinessRing score={channelReadiness[ch].score} size={56} strokeWidth={4} />
                <p className="text-xs font-semibold mt-2">{ch === 'airbnb' ? '🏠 Airbnb' : ch === 'booking' ? '🅱️ Booking' : '🏡 Vrbo'}</p>
                <p className="text-[10px] text-muted-foreground">{channelReadiness[ch].missing.length} mangler</p>
              </div>
            ))}
          </div>
          <Section title="Hurtig status">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><span className="text-muted-foreground text-xs">Status</span><p className="font-medium flex items-center gap-1.5"><currentStatus.icon className={`h-3 w-3 ${currentStatus.color}`} />{currentStatus.label}</p></div>
              <div><span className="text-muted-foreground text-xs">Gæster</span><p className="font-medium">{listing.max_guests}</p></div>
              <div><span className="text-muted-foreground text-xs">Sov.</span><p className="font-medium">{listing.bedrooms || 0}</p></div>
              <div><span className="text-muted-foreground text-xs">Billeder</span><p className="font-medium">{listing.images?.length || 0}</p></div>
            </div>
          </Section>
        </div>
      )}

      {/* ═══════════════════════ KANALER TAB ═══════════════════════ */}
      {topTab === 'kanaler' && (
        <div className="space-y-6 mt-6">
          {/* Readiness Dashboard */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="font-display text-sm font-semibold text-foreground mb-4">Readiness overblik</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
                <ReadinessRing score={readiness.score} size={56} strokeWidth={4} />
                <p className="text-xs font-semibold text-foreground">Global</p>
              </div>
              {(['airbnb', 'booking', 'vrbo'] as const).map(ch => (
                <div key={ch} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
                  <ReadinessRing score={channelReadiness[ch].score} size={56} strokeWidth={4} />
                  <p className="text-xs font-semibold">{ch === 'airbnb' ? '🏠 Airbnb' : ch === 'booking' ? '🅱️ Booking' : '🏡 Vrbo'}</p>
                  <p className="text-[10px] text-muted-foreground">{channelReadiness[ch].missing.length} mangler</p>
                </div>
              ))}
            </div>
          </div>

          {/* Channel sections */}
          <ChannelDataSection channelName="Airbnb" channelKey="airbnb" emoji="🏠" listing={listing}
            onUpdate={(key, value) => update(key as any, value)} onAiFill={() => handlePrepareChannel('airbnb')} aiFilling={airbnbPreparing}
            readinessScore={channelReadiness.airbnb.score} readinessPassed={channelReadiness.airbnb.passed} readinessMissing={channelReadiness.airbnb.missing}
            fields={[
              { key: 'channel_airbnb_title', label: 'Airbnb-titel', type: 'text', maxLength: 50, hint: 'Clickbait-titel optimeret til Airbnb', masterSource: 'Navn / Tagline', getMasterValue: () => listing.tagline || listing.description || listing.name },
              { key: 'channel_airbnb_highlights', label: 'Airbnb-highlights', type: 'tags', hint: 'Top-oplevelser', masterSource: 'Highlights', getMasterValue: () => listing.highlights },
              { key: 'channel_airbnb_description', label: 'Airbnb-beskrivelse', type: 'textarea', rows: 5, hint: 'Detaljeret beskrivelse', masterSource: 'Lang beskrivelse', getMasterValue: () => [listing.long_description, listing.about_property, listing.about_area].filter(Boolean).join('\n\n') || listing.description },
              { key: 'channel_airbnb_house_rules', label: 'Airbnb-husregler', type: 'textarea', rows: 3, masterSource: 'Husregler', getMasterValue: () => listing.house_rules },
              { key: 'channel_airbnb_checkin_notes', label: 'Check-in noter', type: 'textarea', rows: 3, masterSource: 'Check-in info', getMasterValue: () => listing.checkin_info, platformSpecific: !listing.checkin_info },
            ]} />
          <ChannelDataSection channelName="Booking.com" channelKey="booking" emoji="🅱️" listing={listing}
            onUpdate={(key, value) => update(key as any, value)} onAiFill={() => handlePrepareChannel('booking')} aiFilling={channelPreparing}
            readinessScore={channelReadiness.booking.score} readinessPassed={channelReadiness.booking.passed} readinessMissing={channelReadiness.booking.missing}
            fields={[
              { key: 'channel_booking_title', label: 'Booking.com-titel', type: 'text', masterSource: 'Navn', getMasterValue: () => listing.name },
              { key: 'channel_booking_description', label: 'Booking.com-beskrivelse', type: 'textarea', rows: 5, masterSource: 'Lang beskrivelse', getMasterValue: () => [listing.long_description, listing.about_property].filter(Boolean).join('\n\n') || listing.description },
              { key: 'channel_booking_room_setup', label: 'Værelseopsætning', type: 'textarea', rows: 3, platformSpecific: true, getMasterValue: () => listing.bedrooms ? `${listing.bedrooms} soveværelse(r), ${listing.bathrooms || 1} badeværelse(r), max ${listing.max_guests} gæster` : null },
              { key: 'channel_booking_policies', label: 'Politikker', type: 'textarea', rows: 3, platformSpecific: true, getMasterValue: () => listing.deposit ? `Depositum: ${listing.deposit} DKK` : null },
              { key: 'channel_booking_checkin_checkout', label: 'Check-in / Check-out', type: 'textarea', rows: 3, masterSource: 'Check-in/out tider', getMasterValue: () => { const p: string[] = []; if (listing.check_in_time) p.push(`Check-in: fra kl. ${listing.check_in_time}`); if (listing.check_out_time) p.push(`Check-out: senest kl. ${listing.check_out_time}`); if (listing.checkin_info) p.push(listing.checkin_info); return p.length ? p.join('\n') : null; } },
            ]} />
          <ChannelDataSection channelName="Vrbo" channelKey="vrbo" emoji="🏡" listing={listing}
            onUpdate={(key, value) => update(key as any, value)} onAiFill={() => handlePrepareChannel('vrbo')} aiFilling={channelPreparing}
            readinessScore={channelReadiness.vrbo.score} readinessPassed={channelReadiness.vrbo.passed} readinessMissing={channelReadiness.vrbo.missing}
            fields={[
              { key: 'channel_vrbo_title', label: 'Vrbo-titel', type: 'text', masterSource: 'Navn / Tagline', getMasterValue: () => listing.tagline || listing.name },
              { key: 'channel_vrbo_highlights', label: 'Vrbo-highlights', type: 'tags', masterSource: 'Highlights', getMasterValue: () => listing.highlights },
              { key: 'channel_vrbo_description', label: 'Vrbo-beskrivelse', type: 'textarea', rows: 5, masterSource: 'Lang beskrivelse', getMasterValue: () => [listing.long_description, listing.about_area].filter(Boolean).join('\n\n') || listing.description },
              { key: 'channel_vrbo_rules', label: 'Vrbo-regler', type: 'textarea', rows: 3, masterSource: 'Husregler', getMasterValue: () => listing.house_rules },
            ]} />
        </div>
      )}

      {/* ═══════════════════════ INTEGRATIONER TAB ═══════════════════════ */}
      {topTab === 'integrationer' && (
        <div className="space-y-6 mt-6">
          {(() => {
            const syncStatus = listing.sync_status || 'not_connected';
            const cfg: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
              not_connected: { label: 'Ikke tilkoblet', color: 'text-muted-foreground', icon: <WifiOff className="h-4 w-4" />, bg: 'bg-muted' },
              ready: { label: 'Klar til integration', color: 'text-blue-600', icon: <Wifi className="h-4 w-4" />, bg: 'bg-blue-50 dark:bg-blue-950/30' },
              pending: { label: 'Venter på sync', color: 'text-amber-600', icon: <Clock className="h-4 w-4 animate-pulse" />, bg: 'bg-amber-50 dark:bg-amber-950/30' },
              synced: { label: 'Synkroniseret', color: 'text-emerald-600', icon: <CheckCircle2 className="h-4 w-4" />, bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
              error: { label: 'Fejl', color: 'text-destructive', icon: <AlertCircle className="h-4 w-4" />, bg: 'bg-destructive/10' },
            };
            const s = cfg[syncStatus] || cfg.not_connected;
            return (
              <>
                <div className={`rounded-xl border border-border p-5 flex items-center justify-between ${s.bg}`}>
                  <div className="flex items-center gap-3">
                    <div className={s.color}>{s.icon}</div>
                    <div>
                      <p className={`font-semibold text-sm ${s.color}`}>{s.label}</p>
                      {listing.last_sync_at && <p className="text-xs text-muted-foreground mt-0.5">Sidst synkroniseret: {new Date(listing.last_sync_at).toLocaleString('da-DK')}</p>}
                    </div>
                  </div>
                  <Select value={syncStatus} onValueChange={v => update('sync_status' as any, v)}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_connected">Ikke tilkoblet</SelectItem>
                      <SelectItem value="ready">Klar til integration</SelectItem>
                      <SelectItem value="pending">Venter på sync</SelectItem>
                      <SelectItem value="synced">Synkroniseret</SelectItem>
                      <SelectItem value="error">Fejl</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <Section title="Channel Manager" description="Tilslutning til ekstern partner">
                    <Field label="Channel Manager Partner">
                      <Select value={listing.channel_manager_partner || ''} onValueChange={v => update('channel_manager_partner' as any, v || null)}>
                        <SelectTrigger><SelectValue placeholder="Vælg partner..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ingen</SelectItem>
                          <SelectItem value="beds24">Beds24</SelectItem>
                          <SelectItem value="guesty">Guesty</SelectItem>
                          <SelectItem value="hostaway">Hostaway</SelectItem>
                          <SelectItem value="lodgify">Lodgify</SelectItem>
                          <SelectItem value="smoobu">Smoobu</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </Section>
                  <Section title="Ekstern ID-mapping" description="ID'er til synkronisering">
                    <Field label="Eksternt Listing-ID">
                      <Input value={listing.external_listing_id || ''} onChange={e => update('external_listing_id' as any, e.target.value || null)} placeholder="F.eks. 123456" />
                    </Field>
                    <Field label="Eksternt Property-ID">
                      <Input value={listing.external_property_id || ''} onChange={e => update('external_property_id' as any, e.target.value || null)} placeholder="F.eks. PROP-789" />
                    </Field>
                  </Section>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ═══════════════════════ KALENDER TAB ═══════════════════════ */}
      {topTab === 'kalender' && (
        <div className="mt-6">
          <ListingCalendarPricing listingId={listing.id} ownerId={listing.owner_id}
            basePricePerNight={listing.base_price_per_night} weekendPricePerNight={listing.weekend_price_per_night}
            minNights={listing.min_nights} cleaningFee={listing.cleaning_fee} checkInTime={listing.check_in_time} />
        </div>
      )}

      {/* ═══════════════════════ PRISER TAB (top-level) ═══════════════════════ */}
      {topTab === 'priser' && (
        <div className="space-y-6 mt-6">
          <Section title="Grundpriser">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Basispris pr. nat"><Input type="number" min={0} step={100} value={listing.base_price_per_night} onChange={e => update('base_price_per_night', parseInt(e.target.value) || 0)} /></Field>
              <Field label="Weekend-pris pr. nat"><Input type="number" min={0} step={100} value={listing.weekend_price_per_night || ''} onChange={e => update('weekend_price_per_night', parseInt(e.target.value) || null)} placeholder="Samme som basis" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Rengøringsgebyr"><Input type="number" min={0} step={100} value={listing.cleaning_fee || 0} onChange={e => update('cleaning_fee', parseInt(e.target.value) || 0)} /></Field>
              <Field label="Depositum"><Input type="number" min={0} step={100} value={listing.deposit || 0} onChange={e => update('deposit', parseInt(e.target.value) || 0)} /></Field>
            </div>
            <Field label="Minimum nætter"><Input type="number" min={1} value={listing.min_nights || 2} onChange={e => update('min_nights', parseInt(e.target.value) || 1)} className="max-w-[200px]" /></Field>
          </Section>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> Sæsonpriser og rabatter styres under kalenderfanen.</p>
          </div>
        </div>
      )}

      {/* ═══════════════════════ PLACEHOLDER TABS ═══════════════════════ */}
      {['tilkoeb', 'dokumenter', 'opgaver', 'noter'].includes(topTab) && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            {topTab === 'tilkoeb' && <ShoppingBag className="h-7 w-7" />}
            {topTab === 'dokumenter' && <FileText className="h-7 w-7" />}
            {topTab === 'opgaver' && <ClipboardCheck className="h-7 w-7" />}
            {topTab === 'noter' && <StickyNote className="h-7 w-7" />}
          </div>
          <p className="font-medium text-foreground">{TOP_TABS.find(t => t.value === topTab)?.label}</p>
          <p className="text-sm mt-1">Kommer snart for denne listing</p>
        </div>
      )}

      {/* ── AI DIALOG ── */}
      <Dialog open={aiDialogOpen} onOpenChange={v => { if (!aiImproving) setAiDialogOpen(v); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> AI-genereret indhold</DialogTitle>
          </DialogHeader>
          {aiImproving && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="text-sm">AI genererer indhold...</p>
            </div>
          )}
          {aiPreview && !aiImproving && (
            <div className="space-y-4">
              {aiPreview.suggestions && (
                <div><p className="text-xs font-semibold text-muted-foreground mb-2">Vælg en titel:</p>
                  <div className="space-y-2">{aiPreview.suggestions.map((s: string, i: number) => (
                    <button key={i} onClick={() => { update('description', s); toast({ title: 'Titel anvendt!' }); setAiDialogOpen(false); setAiPreview(null); }}
                      className="w-full text-left text-sm bg-muted/50 hover:bg-primary/5 hover:border-primary/30 border border-border rounded-lg p-3 text-foreground transition-colors">{s}</button>
                  ))}</div>
                </div>
              )}
              {aiPreview.title && !aiPreview.suggestions && <div><p className="text-xs font-semibold text-muted-foreground mb-1">Titel</p><p className="text-sm bg-muted/50 rounded-lg p-3">{aiPreview.title}</p></div>}
              {aiPreview.tagline && <div><p className="text-xs font-semibold text-muted-foreground mb-1">Tagline</p><p className="text-sm bg-muted/50 rounded-lg p-3">{aiPreview.tagline}</p></div>}
              {(aiPreview.long_description || aiPreview.description) && <div><p className="text-xs font-semibold text-muted-foreground mb-1">Beskrivelse</p><p className="text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-line">{aiPreview.long_description || aiPreview.description}</p></div>}
              {aiPreview.highlights?.length > 0 && <div><p className="text-xs font-semibold text-muted-foreground mb-1">Highlights</p><div className="flex flex-wrap gap-1.5">{aiPreview.highlights.map((h: string, i: number) => <Badge key={i} variant="secondary" className="text-xs gap-1"><Star className="h-3 w-3 text-amber-500" /> {h}</Badge>)}</div></div>}
              {aiPreview.house_rules && <div><p className="text-xs font-semibold text-muted-foreground mb-1">Husregler</p><p className="text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-line">{aiPreview.house_rules}</p></div>}
              {aiPreview.room_setup && <div><p className="text-xs font-semibold text-muted-foreground mb-1">Værelseopsætning</p><p className="text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-line">{aiPreview.room_setup}</p></div>}
              {aiPreview.policies && <div><p className="text-xs font-semibold text-muted-foreground mb-1">Politikker</p><p className="text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-line">{aiPreview.policies}</p></div>}
              {!aiPreview.suggestions && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={applyAiSuggestions} className="flex-1 gap-1.5"><Check className="h-4 w-4" /> Anvend forslag</Button>
                  <Button variant="outline" onClick={() => { setAiDialogOpen(false); setAiPreview(null); }}>Annuller</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Floating save bar ── */}
      {isDirty && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-6 py-3 rounded-full shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <span className="text-sm">Du har ændringer der ikke er gemt</span>
          <Button size="sm" variant="secondary" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Gem nu
          </Button>
        </div>
      )}
    </div>
  );
}
