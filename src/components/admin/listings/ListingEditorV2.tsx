import { useState, useEffect, useMemo, useRef, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Icons
import {
  ArrowLeft, Loader2, Save, X, Plus, Home, ImageIcon, DollarSign, CheckCircle2, Globe,
  Star, AlertTriangle, Info, ClipboardCheck, Rocket, Sparkles, Zap,
  CircleDot, Circle, Check, Languages, Wand2, FileText,
  Eye, Settings, Tag, Puzzle, FileCheck, StickyNote, Calendar as CalendarIcon, ShoppingBag,
  Users, Briefcase, Heart, Bed, Utensils, MapPin, Play, Phone, Camera, Layers,
  ChevronRight, Monitor, PanelRightClose
} from 'lucide-react';

// Studio modules
import { StudioContentBlock, StudioField, StudioTextArea, StudioInput, StudioBulletEditor, StudioAIButton } from './studio/StudioContentBlock';
import { StudioStepNav, type StudioStep } from './studio/StudioStepNav';
import { StudioPreview } from './studio/StudioPreview';

// Existing components
import { ListingCalendarPricing } from './ListingCalendarPricing';
import { ChannelDataSection } from './ChannelDataSection';
import { ListingActorsTab } from './ListingActorsTab';
import { ListingStaffTab } from './ListingStaffTab';
import { ListingDocumentsTab } from './ListingDocumentsTab';
import { ListingImageUpload, SortableImageGallery, type BedroomImage, type ImageLabel } from './ListingImageUpload';
import { AdminFacilities, type FacilityCategory } from './AdminFacilities';
import { AdminSectionEditor, type ExtraSection } from './AdminSectionEditor';

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

// ── Constants ──
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
  { value: 'paused', label: 'Pauset', icon: Circle, color: 'text-amber-500' },
];

