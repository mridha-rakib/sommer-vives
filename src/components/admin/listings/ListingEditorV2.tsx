import { useState, useEffect, useMemo } from 'react';
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
  CircleDot, Circle, Check
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

  // ── Action: Forbedr tekst med AI ──
  const handleAiImprove = async () => {
    if (!listing) return;
    setAiImproving(true);
    setAiDialogOpen(true);
    try {
      const { data, error } = await supabase.functions.invoke('improve-listing-text', {
        body: { listing },
      });
      if (error) throw error;
      if (data?.improved) {
        setAiPreview(data.improved);
      } else if (data?.error) {
        toast({ title: 'AI-fejl', description: data.error, variant: 'destructive' });
        setAiDialogOpen(false);
      }
    } catch (e: any) {
      toast({ title: 'Fejl', description: e.message || 'Kunne ikke forbedre tekst', variant: 'destructive' });
      setAiDialogOpen(false);
    } finally {
      setAiImproving(false);
    }
  };

  const applyAiSuggestions = () => {
    if (!aiPreview || !listing) return;
    if (aiPreview.title) update('description', aiPreview.title);
    if (aiPreview.tagline) update('tagline', aiPreview.tagline);
    if (aiPreview.description) update('long_description', aiPreview.description);
    if (aiPreview.long_description) update('long_description', aiPreview.long_description);
    if (aiPreview.highlights?.length) update('highlights', aiPreview.highlights);
    toast({ title: 'AI-tekst anvendt!', description: 'Husk at gemme ændringerne.' });
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

      {/* ── ACTION TOOLBAR ── */}
      <div className="bg-card border border-border rounded-xl p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground mr-1 hidden sm:inline">Handlinger:</span>
          <Button variant="outline" size="sm" onClick={handleCheck} className="gap-1.5 text-xs h-8">
            <ClipboardCheck className="h-3.5 w-3.5" /> Tjek listing
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrepare} className="gap-1.5 text-xs h-8">
            <Rocket className="h-3.5 w-3.5" /> Klargør listing
          </Button>
          <Button variant="outline" size="sm" onClick={handleAiImprove} disabled={aiImproving} className="gap-1.5 text-xs h-8 border-primary/30 text-primary hover:bg-primary/5">
            {aiImproving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Forbedr tekst med AI
          </Button>
          <div className="hidden sm:block w-px h-5 bg-border mx-1" />
          <Button variant="ghost" size="sm" onClick={() => handlePrepareChannel('airbnb')} className="gap-1.5 text-xs h-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
            <Globe className="h-3.5 w-3.5" /> Forbered Airbnb
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handlePrepareChannel('booking')} className="gap-1.5 text-xs h-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
            <Globe className="h-3.5 w-3.5" /> Forbered Booking.com
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handlePrepareChannel('vrbo')} className="gap-1.5 text-xs h-8 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700">
            <Globe className="h-3.5 w-3.5" /> Forbered Vrbo
          </Button>
        </div>
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
              <Sparkles className="h-5 w-5 text-primary" /> AI-forbedret tekst
            </DialogTitle>
          </DialogHeader>
          {aiImproving && (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> AI skriver forbedrede tekster...
            </div>
          )}
          {aiPreview && !aiImproving && (
            <div className="space-y-4">
              {aiPreview.title && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Offentlig titel</p>
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

              <div className="flex gap-2 pt-2">
                <Button onClick={applyAiSuggestions} className="flex-1 gap-1.5">
                  <Check className="h-4 w-4" /> Anvend alle forslag
                </Button>
                <Button variant="outline" onClick={() => { setAiDialogOpen(false); setAiPreview(null); }}>
                  Annuller
                </Button>
              </div>
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-card border border-border rounded-xl p-1 h-auto flex-wrap gap-1">
          {[
            { value: 'grunddata', label: 'Grunddata', icon: Home },
            { value: 'beskrivelse', label: 'Beskrivelse', icon: Tag },
            { value: 'billeder', label: 'Billeder', icon: ImageIcon },
            { value: 'faciliteter', label: 'Faciliteter', icon: CheckCircle2 },
            { value: 'priser', label: 'Priser & Regler', icon: DollarSign },
            { value: 'readiness', label: 'Readiness', icon: Star },
            { value: 'kanaler', label: 'Kanaler', icon: Globe },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <tab.icon className="h-3.5 w-3.5" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ─── 1. GRUNDDATA ─── */}
        <TabsContent value="grunddata" className="mt-4 space-y-5">
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
        </TabsContent>

        {/* ─── 2. BESKRIVELSE ─── */}
        <TabsContent value="beskrivelse" className="mt-4 space-y-5">
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
        </TabsContent>

        {/* ─── 3. BILLEDER ─── */}
        <TabsContent value="billeder" className="mt-4 space-y-5">
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
        </TabsContent>

        {/* ─── 4. FACILITETER ─── */}
        <TabsContent value="faciliteter" className="mt-4 space-y-5">
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

        {/* ─── 5. PRISER & REGLER ─── */}
        <TabsContent value="priser" className="mt-4 space-y-5">
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
        </TabsContent>

        {/* ─── 6. READINESS ─── */}
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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">Distribution & kanaler</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Klargør og publicer din listing til eksterne platforme</p>
            </div>
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
                  {channelDialogOpen === 'airbnb' ? 'Airbnb' : channelDialogOpen === 'booking' ? 'Booking.com' : 'Vrbo'} — Detaljer
                </DialogTitle>
              </DialogHeader>
              {channelDialogOpen && (() => {
                const ch = channelDialogOpen as 'airbnb' | 'booking' | 'vrbo';
                const title = (listing as any)[`channel_${ch}_title`] as string | null;
                const desc = (listing as any)[`channel_${ch}_description`] as string | null;
                const ready = (listing as any)[`channel_${ch}_ready`] as boolean | null;
                const missing: string[] = [];
                if (!title || title.length < 5) missing.push('Kanaltitel (min 5 tegn)');
                if (!desc || desc.length < 20) missing.push('Kanalbeskrivelse (min 20 tegn)');
                if (!listing.hero_image) missing.push('Hero-billede');
                if ((listing.images?.length || 0) < 3) missing.push('Mindst 3 galleri-billeder');
                if ((listing.amenities?.length || 0) < 3) missing.push('Mindst 3 faciliteter');
                if (!listing.address) missing.push('Adresse');
                if ((listing.max_guests || 0) < 1) missing.push('Gæstekapacitet');
                if ((listing.base_price_per_night || 0) <= 0) missing.push('Basispris');
                if (!listing.check_in_time) missing.push('Check-in tid');
                if (!listing.check_out_time) missing.push('Check-out tid');
                if (!listing.house_rules) missing.push('Husregler');

                return (
                  <div className="space-y-4">
                    {/* Title & desc preview */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Kanaltitel</p>
                      <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground">
                        {title || <span className="italic text-muted-foreground">Ikke udfyldt</span>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Kanalbeskrivelse</p>
                      <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground whitespace-pre-line">
                        {desc || <span className="italic text-muted-foreground">Ikke udfyldt</span>}
                      </div>
                    </div>

                    {/* Image readiness */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Billeder</p>
                      <div className="flex gap-2">
                        {listing.images?.slice(0, 5).map((img, i) => (
                          <div key={i} className="w-14 h-14 rounded-lg overflow-hidden border border-border">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {(!listing.images || listing.images.length === 0) && (
                          <p className="text-xs text-muted-foreground italic">Ingen billeder</p>
                        )}
                      </div>
                    </div>

                    {/* Missing fields */}
                    {missing.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-amber-500">⚠ Manglende felter ({missing.length})</p>
                        {missing.map(m => (
                          <div key={m} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" /> {m}
                          </div>
                        ))}
                      </div>
                    )}

                    {missing.length === 0 && (
                      <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <p className="text-xs text-emerald-500 font-medium">Alle påkrævede felter er udfyldt!</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1 gap-1.5"
                        onClick={() => { handlePrepareChannel(ch); setChannelDialogOpen(null); }}
                      >
                        <Sparkles className="h-4 w-4" /> Forbered {channelDialogOpen === 'airbnb' ? 'Airbnb' : channelDialogOpen === 'booking' ? 'Booking.com' : 'Vrbo'}
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
          <Section title="🏠 Airbnb-indhold" description="Alle felter der sendes til Airbnb. Rediger manuelt eller lad AI generere.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Airbnb-titel" hint="Max 50 tegn">
                <Input value={listing.channel_airbnb_title || ''} onChange={e => update('channel_airbnb_title', e.target.value)} placeholder="Charming Beachfront Summer House" maxLength={50} />
                <div className="text-[10px] text-muted-foreground text-right">{(listing.channel_airbnb_title || '').length}/50</div>
              </Field>
              <Field label="Airbnb-highlights" hint="Komma-separeret liste">
                <Input value={(listing.channel_airbnb_highlights || []).join(', ')} onChange={e => update('channel_airbnb_highlights' as any, e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Havudsigt, Sauna, Privat strand" />
              </Field>
            </div>
            <Field label="Airbnb-beskrivelse">
              <Textarea value={listing.channel_airbnb_description || ''} onChange={e => update('channel_airbnb_description', e.target.value)} rows={4} placeholder="Beskrivelse optimeret til Airbnb-gæster..." />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Airbnb-husregler" hint="Regler specifikt til Airbnb">
                <Textarea value={listing.channel_airbnb_house_rules || ''} onChange={e => update('channel_airbnb_house_rules' as any, e.target.value)} rows={3} placeholder="Ingen fester, røgfrit..." />
              </Field>
              <Field label="Airbnb check-in noter" hint="Instruktioner til gæster">
                <Textarea value={listing.channel_airbnb_checkin_notes || ''} onChange={e => update('channel_airbnb_checkin_notes' as any, e.target.value)} rows={3} placeholder="Nøgleboks ved hoveddøren..." />
              </Field>
            </div>
          </Section>

          {/* ── Booking.com Content ── */}
          <Section title="🅱️ Booking.com-indhold" description="Felter tilpasset Booking.com's format og krav.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Booking.com-titel">
                <Input value={listing.channel_booking_title || ''} onChange={e => update('channel_booking_title', e.target.value)} placeholder="Titel til Booking.com" />
              </Field>
              <Field label="Værelseopsætning" hint="Beskrivelse af rum-typer">
                <Input value={listing.channel_booking_room_setup || ''} onChange={e => update('channel_booking_room_setup' as any, e.target.value)} placeholder="1x Master, 2x Twin, 1x Sofa bed" />
              </Field>
            </div>
            <Field label="Booking.com-beskrivelse">
              <Textarea value={listing.channel_booking_description || ''} onChange={e => update('channel_booking_description', e.target.value)} rows={4} placeholder="Beskrivelse til Booking.com..." />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Politikker" hint="Aflysning, depositum osv.">
                <Textarea value={listing.channel_booking_policies || ''} onChange={e => update('channel_booking_policies' as any, e.target.value)} rows={3} placeholder="Gratis afbestilling op til 48 timer..." />
              </Field>
              <Field label="Check-in / Check-out" hint="Tider og procedure">
                <Textarea value={listing.channel_booking_checkin_checkout || ''} onChange={e => update('channel_booking_checkin_checkout' as any, e.target.value)} rows={3} placeholder="Check-in: 15:00-20:00, Check-out: senest 10:00" />
              </Field>
            </div>
          </Section>

          {/* ── Vrbo Content ── */}
          <Section title="🏡 Vrbo-indhold" description="Felter tilpasset Vrbo's platform.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Vrbo-titel">
                <Input value={listing.channel_vrbo_title || ''} onChange={e => update('channel_vrbo_title', e.target.value)} placeholder="Titel til Vrbo" />
              </Field>
              <Field label="Vrbo-highlights" hint="Komma-separeret">
                <Input value={(listing.channel_vrbo_highlights || []).join(', ')} onChange={e => update('channel_vrbo_highlights' as any, e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Ocean view, Hot tub, Private deck" />
              </Field>
            </div>
            <Field label="Vrbo-beskrivelse">
              <Textarea value={listing.channel_vrbo_description || ''} onChange={e => update('channel_vrbo_description', e.target.value)} rows={4} placeholder="Beskrivelse til Vrbo..." />
            </Field>
            <Field label="Vrbo-regler">
              <Textarea value={listing.channel_vrbo_rules || ''} onChange={e => update('channel_vrbo_rules' as any, e.target.value)} rows={3} placeholder="Husregler specifikt til Vrbo..." />
            </Field>
          </Section>
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
