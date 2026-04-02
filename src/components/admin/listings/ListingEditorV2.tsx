import { useState, useEffect, useMemo } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowLeft, Loader2, Save, X, Plus, Home, ImageIcon, Tag, DollarSign, CheckCircle2, Globe,
  Star, AlertTriangle, Info, ClipboardCheck, Rocket, Sparkles, Zap,
  CircleDot, Circle, Check, Calendar as CalendarIcon, Languages, Wand2, MessageSquare, FileText,
  Link2, RefreshCw, WifiOff, Wifi, Clock, AlertCircle
} from 'lucide-react';

// ── Types ──
interface ListingFull {
  id: string; slug: string; name: string; description: string | null;
  address: string | null; max_guests: number; bedrooms: number | null; bathrooms: number | null;
  base_price_per_night: number; cleaning_fee: number | null;
  check_in_time: string | null; check_out_time: string | null;
  is_active: boolean; amenities: string[] | null; house_rules: string | null;
  practical_info: string | null; images: string[] | null; hero_image: string | null;
  currency: string; region: string | null; owner_id: string; sort_order: number;
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

interface Props {
  listingId: string;
  onBack: () => void;
}

// ── Helpers ──
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
      <Label className="text-sm text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

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

// ── Readiness calc ──
function calcReadiness(f: Partial<ListingFull>): { score: number; missing: string[]; passed: string[] } {
  const checks: [string, boolean][] = [
    ['Navn', !!f.name],
    ['Beskrivelse', !!(f.description && f.description.length > 20)],
    ['Adresse', !!f.address],
    ['Region', !!f.region],
    ['Max gæster', (f.max_guests || 0) > 0],
    ['Soveværelser', (f.bedrooms || 0) > 0],
    ['Basispris', (f.base_price_per_night || 0) > 0],
    ['Rengøringsgebyr', (f.cleaning_fee || 0) > 0],
    ['Hero-billede', !!f.hero_image],
    ['Mindst 3 billeder', (f.images?.length || 0) >= 3],
    ['Faciliteter (3+)', (f.amenities?.length || 0) >= 3],
    ['Husregler', !!(f.house_rules && f.house_rules.length > 10)],
    ['Check-in tid', !!f.check_in_time],
    ['Check-out tid', !!f.check_out_time],
  ];
  const passed = checks.filter(([, ok]) => ok).map(([name]) => name);
  const missing = checks.filter(([, ok]) => !ok).map(([name]) => name);
  return { score: Math.round((passed.length / checks.length) * 100), missing, passed };
}

type ChannelReadinessResult = { score: number; missing: { field: string; tab: string; action: string }[]; passed: string[] };

function calcChannelReadiness(f: Partial<ListingFull>, channel: 'airbnb' | 'booking' | 'vrbo'): ChannelReadinessResult {
  const shared: [string, boolean, string, string][] = [
    ['Hero-billede', !!f.hero_image, 'indhold', 'Upload et hero-billede'],
    ['Min. 3 galleri-billeder', (f.images?.length || 0) >= 3, 'indhold', 'Tilføj flere billeder'],
    ['Adresse', !!f.address, 'grunddata', 'Udfyld adressen'],
    ['Gæstekapacitet', (f.max_guests || 0) > 0, 'grunddata', 'Angiv max gæster'],
    ['Soveværelser', (f.bedrooms || 0) > 0, 'grunddata', 'Angiv antal soveværelser'],
    ['Basispris', (f.base_price_per_night || 0) > 0, 'priser', 'Sæt en basispris'],
    ['Check-in tid', !!f.check_in_time, 'grunddata', 'Angiv check-in tid'],
    ['Check-out tid', !!f.check_out_time, 'grunddata', 'Angiv check-out tid'],
    ['Faciliteter (3+)', (f.amenities?.length || 0) >= 3, 'grunddata', 'Tilføj faciliteter'],
  ];

  const channelChecks: Record<string, [string, boolean, string, string][]> = {
    airbnb: [
      ['Airbnb-titel', !!(f.channel_airbnb_title && f.channel_airbnb_title.length >= 5), 'kanaler', 'Skriv en Airbnb-titel'],
      ['Airbnb-beskrivelse', !!(f.channel_airbnb_description && f.channel_airbnb_description.length >= 20), 'kanaler', 'Skriv en Airbnb-beskrivelse'],
      ['Airbnb-husregler', !!(f.channel_airbnb_house_rules && f.channel_airbnb_house_rules.length > 5), 'kanaler', 'Tilføj husregler til Airbnb'],
      ['Airbnb-highlights', (f.channel_airbnb_highlights?.length || 0) >= 2, 'kanaler', 'Tilføj mindst 2 highlights'],
      ['Airbnb check-in noter', !!(f.channel_airbnb_checkin_notes && f.channel_airbnb_checkin_notes.length > 5), 'kanaler', 'Beskriv check-in procedure'],
    ],
    booking: [
      ['Booking.com-titel', !!(f.channel_booking_title && f.channel_booking_title.length >= 5), 'kanaler', 'Skriv en Booking.com-titel'],
      ['Booking.com-beskrivelse', !!(f.channel_booking_description && f.channel_booking_description.length >= 20), 'kanaler', 'Skriv en beskrivelse'],
      ['Værelseopsætning', !!(f.channel_booking_room_setup && f.channel_booking_room_setup.length > 3), 'kanaler', 'Beskriv værelserne'],
      ['Politikker', !!(f.channel_booking_policies && f.channel_booking_policies.length > 5), 'kanaler', 'Tilføj aflysningspolitik'],
      ['Check-in/out info', !!(f.channel_booking_checkin_checkout && f.channel_booking_checkin_checkout.length > 5), 'kanaler', 'Udfyld check-in/out info'],
    ],
    vrbo: [
      ['Vrbo-titel', !!(f.channel_vrbo_title && f.channel_vrbo_title.length >= 5), 'kanaler', 'Skriv en Vrbo-titel'],
      ['Vrbo-beskrivelse', !!(f.channel_vrbo_description && f.channel_vrbo_description.length >= 20), 'kanaler', 'Skriv en Vrbo-beskrivelse'],
      ['Vrbo-highlights', (f.channel_vrbo_highlights?.length || 0) >= 2, 'kanaler', 'Tilføj mindst 2 highlights'],
      ['Vrbo-regler', !!(f.channel_vrbo_rules && f.channel_vrbo_rules.length > 5), 'kanaler', 'Tilføj husregler til Vrbo'],
    ],
  };

  const all = [...shared, ...channelChecks[channel]];
  const passed = all.filter(([, ok]) => ok).map(([name]) => name);
  const missing = all.filter(([, ok]) => !ok).map(([name, , tab, action]) => ({ field: name, tab, action }));
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

export function ListingEditorV2({ listingId, onBack }: Props) {
  const { toast } = useToast();
  const [listing, setListing] = useState<ListingFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [newAmenity, setNewAmenity] = useState('');
  const [newHighlight, setNewHighlight] = useState('');
  const [activeTab, setActiveTab] = useState('grunddata');

  // Action states
  const [checkDialogOpen, setCheckDialogOpen] = useState(false);
  const [prepareDialogOpen, setPrepareDialogOpen] = useState(false);
  const [aiImproving, setAiImproving] = useState(false);
  const [aiAction, setAiAction] = useState<string | null>(null);
  const [aiPreview, setAiPreview] = useState<any>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [channelDialogOpen, setChannelDialogOpen] = useState<string | null>(null);
  const [channelPreparing, setChannelPreparing] = useState(false);
  const [airbnbPreparing, setAirbnbPreparing] = useState(false);
  const [airbnbAiUsed, setAirbnbAiUsed] = useState(false);

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
    return {
      airbnb: calcChannelReadiness(listing, 'airbnb'),
      booking: calcChannelReadiness(listing, 'booking'),
      vrbo: calcChannelReadiness(listing, 'vrbo'),
    };
  }, [listing]);