const STUDIO_STEPS: StudioStep[] = [
  { id: 'setup', label: 'Grundopsætning', icon: Settings, description: 'Kernedata og boligtype' },
  { id: 'studio', label: 'Listing Studio', icon: Sparkles, description: 'Byg din SommerVibes-præsentation' },
  { id: 'media', label: 'Medier', icon: Camera, description: 'Billeder, video og plantegninger' },
  { id: 'rooms', label: 'Sovepladser & faciliteter', icon: Bed, description: 'Soveværelser og komfort' },
  { id: 'booking', label: 'Bookingoplevelse', icon: CalendarIcon, description: 'Priser, check-in og regler' },
  { id: 'contact', label: 'Kontakt & videoguides', icon: Play, description: 'Kontakt og guidemateriale' },
  { id: 'airbnb', label: 'Airbnb', icon: Home, description: 'Airbnb-kanal data' },
  { id: 'bookingcom', label: 'Booking.com', icon: Globe, description: 'Booking.com-kanal data' },
  { id: 'vrbo', label: 'Vrbo', icon: MapPin, description: 'Vrbo-kanal data' },
  { id: 'publish', label: 'Klargøring & publicering', icon: Rocket, description: 'Readiness og go-live' },
  { id: 'actors', label: 'Aktører', icon: Users, description: 'Ejer og kontakter' },
  { id: 'staff', label: 'Medarbejdere', icon: Briefcase, description: 'Tildelte medarbejdere' },
  { id: 'documents', label: 'Dokumenter', icon: FileText, description: 'Sagens dokumenter' },
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
    ['Hero-billede', !!f.hero_image, 'media', 'Upload et hero-billede'],
    ['Min. 3 galleri-billeder', (f.images?.length || 0) >= 3, 'media', 'Tilføj flere billeder'],
    ['Adresse', !!f.address, 'setup', 'Udfyld adressen'],
    ['Gæstekapacitet', (f.max_guests || 0) > 0, 'setup', 'Angiv max gæster'],
    ['Soveværelser', (f.bedrooms || 0) > 0, 'rooms', 'Angiv antal soveværelser'],
    ['Basispris', (f.base_price_per_night || 0) > 0, 'booking', 'Sæt en basispris'],
    ['Check-in tid', !!f.check_in_time, 'booking', 'Angiv check-in tid'],
    ['Check-out tid', !!f.check_out_time, 'booking', 'Angiv check-out tid'],
    ['Faciliteter (3+)', (f.amenities?.length || 0) >= 3, 'rooms', 'Tilføj faciliteter'],
  ];
  const channelChecks: Record<string, [string, boolean, string, string][]> = {
    airbnb: [
      ['Airbnb-titel', !!(f.channel_airbnb_title && f.channel_airbnb_title.length >= 5), 'airbnb', 'Skriv en Airbnb-titel'],
      ['Airbnb-beskrivelse', !!(f.channel_airbnb_description && f.channel_airbnb_description.length >= 20), 'airbnb', 'Skriv en Airbnb-beskrivelse'],
      ['Airbnb-husregler', !!(f.channel_airbnb_house_rules && f.channel_airbnb_house_rules.length > 5), 'airbnb', 'Tilføj husregler'],
      ['Airbnb-highlights', (f.channel_airbnb_highlights?.length || 0) >= 2, 'airbnb', 'Tilføj highlights'],
      ['Airbnb check-in noter', !!(f.channel_airbnb_checkin_notes && f.channel_airbnb_checkin_notes.length > 5), 'airbnb', 'Beskriv check-in'],
    ],
    booking: [
      ['Booking.com-titel', !!(f.channel_booking_title && f.channel_booking_title.length >= 5), 'bookingcom', 'Skriv en titel'],
      ['Booking.com-beskrivelse', !!(f.channel_booking_description && f.channel_booking_description.length >= 20), 'bookingcom', 'Skriv en beskrivelse'],
      ['Værelseopsætning', !!(f.channel_booking_room_setup && f.channel_booking_room_setup.length > 3), 'bookingcom', 'Beskriv værelserne'],
      ['Politikker', !!(f.channel_booking_policies && f.channel_booking_policies.length > 5), 'bookingcom', 'Tilføj politik'],
      ['Check-in/out info', !!(f.channel_booking_checkin_checkout && f.channel_booking_checkin_checkout.length > 5), 'bookingcom', 'Udfyld check-in/out'],
    ],
    vrbo: [
      ['Vrbo-titel', !!(f.channel_vrbo_title && f.channel_vrbo_title.length >= 5), 'vrbo', 'Skriv en titel'],
      ['Vrbo-beskrivelse', !!(f.channel_vrbo_description && f.channel_vrbo_description.length >= 20), 'vrbo', 'Skriv en beskrivelse'],
      ['Vrbo-highlights', (f.channel_vrbo_highlights?.length || 0) >= 2, 'vrbo', 'Tilføj highlights'],
      ['Vrbo-regler', !!(f.channel_vrbo_rules && f.channel_vrbo_rules.length > 5), 'vrbo', 'Tilføj regler'],
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

// ══════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════
export function ListingEditorV2({ listingId, onBack }: Props) {
  const { toast } = useToast();
  const [listing, setListing] = useState<ListingFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [currentStep, setCurrentStep] = useState('setup');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sideNavCollapsed, setSideNavCollapsed] = useState(false);

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

  const completedSteps = useMemo(() => {
    if (!listing) return [];
    const completed: string[] = [];
    if (listing.name && listing.address && listing.region) completed.push('setup');
    if (listing.description && listing.long_description) completed.push('studio');
    if ((listing.images?.length || 0) >= 3 && listing.hero_image) completed.push('media');
    if ((listing.amenities?.length || 0) >= 3 && (listing.bedrooms || 0) > 0) completed.push('rooms');
    if (listing.base_price_per_night > 0 && listing.check_in_time) completed.push('booking');
    if (channelReadiness.airbnb.score >= 80) completed.push('airbnb');
    if (channelReadiness.booking.score >= 80) completed.push('bookingcom');
    if (channelReadiness.vrbo.score >= 80) completed.push('vrbo');
    if (readiness.score >= 90) completed.push('publish');
    return completed;
  }, [listing, channelReadiness, readiness]);

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
    return (
      <div className="flex items-center justify-center py-24 gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-medium">Indlæser Listing Studio...</span>
      </div>
    );
  }

  const currentStatus = STATUS_OPTIONS.find(s => s.value === (listing.internal_status || 'draft')) || STATUS_OPTIONS[0];
  const stepInfo = STUDIO_STEPS.find(s => s.id === currentStep);

  return (
    <div className="flex h-[calc(100vh-7rem)] -mt-5 md:-mt-8 -mx-5 md:-mx-8">
      {/* ── Left: Step Navigation ── */}
      <div className={cn(
        'border-r border-border/30 bg-card/30 backdrop-blur-sm shrink-0 flex flex-col transition-all duration-300',
        sideNavCollapsed ? 'w-[52px]' : 'w-[220px]'
      )}>
        {/* Studio branding header */}
        <div className="px-3 py-4 border-b border-border/30">
          {!sideNavCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-gold-dark flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">Listing Studio</p>
                <p className="text-[10px] text-primary font-medium">SommerVibes</p>
              </div>
              <button onClick={() => setSideNavCollapsed(true)} className="p-1 rounded-lg hover:bg-muted/30">
                <PanelRightClose className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <button onClick={() => setSideNavCollapsed(false)} className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-gold-dark">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </button>
          )}
        </div>

        {/* Steps */}
        <div className="flex-1 overflow-y-auto px-2 py-3 scrollbar-hide">
          {sideNavCollapsed ? (
            <div className="space-y-1">
              {STUDIO_STEPS.map((step) => {
                const isActive = step.id === currentStep;
                const isCompleted = completedSteps.includes(step.id);
                return (
                  <button key={step.id} onClick={() => setCurrentStep(step.id)} title={step.label}
                    className={cn(
                      'flex items-center justify-center w-9 h-9 mx-auto rounded-xl transition-all',
                      isActive ? 'bg-primary/15 text-primary' : isCompleted ? 'text-primary/60' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    )}>
                    {isCompleted && !isActive ? <Check className="h-3.5 w-3.5" /> : <step.icon className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <StudioStepNav steps={STUDIO_STEPS} currentStep={currentStep} onStepChange={setCurrentStep} completedSteps={completedSteps} />
          )}
        </div>

        {/* Readiness footer */}
        {!sideNavCollapsed && (
          <div className="p-3 border-t border-border/30">
            <div className="flex items-center gap-2.5">
              <ReadinessRing score={readiness.score} size={36} strokeWidth={2.5} />
              <div>
                <p className="text-[10px] font-semibold text-foreground">{readiness.score}% klar</p>
                <p className="text-[9px] text-muted-foreground">{readiness.missing.length} mangler</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Right: Content area ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-13 border-b border-border/30 flex items-center justify-between px-5 shrink-0 bg-card/20">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold text-foreground truncate">{listing.name}</h2>
              <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                {stepInfo?.label}
                <span className="text-muted-foreground/30">·</span>
                <span className={cn('flex items-center gap-1', currentStatus.color)}>
                  <currentStatus.icon className="h-2.5 w-2.5" /> {currentStatus.label}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)} className="gap-1.5 text-xs h-8 rounded-xl border-border/50">
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
            <Select value={listing.internal_status || 'draft'} onValueChange={v => update('internal_status', v)}>
              <SelectTrigger className="w-[130px] h-8 text-xs rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>
                    <span className="flex items-center gap-1.5"><s.icon className={`h-3 w-3 ${s.color}`} />{s.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleSave} disabled={saving || !isDirty} className="gap-1.5 text-xs h-8 rounded-xl">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Gem
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* ═══ GRUNDOPSÆTNING ═══ */}
            {currentStep === 'setup' && (
              <>
                <div className="mb-8">
                  <h1 className="font-display text-2xl font-bold text-foreground">Grundopsætning</h1>
                  <p className="text-sm text-muted-foreground mt-1">Kerneoplysninger om boligen</p>
                </div>

                <StudioContentBlock title="Bolig identitet" icon={<Home className="h-4 w-4 text-primary" />}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <StudioField label="Titel" hint="Det navn gæsten ser">
                      <StudioInput value={listing.name} onChange={v => update('name', v)} />
                    </StudioField>
                    <StudioField label="Tagline" hint="Kort fængende undertitel">
                      <StudioInput value={listing.tagline || ''} onChange={v => update('tagline', v)} placeholder="Moderne sommerhus med havudsigt" />
                    </StudioField>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <StudioField label="Boligtype">
                      <Select value={listing.property_type || 'summerhouse'} onValueChange={v => update('property_type', v)}>
                        <SelectTrigger className="rounded-xl bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                        <SelectContent>{PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </StudioField>
                    <StudioField label="m²">
                      <StudioInput type="number" value={listing.sqm || ''} onChange={v => update('sqm', parseInt(v) || null)} placeholder="120" />
                    </StudioField>
                  </div>
                </StudioContentBlock>

                <StudioContentBlock title="Lokation" icon={<MapPin className="h-4 w-4 text-primary" />}>
                  <StudioField label="Adresse">
                    <StudioInput value={listing.address || ''} onChange={v => update('address', v)} placeholder="Skovvej 12, 4573 Højby" />
                  </StudioField>
                  <div className="grid grid-cols-2 gap-5">
                    <StudioField label="By">
                      <StudioInput value={listing.city || ''} onChange={v => update('city' as any, v)} placeholder="Hornbæk" />
                    </StudioField>
                    <StudioField label="Region">
                      <StudioInput value={listing.region || ''} onChange={v => update('region', v)} placeholder="Nordsjælland" />
                    </StudioField>
                  </div>
                </StudioContentBlock>

                <StudioContentBlock title="Kapacitet" icon={<Users className="h-4 w-4 text-primary" />}>
                  <div className="grid grid-cols-3 gap-5">
                    <StudioField label="Max gæster">
                      <StudioInput type="number" value={listing.max_guests} onChange={v => update('max_guests', parseInt(v) || 1)} />
                    </StudioField>
                    <StudioField label="Soveværelser">
                      <StudioInput type="number" value={listing.bedrooms || 0} onChange={v => update('bedrooms', parseInt(v) || 0)} />
                    </StudioField>
                    <StudioField label="Badeværelser">
                      <StudioInput type="number" value={listing.bathrooms || 0} onChange={v => update('bathrooms', parseInt(v) || 0)} />
                    </StudioField>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Switch checked={listing.is_active} onCheckedChange={v => update('is_active', v)} />
                    <Label className="text-sm font-medium">Aktiv listing</Label>
                  </div>
                </StudioContentBlock>
              </>
            )}

            {/* ═══ LISTING STUDIO ═══ */}
            {currentStep === 'studio' && (
              <>
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="font-display text-2xl font-bold text-foreground">
                        <span className="text-gradient-gold">SommerVibes</span> Listing Studio
                      </h1>
                      <p className="text-sm text-muted-foreground mt-1">Byg din premium bolig-præsentation</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StudioAIButton label="AI Alt indhold" onClick={() => handleAiAction('improve_all')} loading={aiImproving} />
                      <StudioAIButton label="Oversæt EN" onClick={() => handleAiAction('translate_en')} loading={aiImproving} />
                      <StudioAIButton label="Oversæt DE" onClick={() => handleAiAction('translate_de')} loading={aiImproving} />
                    </div>
                  </div>
                </div>

                <StudioContentBlock title="Hero & intro" subtitle="Fangsteksten og den første oplevelse" icon={<Star className="h-4 w-4 text-primary" />}
                  actions={<StudioAIButton label="AI Titel" onClick={() => handleAiAction('improve_title')} loading={aiImproving} />}>
                  <StudioField label="Kort beskrivelse" hint="Vises i søgeresultater og listing-kort">
                    <StudioTextArea value={listing.description || ''} onChange={v => update('description', v)} rows={3} placeholder="En kort, fængende beskrivelse..." />
                  </StudioField>
                </StudioContentBlock>

                <StudioContentBlock title="Højdepunkter" subtitle="De oplevelser der skiller sig ud" icon={<Star className="h-4 w-4 text-primary" />}
                  actions={<StudioAIButton label="AI Highlights" onClick={() => handleAiAction('generate_highlights')} loading={aiImproving} />}>
                  <StudioBulletEditor items={listing.highlights || []} onChange={v => update('highlights', v)} placeholder="F.eks. Havudsigt, Nyistandsat, Sauna..." />
                </StudioContentBlock>

                <StudioContentBlock title="Boligen" subtitle="Detaljeret beskrivelse af boligen" icon={<Home className="h-4 w-4 text-primary" />}
                  actions={<StudioAIButton label="AI Beskrivelse" onClick={() => handleAiAction('improve_long_description')} loading={aiImproving} />}>
                  <StudioField label="Lang beskrivelse">
                    <StudioTextArea value={listing.long_description || ''} onChange={v => update('long_description', v)} rows={6} placeholder="Beskriv boligen i detaljer..." />
                  </StudioField>
                  <StudioField label="Om boligen">
                    <StudioTextArea value={listing.about_property || ''} onChange={v => update('about_property', v)} rows={4} placeholder="Boligen er bygget i..." />
                  </StudioField>
                </StudioContentBlock>

                <StudioContentBlock title="Her skal du være" subtitle="Fortæl om det lokale område" icon={<MapPin className="h-4 w-4 text-primary" />}>
                  <StudioField label="Om området">
                    <StudioTextArea value={listing.about_area || ''} onChange={v => update('about_area', v)} rows={4} placeholder="Området byder på..." />
                  </StudioField>
                </StudioContentBlock>

                <StudioContentBlock title="Ekstra sektioner" subtitle="Tilføj egne indholdsblokke" icon={<Layers className="h-4 w-4 text-primary" />}>
                  <AdminSectionEditor
                    sections={((listing as any).extra_sections as ExtraSection[]) || []}
                    onChange={s => update('extra_sections' as any, s)}
                    listingSlug={listing.slug}
                  />
                </StudioContentBlock>
              </>
            )}

            {/* ═══ MEDIER ═══ */}
            {currentStep === 'media' && (
              <>
                <div className="mb-8">
                  <h1 className="font-display text-2xl font-bold text-foreground">Medier</h1>
                  <p className="text-sm text-muted-foreground mt-1">Billeder, video og plantegninger</p>
                </div>

                <StudioContentBlock title="Upload billeder" subtitle="Træk og slip eller klik for at uploade" icon={<Camera className="h-4 w-4 text-primary" />}>
                  <ListingImageUpload listingSlug={listing.slug} onUploaded={url => update('images', [...(listing.images || []), url])} />
                </StudioContentBlock>

                <StudioContentBlock title="Galleri" subtitle="Sortér, tagge og administrer billeder" icon={<ImageIcon className="h-4 w-4 text-primary" />}>
                  <SortableImageGallery
                    images={listing.images || []}
                    heroImage={listing.hero_image || ''}
                    bedroomImages={((listing as any).bedroom_images as BedroomImage[]) || []}
                    imageLabels={((listing as any).image_labels as ImageLabel[]) || []}
                    comboHeroImages={((listing as any).combo_hero_images as string[]) || []}
                    onImagesChange={imgs => update('images', imgs)}
                    onHeroChange={url => update('hero_image', url)}
                    onBedroomImagesChange={bi => update('bedroom_images' as any, bi)}
                    onImageLabelsChange={labels => update('image_labels' as any, labels)}
                    onComboHeroToggle={url => {
                      const current = ((listing as any).combo_hero_images as string[]) || [];
                      const next = current.includes(url) ? current.filter((u: string) => u !== url) : [...current, url];
                      update('combo_hero_images' as any, next);
                    }}
                  />
                </StudioContentBlock>
              </>
            )}

            {/* ═══ SOVEPLADSER & FACILITETER ═══ */}
            {currentStep === 'rooms' && (
              <>
                <div className="mb-8">
                  <h1 className="font-display text-2xl font-bold text-foreground">Sovepladser & faciliteter</h1>
                  <p className="text-sm text-muted-foreground mt-1">Komfort og faciliteter i boligen</p>
                </div>

                <StudioContentBlock title="Faciliteter" subtitle="Hvad tilbyder boligen?" icon={<Tag className="h-4 w-4 text-primary" />}>
                  <AdminFacilities
                    facilities={((listing as any).facilities as FacilityCategory[]) || []}
                    onChange={f => update('facilities' as any, f)}
                  />
                </StudioContentBlock>

                <StudioContentBlock title="Quick amenities" subtitle="Hurtige tilvalg" icon={<Check className="h-4 w-4 text-primary" />}>
                  <StudioBulletEditor items={listing.amenities || []} onChange={v => update('amenities', v)} placeholder="F.eks. WiFi, Pool, Sauna..." maxItems={30} />
                </StudioContentBlock>
              </>
            )}

            {/* ═══ BOOKINGOPLEVELSE ═══ */}
            {currentStep === 'booking' && (
              <>
                <div className="mb-8">
                  <h1 className="font-display text-2xl font-bold text-foreground">Bookingoplevelse</h1>
                  <p className="text-sm text-muted-foreground mt-1">Priser, regler og gæsteinformation</p>
                </div>

                <StudioContentBlock title="Priser" icon={<DollarSign className="h-4 w-4 text-primary" />}>
                  <div className="grid grid-cols-2 gap-5">
                    <StudioField label="Basispris pr. nat (øre)">
                      <StudioInput type="number" value={listing.base_price_per_night} onChange={v => update('base_price_per_night', parseInt(v) || 0)} />
                    </StudioField>
                    <StudioField label="Weekend-pris pr. nat">
                      <StudioInput type="number" value={listing.weekend_price_per_night || ''} onChange={v => update('weekend_price_per_night', parseInt(v) || null)} placeholder="Samme som basis" />
                    </StudioField>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <StudioField label="Rengøringsgebyr">
                      <StudioInput type="number" value={listing.cleaning_fee || 0} onChange={v => update('cleaning_fee', parseInt(v) || 0)} />
                    </StudioField>
                    <StudioField label="Depositum">
                      <StudioInput type="number" value={listing.deposit || 0} onChange={v => update('deposit', parseInt(v) || 0)} />
                    </StudioField>
                  </div>
                  <StudioField label="Minimum nætter">
                    <StudioInput type="number" value={listing.min_nights || 2} onChange={v => update('min_nights', parseInt(v) || 1)} />
                  </StudioField>
                </StudioContentBlock>

                <StudioContentBlock title="Check-in / Check-out" icon={<CalendarIcon className="h-4 w-4 text-primary" />}>
                  <div className="grid grid-cols-2 gap-5">
                    <StudioField label="Check-in tid">
                      <Input type="time" value={listing.check_in_time || '15:00'} onChange={e => update('check_in_time', e.target.value)} className="rounded-xl bg-background/50 border-border/50" />
                    </StudioField>
                    <StudioField label="Check-out tid">
                      <Input type="time" value={listing.check_out_time || '10:00'} onChange={e => update('check_out_time', e.target.value)} className="rounded-xl bg-background/50 border-border/50" />
                    </StudioField>
                  </div>
                  <StudioField label="Check-in instruktioner">
                    <StudioTextArea value={listing.checkin_info || ''} onChange={v => update('checkin_info', v)} rows={3} placeholder="Instruktioner til check-in..." />
                  </StudioField>
                  <StudioField label="Check-out instruktioner">
                    <StudioTextArea value={listing.checkout_info || ''} onChange={v => update('checkout_info', v)} rows={3} placeholder="Instruktioner til check-out..." />
                  </StudioField>
                </StudioContentBlock>

                <StudioContentBlock title="Husregler & praktisk info" icon={<FileCheck className="h-4 w-4 text-primary" />}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <StudioField label="Husregler">
                      <StudioTextArea value={listing.house_rules || ''} onChange={v => update('house_rules', v)} rows={4} placeholder="Ingen rygning, ingen fester..." />
                    </StudioField>
                    <StudioField label="Praktisk info">
                      <StudioTextArea value={listing.practical_info || ''} onChange={v => update('practical_info', v)} rows={4} placeholder="WiFi-kode, parkering..." />
                    </StudioField>
                  </div>
                </StudioContentBlock>
              </>
            )}

            {/* ═══ KONTAKT & VIDEOGUIDES ═══ */}
            {currentStep === 'contact' && (
              <>
                <div className="mb-8">
                  <h1 className="font-display text-2xl font-bold text-foreground">Kontakt & videoguides</h1>
                  <p className="text-sm text-muted-foreground mt-1">Kontaktoplysninger og guidemateriale</p>
                </div>
                <StudioContentBlock title="Videoguides" subtitle="Tilføj video-instruktioner til gæster" icon={<Play className="h-4 w-4 text-primary" />}>
                  <p className="text-sm text-muted-foreground">Videoguide-modulet kan tilgås via Listing-siden.</p>
                </StudioContentBlock>
              </>
            )}

            {/* ═══ CHANNEL REVIEW STAGES ═══ */}
            {currentStep === 'airbnb' && (
              <>
                <div className="mb-6">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Kanal-review</p>
                  <h1 className="font-display text-xl font-bold text-foreground">Airbnb</h1>
                  <p className="text-xs text-muted-foreground mt-1">Gennemgå og godkend auto-genereret indhold fra din SommerVibes-listing</p>
                </div>
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
              </>
            )}

            {currentStep === 'bookingcom' && (
              <>
                <div className="mb-6">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Kanal-review</p>
                  <h1 className="font-display text-xl font-bold text-foreground">Booking.com</h1>
                  <p className="text-xs text-muted-foreground mt-1">Gennemgå og godkend auto-genereret indhold fra din SommerVibes-listing</p>
                </div>
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
              </>
            )}

            {currentStep === 'vrbo' && (
              <>
                <div className="mb-6">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Kanal-review</p>
                  <h1 className="font-display text-xl font-bold text-foreground">Vrbo</h1>
                  <p className="text-xs text-muted-foreground mt-1">Gennemgå og godkend auto-genereret indhold fra din SommerVibes-listing</p>
                </div>
                <ChannelDataSection channelName="Vrbo" channelKey="vrbo" emoji="🏡" listing={listing}
                  onUpdate={(key, value) => update(key as any, value)} onAiFill={() => handlePrepareChannel('vrbo')} aiFilling={channelPreparing}
                  readinessScore={channelReadiness.vrbo.score} readinessPassed={channelReadiness.vrbo.passed} readinessMissing={channelReadiness.vrbo.missing}
                  fields={[
                    { key: 'channel_vrbo_title', label: 'Vrbo-titel', type: 'text', masterSource: 'Navn / Tagline', getMasterValue: () => listing.tagline || listing.name },
                    { key: 'channel_vrbo_highlights', label: 'Vrbo-highlights', type: 'tags', masterSource: 'Highlights', getMasterValue: () => listing.highlights },
                    { key: 'channel_vrbo_description', label: 'Vrbo-beskrivelse', type: 'textarea', rows: 5, masterSource: 'Lang beskrivelse', getMasterValue: () => [listing.long_description, listing.about_area].filter(Boolean).join('\n\n') || listing.description },
                    { key: 'channel_vrbo_rules', label: 'Vrbo-regler', type: 'textarea', rows: 3, masterSource: 'Husregler', getMasterValue: () => listing.house_rules },
                  ]} />
              </>
            )}

            {/* ═══ KLARGØRING & PUBLICERING ═══ */}
            {currentStep === 'publish' && (
              <>
                <div className="mb-8">
                  <h1 className="font-display text-2xl font-bold text-foreground">Klargøring & publicering</h1>
                  <p className="text-sm text-muted-foreground mt-1">Readiness og go-live</p>
                </div>

                <StudioContentBlock title="Listing Readiness" icon={<Rocket className="h-4 w-4 text-primary" />}>
                  <div className="flex items-center gap-5 mb-5">
                    <ReadinessRing score={readiness.score} size={72} strokeWidth={4} />
                    <div>
                      <h4 className="font-display font-semibold text-foreground text-lg">
                        {readiness.score === 100 ? 'Alt er klar!' : readiness.score >= 80 ? 'Næsten klar!' : readiness.score >= 50 ? 'Godt på vej' : 'Mere data mangler'}
                      </h4>
                      <p className="text-sm text-muted-foreground">{readiness.passed.length} af {readiness.passed.length + readiness.missing.length} felter udfyldt</p>
                    </div>
                  </div>
                  {readiness.passed.length > 0 && (
                    <div className="space-y-1 mb-4">
                      {readiness.passed.map(p => (
                        <div key={p} className="flex items-center gap-2 text-xs text-muted-foreground py-0.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {p}</div>
                      ))}
                    </div>
                  )}
                  {readiness.missing.length > 0 && (
                    <div className="space-y-1">
                      {readiness.missing.map(m => (
                        <div key={m} className="flex items-center gap-2 text-xs py-0.5 text-amber-500"><AlertTriangle className="h-3.5 w-3.5" /> {m}</div>
                      ))}
                    </div>
                  )}
                  {readiness.score === 100 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 mt-4">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <p className="text-sm font-medium" style={{ color: 'hsl(142, 71%, 45%)' }}>Alle felter er udfyldt — listingen er klar til at gå live!</p>
                    </div>
                  )}
                </StudioContentBlock>

                <StudioContentBlock title="Kanal readiness" icon={<Globe className="h-4 w-4 text-primary" />}>
                  <div className="grid grid-cols-3 gap-4">
                    {(['airbnb', 'booking', 'vrbo'] as const).map(ch => (
                      <button key={ch} onClick={() => setCurrentStep(ch === 'booking' ? 'bookingcom' : ch)}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <ReadinessRing score={channelReadiness[ch].score} size={48} strokeWidth={3} />
                        <p className="text-xs font-semibold">{ch === 'airbnb' ? '🏠 Airbnb' : ch === 'booking' ? '🅱️ Booking' : '🏡 Vrbo'}</p>
                        <p className="text-[10px] text-muted-foreground">{channelReadiness[ch].missing.length} mangler</p>
                      </button>
                    ))}
                  </div>
                </StudioContentBlock>

                <StudioContentBlock title="Systeminfo" icon={<Settings className="h-4 w-4 text-primary" />}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
                    <div><span className="font-medium text-foreground block mb-0.5">Slug</span>{listing.slug}</div>
                    <div><span className="font-medium text-foreground block mb-0.5">ID</span><code className="font-mono text-[10px]">{listing.id}</code></div>
                    <div><span className="font-medium text-foreground block mb-0.5">Owner ID</span><code className="font-mono text-[10px]">{listing.owner_id}</code></div>
                  </div>
                </StudioContentBlock>
              </>
            )}

            {/* ═══ AKTØRER ═══ */}
            {currentStep === 'actors' && (
              <>
                <div className="mb-8">
                  <h1 className="font-display text-2xl font-bold text-foreground">Aktører</h1>
                  <p className="text-sm text-muted-foreground mt-1">Ejer, kontaktpersoner og sekundære aktører</p>
                </div>
                <ListingActorsTab listingId={listing.id} ownerId={listing.owner_id} />
              </>
            )}

            {/* ═══ MEDARBEJDERE ═══ */}
            {currentStep === 'staff' && (
              <>
                <div className="mb-8">
                  <h1 className="font-display text-2xl font-bold text-foreground">Medarbejdere</h1>
                  <p className="text-sm text-muted-foreground mt-1">Tildelte medarbejdere til denne sag</p>
                </div>
                <ListingStaffTab listingId={listing.id} />
              </>
            )}

            {/* ═══ DOKUMENTER ═══ */}
            {currentStep === 'documents' && (
              <>
                <div className="mb-8">
                  <h1 className="font-display text-2xl font-bold text-foreground">Dokumenter</h1>
                  <p className="text-sm text-muted-foreground mt-1">Sagens dokumenter og formularer</p>
                </div>
                <ListingDocumentsTab listingId={listing.id} ownerId={listing.owner_id} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      <StudioPreview listing={listing} open={previewOpen} onClose={() => setPreviewOpen(false)} />

      {/* AI Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={v => { if (!aiImproving) setAiDialogOpen(v); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl">
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
              {Object.entries(aiPreview).filter(([k]) => !k.startsWith('_')).map(([key, val]) => (
                <div key={key} className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                  {Array.isArray(val) ? (
                    <div className="flex flex-wrap gap-1.5">{(val as string[]).map((v, i) => <Badge key={i} variant="outline" className="text-xs">{v}</Badge>)}</div>
                  ) : (
                    <p className="text-sm text-foreground whitespace-pre-line bg-muted/30 rounded-lg p-3">{String(val)}</p>
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => { setAiDialogOpen(false); setAiPreview(null); }} className="flex-1 rounded-xl">Kassér</Button>
                <Button onClick={applyAiSuggestions} className="flex-1 rounded-xl gap-1.5"><Check className="h-4 w-4" />Anvend</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