  const handleSave = async () => {
    if (!listing) return;
    setSaving(true);
    const score = calcReadiness(listing).score;

    const { error } = await supabase.from('listings').update({
      name: listing.name, description: listing.description, address: listing.address,
      region: listing.region, max_guests: listing.max_guests, bedrooms: listing.bedrooms,
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
    if (error) {
      toast({ title: 'Fejl ved gem', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Gemt!', description: `${listing.name} er opdateret.` });
      setIsDirty(false);
    }
  };

  // ── Action: Tjek listing ──
  const handleCheck = () => {
    setCheckDialogOpen(true);
  };

  // ── Action: Klargør listing ──
  const handlePrepare = async () => {
    if (!listing) return;
    const r = calcReadiness(listing);
    let newStatus = listing.internal_status || 'draft';

    if (r.score === 100) {
      newStatus = 'ready';
    } else if (r.score >= 50) {
      newStatus = 'preparing';
    } else {
      newStatus = 'draft';
    }

    update('internal_status', newStatus);
    update('readiness_score' as any, r.score);
    setPrepareDialogOpen(true);
  };

  // ── Action: AI content tool ──
  const handleAiAction = async (action: string) => {
    if (!listing) return;
    setAiImproving(true);
    setAiAction(action);
    setAiDialogOpen(true);
    setAiPreview(null);
    try {
      const { data, error } = await supabase.functions.invoke('improve-listing-text', {
        body: { listing, action },
      });
      if (error) throw error;
      if (data?.improved) {
        setAiPreview({ ...data.improved, _action: action });
      } else if (data?.error) {
        toast({ title: 'AI-fejl', description: data.error, variant: 'destructive' });
        setAiDialogOpen(false);
      }
    } catch (e: any) {
      toast({ title: 'Fejl', description: e.message || 'Kunne ikke generere indhold', variant: 'destructive' });
      setAiDialogOpen(false);
    } finally {
      setAiImproving(false);
    }
  };

  // legacy wrapper
  const handleAiImprove = () => handleAiAction('improve_all');

  const applyAiSuggestions = () => {
    if (!aiPreview || !listing) return;
    const action = aiPreview._action || 'improve_all';

    if (action === 'improve_title' && aiPreview.suggestions?.length) {
      update('description', aiPreview.suggestions[0]);
    } else if (action === 'improve_description' && aiPreview.description) {
      update('description', aiPreview.description);
    } else if (action === 'improve_long_description' && aiPreview.long_description) {
      update('long_description', aiPreview.long_description);
    } else if (action === 'generate_highlights' && aiPreview.highlights?.length) {
      update('highlights', aiPreview.highlights);
    } else if (action === 'channel_airbnb') {
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
    } else if (action === 'translate_en' || action === 'translate_de') {
      // Store in a toast for now — translations are read-only previews
      toast({ title: `Oversættelse genereret (${action === 'translate_en' ? 'EN' : 'DE'})`, description: 'Kopiér tekst fra preview-dialogen.' });
      return;
    } else {
      // improve_all fallback
      if (aiPreview.title) update('description', aiPreview.title);
      if (aiPreview.tagline) update('tagline', aiPreview.tagline);
      if (aiPreview.description && !aiPreview.long_description) update('long_description', aiPreview.description);
      if (aiPreview.long_description) update('long_description', aiPreview.long_description);
      if (aiPreview.highlights?.length) update('highlights', aiPreview.highlights);
    }

    toast({ title: 'AI-indhold anvendt!', description: 'Husk at gemme ændringerne.' });
    setAiDialogOpen(false);
    setAiPreview(null);
  };

  // ── Action: Forbered kanal ──
  const handlePrepareChannel = async (channel: 'airbnb' | 'booking' | 'vrbo') => {
    if (!listing) return;

    if (channel === 'airbnb') {
      setAirbnbPreparing(true);
      setActiveTab('kanaler');

      try {
        // Use AI to generate Airbnb-optimized content
        const { data, error } = await supabase.functions.invoke('improve-listing-text', {
          body: {
            listing,
            channel: 'airbnb',
            prompt: 'Optimize this listing for Airbnb. Create a compelling Airbnb title (max 50 chars), and a detailed Airbnb description that highlights the unique experience. Write in Danish. Be warm, inviting and conversion-focused.',
          },
        });

        if (!error && data?.improved) {
          const title = data.improved.title || data.improved.tagline || listing.description || listing.name;
          const desc = data.improved.long_description || data.improved.description ||
            [listing.long_description, listing.about_property, listing.about_area].filter(Boolean).join('\n\n') || listing.description || '';

          update('channel_airbnb_title', title);
          update('channel_airbnb_description', desc);
          setAirbnbAiUsed(true);
        } else {
          // Fallback: map without AI
          if (!listing.channel_airbnb_title) update('channel_airbnb_title', listing.description || listing.name);
          if (!listing.channel_airbnb_description) {
            const desc = [listing.long_description, listing.about_property, listing.about_area].filter(Boolean).join('\n\n') || listing.description || '';
            update('channel_airbnb_description', desc);
          }
        }

        if (readiness.score >= 70) update('channel_airbnb_ready', true);
        toast({ title: 'Airbnb-indhold forberedt!', description: 'Tjek preview under Kanaler-fanen.' });
      } catch {
        // Fallback mapping
        if (!listing.channel_airbnb_title) update('channel_airbnb_title', listing.description || listing.name);
        if (!listing.channel_airbnb_description) {
          const desc = [listing.long_description, listing.about_property, listing.about_area].filter(Boolean).join('\n\n') || listing.description || '';
          update('channel_airbnb_description', desc);
        }
        if (readiness.score >= 70) update('channel_airbnb_ready', true);
      } finally {
        setAirbnbPreparing(false);
      }
      return;
    }

    // Other channels: simple mapping
    setChannelDialogOpen(channel);
    setChannelPreparing(true);

    const titleKey = `channel_${channel}_title` as keyof ListingFull;
    const descKey = `channel_${channel}_description` as keyof ListingFull;
    const readyKey = `channel_${channel}_ready` as keyof ListingFull;

    if (!listing[titleKey]) update(titleKey as any, listing.description || listing.name);
    if (!listing[descKey]) {
      const desc = [listing.long_description, listing.about_property, listing.about_area].filter(Boolean).join('\n\n') || listing.description || '';
      update(descKey as any, desc);
    }
    if (readiness.score >= 70 && !listing[readyKey]) update(readyKey as any, true);

    setChannelPreparing(false);
  };

  if (loading || !listing) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Henter listing...
      </div>
    );
  }

  const currentStatus = STATUS_OPTIONS.find(s => s.value === (listing.internal_status || 'draft')) || STATUS_OPTIONS[0];

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl font-bold text-foreground truncate">{listing.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">{listing.slug}</span>
            <span className="text-muted-foreground/30">·</span>
            <div className="flex items-center gap-1">
              <div className={`w-5 h-1.5 rounded-full ${readiness.score >= 80 ? 'bg-emerald-500' : readiness.score >= 50 ? 'bg-amber-400' : 'bg-destructive'}`} style={{ width: `${Math.max(readiness.score * 0.4, 6)}px` }} />
              <span className="text-xs font-medium text-muted-foreground">{readiness.score}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={listing.internal_status || 'draft'} onValueChange={v => update('internal_status', v)}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(s => (
                <SelectItem key={s.value} value={s.value}>
                  <span className="flex items-center gap-1.5">
                    <s.icon className={`h-3 w-3 ${s.color}`} />
                    {s.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleSave} disabled={saving || !isDirty} className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Gem
          </Button>
        </div>
      </div>

      {/* ── COMPACT AI TOOLBAR ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={handleCheck} className="gap-1.5 text-xs h-7 text-muted-foreground hover:text-foreground">
          <ClipboardCheck className="h-3 w-3" /> Tjek listing
        </Button>
        <Button variant="ghost" size="sm" onClick={handlePrepare} className="gap-1.5 text-xs h-7 text-muted-foreground hover:text-foreground">
          <Rocket className="h-3 w-3" /> Klargør
        </Button>
        <div className="w-px h-4 bg-border" />
        <Button variant="ghost" size="sm" onClick={() => handleAiAction('improve_title')} disabled={aiImproving} className="gap-1 text-xs h-7 text-primary/70 hover:text-primary">
          <Wand2 className="h-3 w-3" /> Titel
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleAiAction('improve_description')} disabled={aiImproving} className="gap-1 text-xs h-7 text-primary/70 hover:text-primary">
          <FileText className="h-3 w-3" /> Beskrivelse
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleAiAction('generate_highlights')} disabled={aiImproving} className="gap-1 text-xs h-7 text-primary/70 hover:text-primary">
          <Star className="h-3 w-3" /> Highlights
        </Button>
        <div className="w-px h-4 bg-border" />
        <Button variant="ghost" size="sm" onClick={() => handleAiAction('translate_en')} disabled={aiImproving} className="gap-1 text-xs h-7 text-muted-foreground">
          <Languages className="h-3 w-3" /> EN
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleAiAction('translate_de')} disabled={aiImproving} className="gap-1 text-xs h-7 text-muted-foreground">
          <Languages className="h-3 w-3" /> DE
        </Button>
        <span className="ml-auto text-[10px] text-muted-foreground/50">Auto-gem</span>
      </div>

      {/* ── TJEK LISTING DIALOG ── */}
      <Dialog open={checkDialogOpen} onOpenChange={setCheckDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" /> Listing-tjek
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                    stroke={readiness.score >= 80 ? 'hsl(142, 71%, 45%)' : readiness.score >= 50 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 84%, 60%)'}
                    strokeWidth="3" strokeDasharray={`${readiness.score}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-foreground">{readiness.score}%</div>
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {readiness.score === 100 ? 'Alt ser godt ud!' : readiness.score >= 80 ? 'Næsten klar!' : readiness.score >= 50 ? 'Godt på vej' : 'Flere felter mangler'}
                </p>
                <p className="text-xs text-muted-foreground">{readiness.passed.length} af {readiness.passed.length + readiness.missing.length} felter udfyldt</p>
              </div>
            </div>

            {readiness.passed.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-emerald-600">✓ Udfyldt</p>
                {readiness.passed.map(p => (
                  <div key={p} className="flex items-center gap-2 text-xs text-muted-foreground py-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {p}
                  </div>
                ))}
              </div>
            )}

            {readiness.missing.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-amber-600">⚠ Mangler</p>
                {readiness.missing.map(m => (
                  <div key={m} className="flex items-center gap-2 text-xs text-amber-600 py-0.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> {m}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── KLARGØR DIALOG ── */}
      <Dialog open={prepareDialogOpen} onOpenChange={setPrepareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" /> Klargøringsstatus
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-foreground mb-1">{readiness.score}%</div>
              <p className="text-sm text-muted-foreground">Readiness score</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Status opdateret til:</p>
              <div className="flex items-center gap-2">
                <currentStatus.icon className={`h-4 w-4 ${currentStatus.color}`} />
                <span className="font-semibold text-foreground">{currentStatus.label}</span>
              </div>
            </div>

            {readiness.score < 100 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
                  {readiness.missing.length} felter mangler endnu. Udfyld dem for at nå 100%.
                </p>
              </div>
            )}

            {readiness.score === 100 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-xs text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5 inline mr-1" />
                  Alle felter er udfyldt — listingen er klar til at gå live!
                </p>
              </div>
            )}

            <Button className="w-full" onClick={() => { setPrepareDialogOpen(false); setIsDirty(true); }}>
              OK, gem ændringerne
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── AI TEKST DIALOG ── */}
      <Dialog open={aiDialogOpen} onOpenChange={v => { if (!aiImproving) setAiDialogOpen(v); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {aiAction === 'improve_title' ? 'AI – Titelforslag' :
               aiAction === 'improve_description' ? 'AI – Beskrivelse' :
               aiAction === 'improve_long_description' ? 'AI – Lang beskrivelse' :
               aiAction === 'generate_highlights' ? 'AI – Highlights' :
               aiAction === 'channel_airbnb' ? 'AI – Airbnb-indhold' :
               aiAction === 'channel_booking' ? 'AI – Booking.com-indhold' :
               aiAction === 'channel_vrbo' ? 'AI – Vrbo-indhold' :
               aiAction === 'translate_en' ? 'AI – Engelsk oversættelse' :
               aiAction === 'translate_de' ? 'AI – Tysk oversættelse' :
               'AI-forbedret tekst'}
            </DialogTitle>
          </DialogHeader>
          {aiImproving && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm">AI genererer indhold...</p>
              <p className="text-[11px] text-muted-foreground/60">Dette tager typisk 5-15 sekunder</p>
            </div>
          )}
          {aiPreview && !aiImproving && (
            <div className="space-y-4">
              {/* Title suggestions */}
              {aiPreview.suggestions && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Vælg en titel:</p>
                  <div className="space-y-2">
                    {aiPreview.suggestions.map((s: string, i: number) => (
                      <button key={i} onClick={() => { update('description', s); toast({ title: 'Titel anvendt!' }); setAiDialogOpen(false); setAiPreview(null); }}
                        className="w-full text-left text-sm bg-muted/50 hover:bg-primary/5 hover:border-primary/30 border border-border rounded-lg p-3 text-foreground transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Single fields */}
              {aiPreview.title && !aiPreview.suggestions && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Titel</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3 text-foreground">{aiPreview.title}</p>
                </div>
              )}
              {aiPreview.tagline && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Tagline</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3 text-foreground">{aiPreview.tagline}</p>
                </div>
              )}
              {(aiPreview.long_description || aiPreview.description) && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Beskrivelse</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3 text-foreground whitespace-pre-line">{aiPreview.long_description || aiPreview.description}</p>
                </div>
              )}
              {aiPreview.highlights?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Highlights</p>
                  <div className="flex flex-wrap gap-1.5">
                    {aiPreview.highlights.map((h: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs gap-1">
                        <Star className="h-3 w-3 text-amber-500" /> {h}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Channel-specific fields */}
              {aiPreview.house_rules && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Husregler</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3 text-foreground whitespace-pre-line">{aiPreview.house_rules}</p>
                </div>
              )}
              {aiPreview.checkin_notes && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Check-in noter</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3 text-foreground whitespace-pre-line">{aiPreview.checkin_notes}</p>
                </div>
              )}
              {aiPreview.room_setup && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Værelseopsætning</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3 text-foreground whitespace-pre-line">{aiPreview.room_setup}</p>
                </div>
              )}
              {aiPreview.policies && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Politikker</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3 text-foreground whitespace-pre-line">{aiPreview.policies}</p>
                </div>
              )}
              {aiPreview.checkin_checkout && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Check-in/out info</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3 text-foreground whitespace-pre-line">{aiPreview.checkin_checkout}</p>
                </div>
              )}
              {aiPreview.rules && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Regler</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3 text-foreground whitespace-pre-line">{aiPreview.rules}</p>
                </div>
              )}

              {!aiPreview.suggestions && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={applyAiSuggestions} className="flex-1 gap-1.5">
                    <Check className="h-4 w-4" /> Anvend forslag
                  </Button>
                  <Button variant="outline" onClick={() => { setAiDialogOpen(false); setAiPreview(null); }}>
                    Annuller
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── KANAL DIALOG ── */}
      <Dialog open={!!channelDialogOpen} onOpenChange={() => setChannelDialogOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Forbered {channelDialogOpen === 'airbnb' ? 'Airbnb' : channelDialogOpen === 'booking' ? 'Booking.com' : 'Vrbo'}
            </DialogTitle>
          </DialogHeader>
          {channelPreparing ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Forbereder kanalindhold...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-sm text-emerald-700 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Kanalindhold er forberedt
                </p>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Titel kopieret fra listing
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Beskrivelse sammensat
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Faciliteter klar til mapping
                </div>
                {readiness.score >= 70 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Markeret som klar
                  </div>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  Du kan redigere den kanalspecifikke tekst under "Kanaler"-fanen.
                </p>
              </div>

              <Button className="w-full" onClick={() => { setChannelDialogOpen(null); setActiveTab('kanaler'); setIsDirty(true); }}>
                Gå til Kanaler-fanen
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tabs — 3 clean sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none p-0 h-auto gap-0">
          {[
            { value: 'bolig', label: 'Bolig', icon: Home },
            { value: 'priser', label: 'Priser & Kalender', icon: DollarSign },
            { value: 'kanaler', label: 'Distribution', icon: Globe },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="gap-2 text-sm font-medium px-5 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground"
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ─── TAB 1: BOLIG ─── */}
        <TabsContent value="bolig" className="mt-6 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Section title="Navne & Titler" description="Intern og offentlig titel">
              <Field label="Internt navn" hint="Bruges kun i admin">
                <Input value={listing.name} onChange={e => update('name', e.target.value)} />
              </Field>
              <Field label="Offentlig titel" hint="Vises på hjemmesiden">
                <Input value={listing.description || ''} onChange={e => update('description', e.target.value)} placeholder="Luksus sommerhus ved fjorden" />
              </Field>
              <Field label="Kort tagline" hint="1 linje, salgstekst">
                <Input value={listing.tagline || ''} onChange={e => update('tagline', e.target.value)} placeholder="Dit paradis ved Vestkysten" />
              </Field>
            </Section>

            <Section title="Lokation">
              <Field label="Adresse">
                <Input value={listing.address || ''} onChange={e => update('address', e.target.value)} placeholder="Søvej 28, 6823 Ansager" />
              </Field>
              <Field label="Område / Region">
                <Input value={listing.region || ''} onChange={e => update('region', e.target.value)} placeholder="Vestjylland" />
              </Field>
              <Field label="Boligtype">
                <Select value={listing.property_type || 'summerhouse'} onValueChange={v => update('property_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </Section>
          </div>

          <Section title="Kapacitet & Størrelse">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Max gæster">
                <Input type="number" min={1} value={listing.max_guests} onChange={e => update('max_guests', parseInt(e.target.value) || 1)} />
              </Field>
              <Field label="Soveværelser">
                <Input type="number" min={0} value={listing.bedrooms || 0} onChange={e => update('bedrooms', parseInt(e.target.value) || 0)} />
              </Field>
              <Field label="Badeværelser">
                <Input type="number" min={0} value={listing.bathrooms || 0} onChange={e => update('bathrooms', parseInt(e.target.value) || 0)} />
              </Field>
              <Field label="m²">
                <Input type="number" min={0} value={listing.sqm || ''} onChange={e => update('sqm', parseInt(e.target.value) || null)} placeholder="120" />
              </Field>
            </div>
          </Section>

          {/* ── Beskrivelse ── */}
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
                  <button onClick={() => update('highlights', (listing.highlights || []).filter((_, idx) => idx !== i))} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newHighlight} onChange={e => setNewHighlight(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newHighlight.trim()) { update('highlights', [...(listing.highlights || []), newHighlight.trim()]); setNewHighlight(''); } } }}
                placeholder="F.eks. Havudsigt, Nyistandsat..." className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => { if (newHighlight.trim()) { update('highlights', [...(listing.highlights || []), newHighlight.trim()]); setNewHighlight(''); } }}>
                <Plus className="h-4 w-4" />
              </Button>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Section title="Check-in info">
              <Field label="Check-in tid">
                <Input type="time" value={listing.check_in_time || '15:00'} onChange={e => update('check_in_time', e.target.value)} />
              </Field>
              <Textarea value={listing.checkin_info || ''} onChange={e => update('checkin_info', e.target.value)} rows={3} placeholder="Instruktioner til check-in..." />
            </Section>
            <Section title="Check-out info">
              <Field label="Check-out tid">
                <Input type="time" value={listing.check_out_time || '10:00'} onChange={e => update('check_out_time', e.target.value)} />
              </Field>
              <Textarea value={listing.checkout_info || ''} onChange={e => update('checkout_info', e.target.value)} rows={3} placeholder="Instruktioner til check-out..." />
            </Section>
          </div>

          {/* ── Billeder ── */}
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
                  {img ? (
                    <img src={img} alt={`Billede ${i + 1}`} className="w-full h-32 object-cover" />
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="secondary" size="sm" className="h-7 text-[10px]" onClick={() => update('hero_image', img)}>
                      <Star className="h-3 w-3 mr-1" /> Hero
                    </Button>
                    <Button variant="destructive" size="sm" className="h-7 text-[10px]" onClick={() => update('images', (listing.images || []).filter((_, idx) => idx !== i))}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    value={img}
                    onChange={e => {
                      const newImages = [...(listing.images || [])];
                      newImages[i] = e.target.value;
                      update('images', newImages);
                    }}
                    className="rounded-none border-0 border-t text-[11px] h-8"
                    placeholder="Billede URL"
                  />
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => update('images', [...(listing.images || []), ''])} className="gap-1.5 mt-2">
              <Plus className="h-3.5 w-3.5" /> Tilføj billede
            </Button>
          </Section>

          {/* ── Faciliteter ── */}
          <Section title="Faciliteter & Udstyr" description="Vælg fra listen eller tilføj egne">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {AMENITIES_PRESETS.map(a => {
                const isSelected = (listing.amenities || []).includes(a);
                return (
                  <button
                    key={a}
                    onClick={() => {
                      if (isSelected) update('amenities', (listing.amenities || []).filter(x => x !== a));
                      else update('amenities', [...(listing.amenities || []), a]);
                    }}
                    className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-all ${
                      isSelected ? 'bg-primary/10 border-primary/30 text-primary font-medium' : 'bg-card border-border text-muted-foreground hover:border-primary/20'
                    }`}
                  >
                    <CheckCircle2 className={`h-3.5 w-3.5 inline mr-1.5 ${isSelected ? 'text-primary' : 'text-muted-foreground/30'}`} />
                    {a}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-border pt-4 mt-4">
              <p className="text-xs text-muted-foreground mb-2">Egne faciliteter:</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {(listing.amenities || []).filter(a => !AMENITIES_PRESETS.includes(a)).map(a => (
                  <Badge key={a} variant="secondary" className="gap-1 text-xs">
                    {a}
                    <button onClick={() => update('amenities', (listing.amenities || []).filter(x => x !== a))} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 max-w-sm">
                <Input value={newAmenity} onChange={e => setNewAmenity(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newAmenity.trim() && !(listing.amenities || []).includes(newAmenity.trim())) { update('amenities', [...(listing.amenities || []), newAmenity.trim()]); setNewAmenity(''); } } }}
                  placeholder="Tilføj egen facilitet..." />
                <Button variant="outline" size="sm" onClick={() => { if (newAmenity.trim() && !(listing.amenities || []).includes(newAmenity.trim())) { update('amenities', [...(listing.amenities || []), newAmenity.trim()]); setNewAmenity(''); } }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Section>
        </TabsContent>

        {/* ─── TAB 2: PRISER & KALENDER ─── */}
        <TabsContent value="priser" className="mt-6 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Section title="Grundpriser (øre)" description="Priser er i øre (100 = 1 DKK)">
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
              <div className="flex items-center gap-3 pt-2">
                <Switch checked={listing.is_active} onCheckedChange={v => update('is_active', v)} />
                <Label className="text-sm">Listing er aktiv (synlig på hjemmesiden)</Label>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 mt-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  Sæsonpriser og rabatter styres under "Priser & Sæsoner" i menuen.
                </p>
              </div>
            </Section>
          </div>

          {/* ── Kalender ── */}
          <ListingCalendarPricing
            listingId={listing.id}
            ownerId={listing.owner_id}
            basePricePerNight={listing.base_price_per_night}
            weekendPricePerNight={listing.weekend_price_per_night}
            minNights={listing.min_nights}
            cleaningFee={listing.cleaning_fee}
            checkInTime={listing.check_in_time}
          />
        </TabsContent>

        <TabsContent value="readiness" className="mt-4 space-y-5">
          <Section title="Listing Readiness" description="Oversigt over hvad der mangler for at gå live">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                    stroke={readiness.score >= 80 ? 'hsl(var(--primary))' : readiness.score >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="3" strokeDasharray={`${readiness.score}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">{readiness.score}%</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">
                  {readiness.score >= 80 ? 'Næsten klar!' : readiness.score >= 50 ? 'Godt på vej' : 'Meget mangler endnu'}
                </h4>
                <p className="text-sm text-muted-foreground">{readiness.missing.length} manglende felter</p>
              </div>
            </div>

            {readiness.missing.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Manglende felter:</p>
                {readiness.missing.map(m => (
                  <div key={m} className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" /> {m}
                  </div>
                ))}
              </div>
            )}

            {readiness.score === 100 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="text-sm text-emerald-700 font-medium">Alle felter er udfyldt — listingen er klar til at gå live!</p>
              </div>
            )}
          </Section>

          <Section title="Intern status">
            <Select value={listing.internal_status || 'draft'} onValueChange={v => update('internal_status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>
                    <span className="flex items-center gap-1.5">
                      <s.icon className={`h-3 w-3 ${s.color}`} />
                      {s.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          <Section title="Systeminfo">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
              <div><span className="font-medium text-foreground block">Slug</span>{listing.slug}</div>
              <div><span className="font-medium text-foreground block">ID</span><code className="font-mono">{listing.id}</code></div>
              <div><span className="font-medium text-foreground block">Owner ID</span><code className="font-mono">{listing.owner_id}</code></div>
            </div>
          </Section>
        </TabsContent>

        {/* ─── 7. DISTRIBUTION & KANALER ─── */}
        <TabsContent value="kanaler" className="mt-4 space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">Distribution & kanaler</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Klargør og publicer din listing til eksterne platforme</p>
          </div>

          {/* ── Readiness Dashboard ── */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="font-display text-sm font-semibold text-foreground mb-4">Readiness overblik</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Global */}
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
                <ReadinessRing score={readiness.score} size={56} strokeWidth={4} />
                <div className="text-center">
                  <p className="text-xs font-semibold text-foreground">Global</p>
                  <p className="text-[10px] text-muted-foreground">{readiness.missing.length} mangler</p>
                </div>
              </div>
              {/* Per-channel */}
              {([
                { key: 'airbnb' as const, label: 'Airbnb', icon: '🏠' },
                { key: 'booking' as const, label: 'Booking.com', icon: '🅱️' },
                { key: 'vrbo' as const, label: 'Vrbo', icon: '🏡' },
              ] as const).map(ch => {
                const cr = channelReadiness[ch.key];
                return (
                  <div key={ch.key} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setChannelDialogOpen(ch.key)}>
                    <ReadinessRing score={cr.score} size={56} strokeWidth={4} />
                    <div className="text-center">
                      <p className="text-xs font-semibold text-foreground">{ch.icon} {ch.label}</p>
                      <p className="text-[10px] text-muted-foreground">{cr.missing.length} mangler</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Next best action */}
            {(() => {
              const allChannelMissing = [
                ...channelReadiness.airbnb.missing.map(m => ({ ...m, channel: 'Airbnb' })),
                ...channelReadiness.booking.missing.map(m => ({ ...m, channel: 'Booking.com' })),
                ...channelReadiness.vrbo.missing.map(m => ({ ...m, channel: 'Vrbo' })),
              ];
              const next = allChannelMissing[0];
              if (!next) return (
                <div className="mt-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <p className="text-xs text-emerald-600 font-medium">Alle kanaler er 100% klar! 🎉</p>
                </div>
              );
              return (
                <div className="mt-4 rounded-lg bg-primary/5 border border-primary/20 p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">Næste handling</p>
                      <p className="text-[11px] text-muted-foreground truncate">{next.action} — {next.channel}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="text-[10px] h-7 shrink-0" onClick={() => setActiveTab(next.tab)}>
                    Gå til {next.tab}
                  </Button>
                </div>
              );
            })()}
          </div>

          {/* Channel cards grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {([
              { key: 'airbnb' as const, label: 'Airbnb', accent: 'rose', icon: '🏠' },
              { key: 'booking' as const, label: 'Booking.com', accent: 'blue', icon: '🅱️' },
              { key: 'vrbo' as const, label: 'Vrbo', accent: 'indigo', icon: '🏡' },
            ]).map(ch => {
              const title = (listing as any)[`channel_${ch.key}_title`] as string | null;
              const desc = (listing as any)[`channel_${ch.key}_description`] as string | null;
              const ready = (listing as any)[`channel_${ch.key}_ready`] as boolean | null;

              // Per-channel missing fields
              const channelMissing: string[] = [];
              if (!title || title.length < 5) channelMissing.push('Kanaltitel');
              if (!desc || desc.length < 20) channelMissing.push('Kanalbeskrivelse');
              if (!listing.hero_image) channelMissing.push('Hero-billede');
              if ((listing.images?.length || 0) < 3) channelMissing.push('Min. 3 billeder');
              if ((listing.amenities?.length || 0) < 3) channelMissing.push('Min. 3 faciliteter');
              if (!listing.address) channelMissing.push('Adresse');
              if ((listing.max_guests || 0) < 1) channelMissing.push('Gæstekapacitet');
              if ((listing.base_price_per_night || 0) <= 0) channelMissing.push('Pris');

              const channelStatus = ready
                ? 'klar'
                : channelMissing.length === 0
                  ? 'klar'
                  : (title || desc)
                    ? 'mangler_data'
                    : 'ikke_startet';

              const statusConfig = {
                ikke_startet: { label: 'Ikke startet', dotClass: 'bg-muted-foreground', badgeClass: 'bg-muted text-muted-foreground' },
                mangler_data: { label: 'Mangler data', dotClass: 'bg-amber-400', badgeClass: 'bg-amber-400/10 text-amber-500 border-amber-400/20' },
                klar: { label: 'Klar', dotClass: 'bg-emerald-500', badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
              };
              const st = statusConfig[channelStatus];

              const accentMap = { rose: 'border-rose-500/20', blue: 'border-blue-500/20', indigo: 'border-indigo-500/20' };
              const btnMap = { rose: 'bg-rose-600 hover:bg-rose-700', blue: 'bg-blue-600 hover:bg-blue-700', indigo: 'bg-indigo-600 hover:bg-indigo-700' };

              return (
                <div key={ch.key} className={`rounded-xl border-2 ${channelStatus === 'klar' ? 'border-emerald-500/30' : accentMap[ch.accent]} bg-card overflow-hidden flex flex-col`}>
                  {/* Header */}
                  <div className="p-4 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{ch.icon}</span>
                      <div>
                        <h4 className="font-display text-sm font-semibold text-foreground">{ch.label}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${st.dotClass}`} />
                          <span className="text-[10px] text-muted-foreground">{st.label}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${st.badgeClass}`}>{st.label}</Badge>
                  </div>

                  {/* Content preview */}
                  <div className="px-4 pb-3 space-y-2 flex-1">
                    <div className="rounded-lg bg-muted/30 p-3 space-y-1.5">
                      <p className="text-[11px] font-medium text-foreground truncate">
                        {title || <span className="text-muted-foreground italic">Ingen titel endnu</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">
                        {desc || 'Ingen beskrivelse endnu'}
                      </p>
                    </div>

                    {/* Image readiness */}
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <ImageIcon className="h-3 w-3" />
                      <span>{listing.images?.length || 0} billeder</span>
                      <span className="text-muted-foreground/30">·</span>
                      <span>{listing.hero_image ? 'Hero ✓' : 'Ingen hero'}</span>
                    </div>

                    {/* Capacity */}
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>{listing.max_guests} gæster</span>
                      <span>{listing.bedrooms || 0} sov.</span>
                      <span>{(listing.amenities?.length || 0)} fac.</span>
                    </div>

                    {/* Missing fields */}
                    {channelMissing.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <p className="text-[10px] font-medium text-amber-500 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> {channelMissing.length} mangler
                        </p>
                        {channelMissing.slice(0, 3).map(m => (
                          <p key={m} className="text-[10px] text-muted-foreground pl-4">• {m}</p>
                        ))}
                        {channelMissing.length > 3 && (
                          <p className="text-[10px] text-muted-foreground pl-4">+ {channelMissing.length - 3} mere...</p>
                        )}
                      </div>
                    )}

                    {channelMissing.length === 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 pt-1">
                        <CheckCircle2 className="h-3 w-3" /> Alle felter klar
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-3 pt-0 space-y-2">
                    <Button
                      size="sm"
                      onClick={() => handlePrepareChannel(ch.key)}
                      disabled={ch.key === 'airbnb' && airbnbPreparing}
                      className={`w-full gap-1.5 text-xs h-8 text-white ${btnMap[ch.accent]}`}
                    >
                      {ch.key === 'airbnb' && airbnbPreparing
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Sparkles className="h-3.5 w-3.5" />
                      }
                      Forbered {ch.label}
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[10px] h-7"
                        onClick={() => {
                          setChannelDialogOpen(ch.key);
                        }}
                      >
                        Se mangler
                      </Button>
                      <Button
                        variant={ready ? 'secondary' : 'outline'}
                        size="sm"
                        className="flex-1 text-[10px] h-7"
                        onClick={() => update(`channel_${ch.key}_ready` as any, !ready)}
                      >
                        {ready ? '✓ Markeret klar' : 'Markér som klar'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Channel detail dialog */}
          <Dialog open={!!channelDialogOpen} onOpenChange={() => setChannelDialogOpen(null)}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  {channelDialogOpen === 'airbnb' ? 'Airbnb' : channelDialogOpen === 'booking' ? 'Booking.com' : 'Vrbo'} — Readiness
                </DialogTitle>
              </DialogHeader>
              {channelDialogOpen && (() => {
                const ch = channelDialogOpen as 'airbnb' | 'booking' | 'vrbo';
                const cr = channelReadiness[ch];
                const ready = (listing as any)[`channel_${ch}_ready`] as boolean | null;
                const chLabel = ch === 'airbnb' ? 'Airbnb' : ch === 'booking' ? 'Booking.com' : 'Vrbo';

                return (
                  <div className="space-y-5">
                    {/* Score header */}
                    <div className="flex items-center gap-4">
                      <ReadinessRing score={cr.score} size={64} strokeWidth={4} />
                      <div>
                        <p className="font-semibold text-foreground">
                          {cr.score === 100 ? `${chLabel} er 100% klar!` : cr.score >= 80 ? 'Næsten klar!' : cr.score >= 50 ? 'Godt på vej' : 'Flere felter mangler'}
                        </p>
                        <p className="text-xs text-muted-foreground">{cr.passed.length} af {cr.passed.length + cr.missing.length} krav opfyldt</p>
                      </div>
                    </div>

                    {/* Passed checklist */}
                    {cr.passed.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Opfyldt</p>
                        {cr.passed.map(p => (
                          <div key={p} className="flex items-center gap-2 text-xs text-muted-foreground py-0.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {p}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Missing with actions */}
                    {cr.missing.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Mangler</p>
                        {cr.missing.map(m => (
                          <div key={m.field} className="flex items-center justify-between gap-2 py-1 px-2 rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">{m.field}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[10px] h-6 px-2 text-primary shrink-0"
                              onClick={() => { setActiveTab(m.tab); setChannelDialogOpen(null); }}
                            >
                              {m.action} →
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {cr.score === 100 && (
                      <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <p className="text-xs text-emerald-600 font-medium">Alle påkrævede felter er udfyldt!</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1 gap-1.5"
                        onClick={() => { handlePrepareChannel(ch); setChannelDialogOpen(null); }}
                      >
                        <Sparkles className="h-4 w-4" /> AI-forbered {chLabel}
                      </Button>
                      <Button
                        variant={ready ? 'secondary' : 'outline'}
                        onClick={() => { update(`channel_${ch}_ready` as any, !ready); setChannelDialogOpen(null); setIsDirty(true); }}
                      >
                        {ready ? '✓ Klar' : 'Markér klar'}
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </DialogContent>
          </Dialog>

          {/* ── Airbnb Content ── */}
          <ChannelDataSection
            channelName="Airbnb"
            channelKey="airbnb"
            emoji="🏠"
            listing={listing}
            onUpdate={(key, value) => { update(key as any, value); }}
            onAiFill={() => handlePrepareChannel('airbnb')}
            aiFilling={airbnbPreparing}
            readinessScore={channelReadiness.airbnb.score}
            readinessPassed={channelReadiness.airbnb.passed}
            readinessMissing={channelReadiness.airbnb.missing}
            fields={[
              {
                key: 'channel_airbnb_title', label: 'Airbnb-titel', type: 'text', maxLength: 50,
                hint: 'Clickbait-titel optimeret til Airbnb',
                masterSource: 'Navn / Tagline',
                getMasterValue: () => listing.tagline || listing.description || listing.name,
              },
              {
                key: 'channel_airbnb_highlights', label: 'Airbnb-highlights', type: 'tags',
                hint: 'Top-oplevelser gæsten kan forvente',
                masterSource: 'Highlights',
                getMasterValue: () => listing.highlights,
              },
              {
                key: 'channel_airbnb_description', label: 'Airbnb-beskrivelse', type: 'textarea', rows: 5,
                hint: 'Detaljeret beskrivelse optimeret til Airbnb-gæster',
                masterSource: 'Lang beskrivelse + Om ejendommen + Om området',
                getMasterValue: () => [listing.long_description, listing.about_property, listing.about_area].filter(Boolean).join('\n\n') || listing.description,
              },
              {
                key: 'channel_airbnb_house_rules', label: 'Airbnb-husregler', type: 'textarea', rows: 3,
                hint: 'Husregler specifikt formateret til Airbnb',
                masterSource: 'Husregler',
                getMasterValue: () => listing.house_rules,
              },
              {
                key: 'channel_airbnb_checkin_notes', label: 'Airbnb check-in noter', type: 'textarea', rows: 3,
                hint: 'Instruktioner til gæster ved ankomst',
                masterSource: 'Check-in info',
                getMasterValue: () => listing.checkin_info,
                platformSpecific: !listing.checkin_info,
              },
            ]}
          />

          {/* ── Booking.com Content ── */}
          <ChannelDataSection
            channelName="Booking.com"
            channelKey="booking"
            emoji="🅱️"
            listing={listing}
            onUpdate={(key, value) => { update(key as any, value); }}
            onAiFill={() => handlePrepareChannel('booking')}
            aiFilling={channelPreparing}
            readinessScore={channelReadiness.booking.score}
            readinessPassed={channelReadiness.booking.passed}
            readinessMissing={channelReadiness.booking.missing}
            fields={[
              {
                key: 'channel_booking_title', label: 'Booking.com-titel', type: 'text',
                hint: 'Titel optimeret til Booking.com',
                masterSource: 'Navn',
                getMasterValue: () => listing.name,
              },
              {
                key: 'channel_booking_description', label: 'Booking.com-beskrivelse', type: 'textarea', rows: 5,
                hint: 'Faktuel beskrivelse til Booking.com',
                masterSource: 'Lang beskrivelse + Om ejendommen',
                getMasterValue: () => [listing.long_description, listing.about_property].filter(Boolean).join('\n\n') || listing.description,
              },
              {
                key: 'channel_booking_room_setup', label: 'Værelseopsætning', type: 'textarea', rows: 3,
                hint: 'Beskriv hvert værelse og sengeopsætning',
                platformSpecific: true,
                getMasterValue: () => {
                  if (!listing.bedrooms) return null;
                  return `${listing.bedrooms} soveværelse(r), ${listing.bathrooms || 1} badeværelse(r), max ${listing.max_guests} gæster`;
                },
              },
              {
                key: 'channel_booking_policies', label: 'Politikker', type: 'textarea', rows: 3,
                hint: 'Aflysnings- og depositumspolitik',
                platformSpecific: true,
                getMasterValue: () => listing.deposit ? `Depositum: ${listing.deposit} DKK` : null,
              },
              {
                key: 'channel_booking_checkin_checkout', label: 'Check-in / Check-out', type: 'textarea', rows: 3,
                hint: 'Tider og procedure for ankomst/afrejse',
                masterSource: 'Check-in/out tider',
                getMasterValue: () => {
                  const parts: string[] = [];
                  if (listing.check_in_time) parts.push(`Check-in: fra kl. ${listing.check_in_time}`);
                  if (listing.check_out_time) parts.push(`Check-out: senest kl. ${listing.check_out_time}`);
                  if (listing.checkin_info) parts.push(listing.checkin_info);
                  return parts.length ? parts.join('\n') : null;
                },
              },
            ]}
          />

          {/* ── Vrbo Content ── */}
          <ChannelDataSection
            channelName="Vrbo"
            channelKey="vrbo"
            emoji="🏡"
            listing={listing}
            onUpdate={(key, value) => { update(key as any, value); }}
            onAiFill={() => handlePrepareChannel('vrbo')}
            aiFilling={channelPreparing}
            readinessScore={channelReadiness.vrbo.score}
            readinessPassed={channelReadiness.vrbo.passed}
            readinessMissing={channelReadiness.vrbo.missing}
            fields={[
              {
                key: 'channel_vrbo_title', label: 'Vrbo-titel', type: 'text',
                hint: 'Titel til Vrbo',
                masterSource: 'Navn / Tagline',
                getMasterValue: () => listing.tagline || listing.name,
              },
              {
                key: 'channel_vrbo_highlights', label: 'Vrbo-highlights', type: 'tags',
                hint: 'Nøgle-oplevelser',
                masterSource: 'Highlights',
                getMasterValue: () => listing.highlights,
              },
              {
                key: 'channel_vrbo_description', label: 'Vrbo-beskrivelse', type: 'textarea', rows: 5,
                hint: 'Detaljeret beskrivelse til Vrbo',
                masterSource: 'Lang beskrivelse + Om området',
                getMasterValue: () => [listing.long_description, listing.about_area].filter(Boolean).join('\n\n') || listing.description,
              },
              {
                key: 'channel_vrbo_rules', label: 'Vrbo-regler', type: 'textarea', rows: 3,
                hint: 'Husregler specifikt til Vrbo',
                masterSource: 'Husregler',
                getMasterValue: () => listing.house_rules,
              },
            ]}
          />
        </TabsContent>

        {/* ─── 9. INTEGRATION ─── */}
        <TabsContent value="integration" className="mt-4 space-y-5">
          {(() => {
            const syncStatus = listing.sync_status || 'not_connected';
            const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
              not_connected: { label: 'Ikke tilkoblet', color: 'text-muted-foreground', icon: <WifiOff className="h-4 w-4" />, bg: 'bg-muted' },
              ready: { label: 'Klar til integration', color: 'text-blue-600', icon: <Wifi className="h-4 w-4" />, bg: 'bg-blue-50 dark:bg-blue-950/30' },
              pending: { label: 'Venter på sync', color: 'text-amber-600', icon: <Clock className="h-4 w-4 animate-pulse" />, bg: 'bg-amber-50 dark:bg-amber-950/30' },
              synced: { label: 'Synkroniseret', color: 'text-emerald-600', icon: <CheckCircle2 className="h-4 w-4" />, bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
              error: { label: 'Fejl', color: 'text-destructive', icon: <AlertCircle className="h-4 w-4" />, bg: 'bg-destructive/10' },
            };
            const cfg = statusConfig[syncStatus] || statusConfig.not_connected;

            return (
              <>
                {/* Status banner */}
                <div className={`rounded-xl border border-border p-5 flex items-center justify-between ${cfg.bg}`}>
                  <div className="flex items-center gap-3">
                    <div className={`${cfg.color}`}>{cfg.icon}</div>
                    <div>
                      <p className={`font-semibold text-sm ${cfg.color}`}>{cfg.label}</p>
                      {listing.last_sync_at && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Sidst synkroniseret: {new Date(listing.last_sync_at).toLocaleString('da-DK')}
                        </p>
                      )}
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

                {/* Error message */}
                {syncStatus === 'error' && listing.sync_error_message && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Sync-fejl</p>
                      <p className="text-xs text-muted-foreground mt-1">{listing.sync_error_message}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <Section title="Channel Manager" description="Tilslutning til ekstern partner">
                    <Field label="Channel Manager Partner" hint="F.eks. Beds24, Guesty, Hostaway">
                      <Select value={listing.channel_manager_partner || ''} onValueChange={v => update('channel_manager_partner' as any, v || null)}>
                        <SelectTrigger><SelectValue placeholder="Vælg partner..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ingen</SelectItem>
                          <SelectItem value="beds24">Beds24</SelectItem>
                          <SelectItem value="guesty">Guesty</SelectItem>
                          <SelectItem value="hostaway">Hostaway</SelectItem>
                          <SelectItem value="lodgify">Lodgify</SelectItem>
                          <SelectItem value="smoobu">Smoobu</SelectItem>
                          <SelectItem value="other">Andet</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </Section>

                  <Section title="Ekstern ID-mapping" description="ID'er der bruges til synkronisering">
                    <Field label="Eksternt Listing-ID" hint="Listing-ID i channel manager">
                      <Input value={listing.external_listing_id || ''} onChange={e => update('external_listing_id' as any, e.target.value || null)} placeholder="F.eks. 123456" />
                    </Field>
                    <Field label="Eksternt Property-ID" hint="Property-ID i channel manager">
                      <Input value={listing.external_property_id || ''} onChange={e => update('external_property_id' as any, e.target.value || null)} placeholder="F.eks. PROP-789" />
                    </Field>
                  </Section>
                </div>

                {syncStatus === 'error' && (
                  <Section title="Fejlbesked" description="Seneste fejl fra synkronisering">
                    <Textarea
                      value={listing.sync_error_message || ''}
                      onChange={e => update('sync_error_message' as any, e.target.value || null)}
                      rows={3}
                      placeholder="Ingen fejlbesked..."
                    />
                  </Section>
                )}

                {/* Integration roadmap info */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">Kommende integration</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Denne sektion forbereder listing-systemet til fremtidig tilslutning af en channel manager.
                        Når en partner er tilkoblet, vil kalender, priser og bookinger automatisk synkroniseres
                        mellem SommerVibes og portaler som Airbnb, Booking.com og Vrbo.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {['Kalender-sync', 'Pris-sync', 'Booking-import', 'Status-opdatering'].map(f => (
                          <Badge key={f} variant="secondary" className="text-[11px]">{f}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </TabsContent>
      </Tabs>

      {/* Floating save bar */}
      {isDirty && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-6 py-3 rounded-full shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <span className="text-sm">Du har ændringer der ikke er gemt</span>
          <Button size="sm" variant="secondary" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Gem nu
          </Button>
        </div>
      )}
    </div>
  );
}
