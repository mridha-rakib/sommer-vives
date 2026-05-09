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
  ChevronRight, Monitor, PanelRightClose, Lock, Car, Coffee, Package, MessageSquare,
  Trash2, GripVertical, Sofa, Wifi, Award, ExternalLink, Search
} from 'lucide-react';

// Studio modules
import { StudioContentBlock, StudioField, StudioTextArea, StudioInput, StudioBulletEditor, StudioAIButton } from './studio/StudioContentBlock';
import { StudioStepNav, type StudioStep } from './studio/StudioStepNav';
import { StudioPreview } from './studio/StudioPreview';

// Existing components
import { ListingCalendarPricing } from './ListingCalendarPricing';
import { ChannelDataSection } from './ChannelDataSection';
import { getChannelFields } from '@/lib/channel-mapping';
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
  min_nights: number | null; max_nights: number | null; deposit: number | null;
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
  updated_at: string; teaser: string | null;
  location_title: string | null; location_description: string | null; getting_around: string | null;
  location_map_image: string | null; location_mood_image: string | null;
  video_url: string | null; video_url_en: string | null; video_url_de: string | null;
  combo_hero_images: string[] | null; floor_plan_images: string[] | null;
  draft_content: any; published_at: string | null; revision_history: any;
  latitude: number | null; longitude: number | null; country: string | null;
  // New detailed section fields
  intro_title: string | null; intro_paragraph_1: string | null; intro_paragraph_2: string | null;
  intro_features: any[];
  property_bullets: string[] | null;
  comfort_title: string | null; comfort_intro: string | null; comfort_blocks: any[];
  access_title: string | null; access_intro: string | null;
  access_smart_lock: string | null; access_code: string | null;
  access_parking: string | null; access_arrival: string | null;
  included_title: string | null; included_intro: string | null;
  included_items: string[] | null; bring_yourself_items: string[] | null; purchasable_items: string[] | null;
  extras_title: string | null; extras_intro: string | null;
  extras_upsell_items: string[] | null; extras_pricing_notes: string | null;
  bedroom_cards: any[];
  highlighted_amenities: string[] | null; amenities_button_text: string | null;
  area_title: string | null; area_distances: any[]; area_attractions: any[]; area_image: string | null;
  reviews_title: string | null; reviews_rating: number | null; reviews_count: number | null;
  reviews_badges: string[] | null; reviews_entries: any[];
  contact_title: string | null; contact_name: string | null; contact_role: string | null;
  contact_image: string | null; contact_text: string | null;
  contact_email: string | null; contact_phone: string | null;
  contact_cta_primary: string | null; contact_cta_secondary: string | null;
  sticky_bar_logo: string | null; sticky_bar_price_label: string | null;
  sticky_bar_cta: string | null; sticky_bar_payment_icons: string[] | null;
  hero_rating: number | null; hero_review_count: number | null;
  hero_booking_cta: string | null; hero_booking_subtext: string | null;
  hero_rarity_badge: string | null; hero_clickbait_title: string | null;
  hero_hook_description: string | null; hero_extra_note: string | null;
  seo_title: string | null; seo_description: string | null; seo_image: string | null;
  image_channel_visibility: Record<string, any> | null;
  video_button_text: string | null; floorplan_button_text: string | null;
  contact_button_text: string | null; internal_notes: string | null;
  extra_sections: any; facilities: any; bedroom_images: any; image_labels: any;
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
  { id: 'setup', label: 'Grundopsætning', icon: Settings, description: 'Kernedata, slug, status' },
  { id: 'hero', label: 'Hero & top', icon: Star, description: 'Cover, CTA, rating, badges' },
  { id: 'intro', label: 'Intro', icon: FileText, description: 'Titel, intro-tekst, feature-points' },
  { id: 'property', label: 'Boligen', icon: Home, description: 'Beskrivelse, bullets, galleri' },
  { id: 'highlights', label: 'Højdepunkter', icon: Award, description: 'Highlight-kort og billeder' },
  { id: 'comfort', label: 'Komfort & faciliteter', icon: Sofa, description: 'Tekst, blokke, faciliteter' },
  { id: 'access', label: 'Ankomst & adgang', icon: Lock, description: 'Smart lock, parkering, ankomst' },
  { id: 'included', label: 'Inkluderet i ophold', icon: Package, description: 'Inkl., medbring, tilkøb' },
  { id: 'extras', label: 'Ekstra muligheder', icon: ShoppingBag, description: 'Upsell og priser' },
  { id: 'bedrooms', label: 'Sovepladser', icon: Bed, description: 'Soveværelse-kort med detaljer' },
  { id: 'amenities', label: 'Faciliteter', icon: Wifi, description: 'Highlighted + fuld liste' },
  { id: 'area', label: 'Området', icon: MapPin, description: 'Lokation, afstande, attraktioner' },
  { id: 'reviews', label: 'Anmeldelser', icon: MessageSquare, description: 'Rating, badges, reviews' },
  { id: 'videos', label: 'Videoguides', icon: Play, description: 'Video-kort og guides' },
  { id: 'contact', label: 'Kontakt', icon: Phone, description: 'Vært, CTA, kontaktinfo' },
  { id: 'stickybar', label: 'Sticky booking bar', icon: Monitor, description: 'Logo, CTA, betalingsikoner' },
  { id: 'media', label: 'Medier', icon: Camera, description: 'Billedgalleri og uploads' },
  { id: 'publish', label: 'Publicering', icon: Rocket, description: 'SEO, status, preview, kanaler' },
  { id: 'airbnb', label: 'Airbnb', icon: Home, description: 'Airbnb-kanal review' },
  { id: 'bookingcom', label: 'Booking.com', icon: Globe, description: 'Booking.com review' },
  { id: 'vrbo', label: 'Vrbo', icon: MapPin, description: 'Vrbo review' },
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
    ['Soveværelser', (f.bedrooms || 0) > 0, 'bedrooms', 'Angiv antal soveværelser'],
    ['Basispris', (f.base_price_per_night || 0) > 0, 'hero', 'Sæt en basispris'],
    ['Check-in tid', !!f.check_in_time, 'access', 'Angiv check-in tid'],
    ['Check-out tid', !!f.check_out_time, 'access', 'Angiv check-out tid'],
    ['Faciliteter (3+)', (f.amenities?.length || 0) >= 3, 'amenities', 'Tilføj faciliteter'],
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

// ── Repeatable card helpers ──
function BedroomCardEditor({ cards, onChange }: { cards: any[]; onChange: (c: any[]) => void }) {
  const addCard = () => onChange([...cards, { title: '', description: '', bed_count: 1, bed_types: '', gallery: [], label: '' }]);
  const updateCard = (i: number, key: string, val: any) => {
    const next = [...cards]; next[i] = { ...next[i], [key]: val }; onChange(next);
  };
  const removeCard = (i: number) => onChange(cards.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      {cards.map((card, i) => (
        <div key={i} className="rounded-xl border border-border/40 bg-muted/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Soveværelse {i + 1}</span>
            <button onClick={() => removeCard(i)} className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StudioField label="Rum-titel">
              <StudioInput value={card.title || ''} onChange={v => updateCard(i, 'title', v)} placeholder="Hovedsoveværelse" />
            </StudioField>
            <StudioField label="Label / badge">
              <StudioInput value={card.label || ''} onChange={v => updateCard(i, 'label', v)} placeholder="Master suite" />
            </StudioField>
          </div>
          <StudioField label="Kort beskrivelse">
            <StudioTextArea value={card.description || ''} onChange={v => updateCard(i, 'description', v)} rows={2} placeholder="Rummeligt soveværelse med..." />
          </StudioField>
          <div className="grid grid-cols-2 gap-3">
            <StudioField label="Antal senge">
              <StudioInput type="number" value={card.bed_count || 1} onChange={v => updateCard(i, 'bed_count', parseInt(v) || 1)} />
            </StudioField>
            <StudioField label="Sengetyper">
              <StudioInput value={card.bed_types || ''} onChange={v => updateCard(i, 'bed_types', v)} placeholder="1 dobbeltseng, 1 enkeltseng" />
            </StudioField>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addCard} className="gap-1.5 rounded-xl text-xs">
        <Plus className="h-3 w-3" /> Tilføj soveværelse
      </Button>
    </div>
  );
}

function ReviewEntryEditor({ entries, onChange }: { entries: any[]; onChange: (e: any[]) => void }) {
  const addEntry = () => onChange([...entries, { name: '', location: '', date: '', text: '', rating: 5, active: true }]);
  const updateEntry = (i: number, key: string, val: any) => {
    const next = [...entries]; next[i] = { ...next[i], [key]: val }; onChange(next);
  };
  const removeEntry = (i: number) => onChange(entries.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      {entries.map((entry, i) => (
        <div key={i} className="rounded-xl border border-border/40 bg-muted/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Anmeldelse {i + 1}</span>
            <div className="flex items-center gap-2">
              <Switch checked={entry.active !== false} onCheckedChange={v => updateEntry(i, 'active', v)} />
              <button onClick={() => removeEntry(i)} className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StudioField label="Navn">
              <StudioInput value={entry.name || ''} onChange={v => updateEntry(i, 'name', v)} placeholder="Anna" />
            </StudioField>
            <StudioField label="Lokation">
              <StudioInput value={entry.location || ''} onChange={v => updateEntry(i, 'location', v)} placeholder="København" />
            </StudioField>
            <StudioField label="Dato">
              <StudioInput value={entry.date || ''} onChange={v => updateEntry(i, 'date', v)} placeholder="August 2025" />
            </StudioField>
          </div>
          <StudioField label="Anmeldelses-tekst">
            <StudioTextArea value={entry.text || ''} onChange={v => updateEntry(i, 'text', v)} rows={2} />
          </StudioField>
          <StudioField label="Rating (1-5)">
            <StudioInput type="number" value={entry.rating || 5} onChange={v => updateEntry(i, 'rating', Math.min(5, Math.max(1, parseInt(v) || 5)))} />
          </StudioField>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addEntry} className="gap-1.5 rounded-xl text-xs">
        <Plus className="h-3 w-3" /> Tilføj anmeldelse
      </Button>
    </div>
  );
}

function JsonPairEditor({ items, onChange, labelA, labelB, placeholderA, placeholderB }: {
  items: any[]; onChange: (i: any[]) => void; labelA: string; labelB: string; placeholderA?: string; placeholderB?: string;
}) {
  const add = () => onChange([...items, { label: '', value: '' }]);
  const upd = (i: number, key: string, val: string) => { const n = [...items]; n[i] = { ...n[i], [key]: val }; onChange(n); };
  const rem = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <StudioInput value={item.label || ''} onChange={v => upd(i, 'label', v)} placeholder={placeholderA} className="flex-1" />
          <StudioInput value={item.value || ''} onChange={v => upd(i, 'value', v)} placeholder={placeholderB} className="flex-1" />
          <button onClick={() => rem(i)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0 mt-0.5"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="gap-1.5 rounded-xl text-xs"><Plus className="h-3 w-3" /> Tilføj</Button>
    </div>
  );
}

function IntroFeatureEditor({ features, onChange }: { features: any[]; onChange: (f: any[]) => void }) {
  const add = () => onChange([...features, { icon: '✨', title: '', text: '' }]);
  const upd = (i: number, key: string, val: string) => { const n = [...features]; n[i] = { ...n[i], [key]: val }; onChange(n); };
  const rem = (i: number) => onChange(features.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-3">
      {features.map((f, i) => (
        <div key={i} className="flex gap-3 items-start rounded-xl border border-border/30 bg-muted/5 p-3">
          <StudioInput value={f.icon || '✨'} onChange={v => upd(i, 'icon', v)} className="w-16 text-center" />
          <div className="flex-1 space-y-2">
            <StudioInput value={f.title || ''} onChange={v => upd(i, 'title', v)} placeholder="Feature titel" />
            <StudioTextArea value={f.text || ''} onChange={v => upd(i, 'text', v)} rows={2} placeholder="Kort beskrivelse" />
          </div>
          <button onClick={() => rem(i)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="gap-1.5 rounded-xl text-xs"><Plus className="h-3 w-3" /> Tilføj feature point</Button>
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
    if (listing.hero_image && listing.hero_clickbait_title) completed.push('hero');
    if (listing.intro_title && listing.intro_paragraph_1) completed.push('intro');
    if (listing.description && listing.long_description) completed.push('property');
    if ((listing.highlights?.length || 0) >= 2) completed.push('highlights');
    if ((listing.amenities?.length || 0) >= 3) completed.push('comfort', 'amenities');
    if (listing.access_arrival || listing.checkin_info) completed.push('access');
    if ((listing.included_items?.length || 0) > 0) completed.push('included');
    if ((listing.bedroom_cards?.length || 0) > 0) completed.push('bedrooms');
    if (listing.about_area || listing.location_description) completed.push('area');
    if ((listing.reviews_entries?.length || 0) > 0) completed.push('reviews');
    if (listing.contact_name) completed.push('contact');
    if ((listing.images?.length || 0) >= 3 && listing.hero_image) completed.push('media');
    if (listing.base_price_per_night > 0 && listing.check_in_time) completed.push('stickybar');
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
    // Build update payload - only send fields that exist in DB
    const payload: Record<string, any> = {
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
      max_nights: listing.max_nights, deposit: listing.deposit,
      channel_airbnb_ready: listing.channel_airbnb_ready,
      channel_booking_ready: listing.channel_booking_ready, channel_vrbo_ready: listing.channel_vrbo_ready,
      channel_airbnb_title: listing.channel_airbnb_title, channel_booking_title: listing.channel_booking_title,
      channel_vrbo_title: listing.channel_vrbo_title, channel_airbnb_description: listing.channel_airbnb_description,
      channel_booking_description: listing.channel_booking_description,
      channel_vrbo_description: listing.channel_vrbo_description,
      channel_airbnb_highlights: listing.channel_airbnb_highlights,
      channel_airbnb_house_rules: listing.channel_airbnb_house_rules,
      channel_airbnb_checkin_notes: listing.channel_airbnb_checkin_notes,
      channel_booking_room_setup: listing.channel_booking_room_setup,
      channel_booking_policies: listing.channel_booking_policies,
      channel_booking_checkin_checkout: listing.channel_booking_checkin_checkout,
      channel_vrbo_highlights: listing.channel_vrbo_highlights,
      channel_vrbo_rules: listing.channel_vrbo_rules,
      readiness_score: score, internal_status: listing.internal_status,
      checkin_info: listing.checkin_info, checkout_info: listing.checkout_info,
      image_captions: listing.image_captions,
      teaser: listing.teaser, location_title: listing.location_title,
      location_description: listing.location_description, getting_around: listing.getting_around,
      location_map_image: listing.location_map_image, location_mood_image: listing.location_mood_image,
      video_url: listing.video_url, video_url_en: listing.video_url_en, video_url_de: listing.video_url_de,
      combo_hero_images: listing.combo_hero_images, floor_plan_images: listing.floor_plan_images,
      extra_sections: listing.extra_sections, facilities: listing.facilities,
      bedroom_images: listing.bedroom_images, image_labels: listing.image_labels,
      // New section fields
      intro_title: listing.intro_title, intro_paragraph_1: listing.intro_paragraph_1,
      intro_paragraph_2: listing.intro_paragraph_2, intro_features: listing.intro_features,
      property_bullets: listing.property_bullets,
      comfort_title: listing.comfort_title, comfort_intro: listing.comfort_intro, comfort_blocks: listing.comfort_blocks,
      access_title: listing.access_title, access_intro: listing.access_intro,
      access_smart_lock: listing.access_smart_lock, access_code: listing.access_code,
      access_parking: listing.access_parking, access_arrival: listing.access_arrival,
      included_title: listing.included_title, included_intro: listing.included_intro,
      included_items: listing.included_items, bring_yourself_items: listing.bring_yourself_items,
      purchasable_items: listing.purchasable_items,
      extras_title: listing.extras_title, extras_intro: listing.extras_intro,
      extras_upsell_items: listing.extras_upsell_items, extras_pricing_notes: listing.extras_pricing_notes,
      bedroom_cards: listing.bedroom_cards,
      highlighted_amenities: listing.highlighted_amenities, amenities_button_text: listing.amenities_button_text,
      area_title: listing.area_title, area_distances: listing.area_distances,
      area_attractions: listing.area_attractions, area_image: listing.area_image,
      reviews_title: listing.reviews_title, reviews_rating: listing.reviews_rating,
      reviews_count: listing.reviews_count, reviews_badges: listing.reviews_badges,
      reviews_entries: listing.reviews_entries,
      contact_title: listing.contact_title, contact_name: listing.contact_name,
      contact_role: listing.contact_role, contact_image: listing.contact_image,
      contact_text: listing.contact_text, contact_email: listing.contact_email,
      contact_phone: listing.contact_phone, contact_cta_primary: listing.contact_cta_primary,
      contact_cta_secondary: listing.contact_cta_secondary,
      sticky_bar_logo: listing.sticky_bar_logo, sticky_bar_price_label: listing.sticky_bar_price_label,
      sticky_bar_cta: listing.sticky_bar_cta, sticky_bar_payment_icons: listing.sticky_bar_payment_icons,
      hero_rating: listing.hero_rating, hero_review_count: listing.hero_review_count,
      hero_booking_cta: listing.hero_booking_cta, hero_booking_subtext: listing.hero_booking_subtext,
      hero_rarity_badge: listing.hero_rarity_badge, hero_clickbait_title: listing.hero_clickbait_title,
      hero_hook_description: listing.hero_hook_description, hero_extra_note: listing.hero_extra_note,
      seo_title: listing.seo_title, seo_description: listing.seo_description, seo_image: listing.seo_image,
      image_channel_visibility: listing.image_channel_visibility,
      video_button_text: listing.video_button_text, floorplan_button_text: listing.floorplan_button_text,
      contact_button_text: listing.contact_button_text, internal_notes: listing.internal_notes,
    };
    const { error } = await supabase.from('listings').update(payload as any).eq('id', listing.id);
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
        const { data, error } = await supabase.functions.invoke('improve-listing-text', { body: { listing, action: 'channel_airbnb' } });
        if (!error && data?.improved) {
          if (data.improved.title) update('channel_airbnb_title', data.improved.title);
          if (data.improved.description) update('channel_airbnb_description', data.improved.description);
          if (data.improved.highlights) update('channel_airbnb_highlights', data.improved.highlights);
          if (data.improved.house_rules) update('channel_airbnb_house_rules', data.improved.house_rules);
          if (data.improved.checkin_notes) update('channel_airbnb_checkin_notes', data.improved.checkin_notes);
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

  // Section header helper
  const SectionHeader = ({ title, subtitle, badge }: { title: string; subtitle: string; badge?: string }) => (
    <div className="mb-8">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">SommerVibes Listing Studio</p>
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
        {badge && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{badge}</Badge>}
      </div>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-7rem)] -mt-5 md:-mt-8 -mx-5 md:-mx-8">
      {/* ── Left: Step Navigation ── */}
      <div className={cn(
        'border-r border-border/30 bg-card/30 backdrop-blur-sm shrink-0 flex flex-col transition-all duration-300',
        sideNavCollapsed ? 'w-[52px]' : 'w-[220px]'
      )}>
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

            {/* ═══ 1. GRUNDOPSÆTNING ═══ */}
            {currentStep === 'setup' && (
              <>
                <SectionHeader title="Grundopsætning" subtitle="Kerneoplysninger, identitet og status" badge="Trin 1" />

                <StudioContentBlock title="Bolig identitet" icon={<Home className="h-4 w-4 text-primary" />}>
                  <div className="grid grid-cols-2 gap-5">
                    <StudioField label="Internt sagsnavn" hint="Bruges internt til at identificere sagen">
                      <StudioInput value={listing.name} onChange={v => update('name', v)} />
                    </StudioField>
                    <StudioField label="Offentligt bolig-navn" hint="Det navn gæsten ser på SommerVibes">
                      <StudioInput value={listing.tagline || ''} onChange={v => update('tagline', v)} placeholder="Strandperlen i Hornbæk" />
                    </StudioField>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <StudioField label="Slug (URL-sti)">
                      <StudioInput value={listing.slug} onChange={v => update('slug' as any, v)} placeholder="strandperlen-hornbaek" />
                    </StudioField>
                    <StudioField label="Boligtype">
                      <Select value={listing.property_type || 'summerhouse'} onValueChange={v => update('property_type', v)}>
                        <SelectTrigger className="rounded-xl bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                        <SelectContent>{PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </StudioField>
                  </div>
                </StudioContentBlock>

                <StudioContentBlock title="Lokation" icon={<MapPin className="h-4 w-4 text-primary" />}>
                  <StudioField label="Adresse">
                    <StudioInput value={listing.address || ''} onChange={v => update('address', v)} placeholder="Skovvej 12, 4573 Højby" />
                  </StudioField>
                  <div className="grid grid-cols-3 gap-5">
                    <StudioField label="By">
                      <StudioInput value={listing.city || ''} onChange={v => update('city' as any, v)} placeholder="Hornbæk" />
                    </StudioField>
                    <StudioField label="Region">
                      <StudioInput value={listing.region || ''} onChange={v => update('region', v)} placeholder="Nordsjælland" />
                    </StudioField>
                    <StudioField label="Land">
                      <StudioInput value={listing.country || 'Danmark'} onChange={v => update('country' as any, v)} />
                    </StudioField>
                  </div>
                </StudioContentBlock>

                <StudioContentBlock title="Ejer & status" icon={<Users className="h-4 w-4 text-primary" />}>
                  <div className="grid grid-cols-3 gap-5">
                    <StudioField label="Owner ID">
                      <code className="text-[10px] font-mono text-muted-foreground bg-muted/20 px-2 py-1.5 rounded-lg block truncate">{listing.owner_id}</code>
                    </StudioField>
                    <StudioField label="Status">
                      <Select value={listing.internal_status || 'draft'} onValueChange={v => update('internal_status', v)}>
                        <SelectTrigger className="rounded-xl bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </StudioField>
                    <StudioField label="m²">
                      <StudioInput type="number" value={listing.sqm || ''} onChange={v => update('sqm', parseInt(v) || null)} placeholder="120" />
                    </StudioField>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Switch checked={listing.is_active} onCheckedChange={v => update('is_active', v)} />
                    <Label className="text-sm font-medium">Aktiv listing</Label>
                  </div>
                </StudioContentBlock>

                <StudioContentBlock title="Intern note" icon={<StickyNote className="h-4 w-4 text-primary" />}>
                  <StudioTextArea value={listing.internal_notes || ''} onChange={v => update('internal_notes', v)} rows={3} placeholder="Interne noter om denne listing..." />
                </StudioContentBlock>
              </>
            )}

            {/* ═══ 2. HERO / TOP SECTION ═══ */}
            {currentStep === 'hero' && (
              <>
                <SectionHeader title="Hero & top section" subtitle="Cover, CTA, rating og den første visuelle oplevelse" badge="Trin 2" />

                <StudioContentBlock title="Cover & medier" icon={<Camera className="h-4 w-4 text-primary" />}>
                  <div className="grid grid-cols-2 gap-5">
                    <StudioField label="Cover-billede (hero)" hint="Hovedbilledet øverst på listingen">
                      <div className="text-xs text-muted-foreground">
                        {listing.hero_image ? (
                          <div className="rounded-xl overflow-hidden border border-border/30 aspect-video bg-muted/10">
                            <img src={listing.hero_image} alt="Hero" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <p className="text-amber-500">⚠ Intet hero valgt — vælg i Medier-fanen</p>
                        )}
                      </div>
                    </StudioField>
                    <div className="space-y-4">
                      <StudioField label="Video knap-tekst">
                        <StudioInput value={listing.video_button_text || 'Se video'} onChange={v => update('video_button_text', v)} />
                      </StudioField>
                      <StudioField label="Plantegning knap-tekst">
                        <StudioInput value={listing.floorplan_button_text || 'Se plantegning'} onChange={v => update('floorplan_button_text', v)} />
                      </StudioField>
                      <StudioField label="Kontakt knap-tekst">
                        <StudioInput value={listing.contact_button_text || 'Kontakt vært'} onChange={v => update('contact_button_text', v)} />
                      </StudioField>
                    </div>
                  </div>
                </StudioContentBlock>

                <StudioContentBlock title="Rating & social proof" icon={<Star className="h-4 w-4 text-primary" />}>
                  <div className="grid grid-cols-3 gap-5">
                    <StudioField label="Rating">
                      <StudioInput type="number" value={listing.hero_rating || ''} onChange={v => update('hero_rating', parseFloat(v) || null)} placeholder="4.9" />
                    </StudioField>
                    <StudioField label="Antal anmeldelser">
                      <StudioInput type="number" value={listing.hero_review_count || ''} onChange={v => update('hero_review_count', parseInt(v) || null)} placeholder="47" />
                    </StudioField>
                    <StudioField label="Rarity / badge label" hint="F.eks. 'Sjælden perle'">
                      <StudioInput value={listing.hero_rarity_badge || ''} onChange={v => update('hero_rarity_badge', v)} placeholder="Sjælden perle" />
                    </StudioField>
                  </div>
                </StudioContentBlock>

                <StudioContentBlock title="Booking CTA" icon={<Rocket className="h-4 w-4 text-primary" />}>
                  <div className="grid grid-cols-2 gap-5">
                    <StudioField label="Pris pr. nat">
                      <StudioInput type="number" value={listing.base_price_per_night} onChange={v => update('base_price_per_night', parseInt(v) || 0)} />
                    </StudioField>
                    <StudioField label="Valuta">
                      <StudioInput value={listing.currency} onChange={v => update('currency', v)} />
                    </StudioField>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <StudioField label="Booking CTA tekst">
                      <StudioInput value={listing.hero_booking_cta || 'Book denne bolig'} onChange={v => update('hero_booking_cta', v)} />
                    </StudioField>
                    <StudioField label="Booking undertekst">
                      <StudioInput value={listing.hero_booking_subtext || ''} onChange={v => update('hero_booking_subtext', v)} placeholder="Gratis afbestilling i 48 timer" />
                    </StudioField>
                  </div>
                </StudioContentBlock>

                <StudioContentBlock title="Clickbait & hook" icon={<Sparkles className="h-4 w-4 text-primary" />}
                  actions={<StudioAIButton label="AI Titel" onClick={() => handleAiAction('improve_title')} loading={aiImproving} />}>
                  <StudioField label="Clickbait titel" hint="Den store titel øverst">
                    <StudioInput value={listing.hero_clickbait_title || ''} onChange={v => update('hero_clickbait_title', v)} placeholder="Dit drømmesommerhus ved havet" />
                  </StudioField>
                  <StudioField label="Kort hook beskrivelse" hint="1-2 sætninger under titlen">
                    <StudioTextArea value={listing.hero_hook_description || ''} onChange={v => update('hero_hook_description', v)} rows={2} placeholder="Vågn op til lyden af bølgerne..." />
                  </StudioField>
                </StudioContentBlock>

                <StudioContentBlock title="Fakta-chips" icon={<Info className="h-4 w-4 text-primary" />}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                    <StudioField label="3 highlights">
                      <StudioBulletEditor items={(listing.highlights || []).slice(0, 3)} onChange={v => update('highlights', v)} maxItems={3} placeholder="F.eks. Havudsigt" />
                    </StudioField>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <StudioField label="Max gæster">
                      <StudioInput type="number" value={listing.max_guests} onChange={v => update('max_guests', parseInt(v) || 1)} />
                    </StudioField>
                    <StudioField label="Soveværelser">
                      <StudioInput type="number" value={listing.bedrooms || 0} onChange={v => update('bedrooms', parseInt(v) || 0)} />
                    </StudioField>
                    <StudioField label="Badeværelser">
                      <StudioInput type="number" value={listing.bathrooms || 0} onChange={v => update('bathrooms', parseInt(v) || 0)} />
                    </StudioField>
                    <StudioField label="m²">
                      <StudioInput type="number" value={listing.sqm || ''} onChange={v => update('sqm', parseInt(v) || null)} />
                    </StudioField>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <StudioField label="Check-in tid">
                      <Input type="time" value={listing.check_in_time || '15:00'} onChange={e => update('check_in_time', e.target.value)} className="rounded-xl bg-background/50 border-border/50" />
                    </StudioField>
                    <StudioField label="Check-out tid">
                      <Input type="time" value={listing.check_out_time || '10:00'} onChange={e => update('check_out_time', e.target.value)} className="rounded-xl bg-background/50 border-border/50" />
                    </StudioField>
                  </div>
                  <StudioField label="Ekstra note" hint="Vises under fakta-chips">
                    <StudioInput value={listing.hero_extra_note || ''} onChange={v => update('hero_extra_note', v)} placeholder="Inkl. slutrengøring" />
                  </StudioField>
                </StudioContentBlock>
              </>
            )}

            {/* ═══ 3. INTRO SECTION ═══ */}
            {currentStep === 'intro' && (
              <>
                <SectionHeader title="Intro-sektion" subtitle="Titel, introduktions-tekst og 3 feature-points" badge="Trin 3" />

                <StudioContentBlock title="Intro-indhold" icon={<FileText className="h-4 w-4 text-primary" />}
                  actions={<StudioAIButton label="AI Beskrivelse" onClick={() => handleAiAction('improve_description')} loading={aiImproving} />}>
                  <StudioField label="Intro-titel">
                    <StudioInput value={listing.intro_title || ''} onChange={v => update('intro_title', v)} placeholder="Velkommen til dit private paradis" />
                  </StudioField>
                  <StudioField label="Afsnit 1">
                    <StudioTextArea value={listing.intro_paragraph_1 || ''} onChange={v => update('intro_paragraph_1', v)} rows={4} placeholder="Første afsnit af intro-teksten..." />
                  </StudioField>
                  <StudioField label="Afsnit 2">
                    <StudioTextArea value={listing.intro_paragraph_2 || ''} onChange={v => update('intro_paragraph_2', v)} rows={4} placeholder="Andet afsnit..." />
                  </StudioField>
                </StudioContentBlock>

                <StudioContentBlock title="3 feature-points" subtitle="Ikon + titel + tekst" icon={<Award className="h-4 w-4 text-primary" />}>
                  <IntroFeatureEditor features={listing.intro_features || []} onChange={v => update('intro_features', v)} />
                </StudioContentBlock>
              </>
            )}

            {/* ═══ 4. BOLIGEN ═══ */}
            {currentStep === 'property' && (
              <>
                <SectionHeader title="Boligen" subtitle="Detaljeret beskrivelse af selve boligen" badge="Trin 4" />

                <StudioContentBlock title="Boligbeskrivelse" icon={<Home className="h-4 w-4 text-primary" />}
                  actions={<StudioAIButton label="AI Beskrivelse" onClick={() => handleAiAction('improve_long_description')} loading={aiImproving} />}>
                  <StudioField label="Kort beskrivelse" hint="Vises i søgeresultater og listing-kort">
                    <StudioTextArea value={listing.description || ''} onChange={v => update('description', v)} rows={3} placeholder="Kort, fængende beskrivelse..." />
                  </StudioField>
                  <StudioField label="Intro-tekst">
                    <StudioTextArea value={listing.about_property || ''} onChange={v => update('about_property', v)} rows={4} placeholder="Boligen er bygget i..." />
                  </StudioField>
                  <StudioField label="Lang beskrivelse">
                    <StudioTextArea value={listing.long_description || ''} onChange={v => update('long_description', v)} rows={6} placeholder="Detaljeret beskrivelse af boligen..." />
                  </StudioField>
                </StudioContentBlock>

                <StudioContentBlock title="Bullet-points" subtitle="Korte fakta om boligen" icon={<ClipboardCheck className="h-4 w-4 text-primary" />}>
                  <StudioBulletEditor items={listing.property_bullets || []} onChange={v => update('property_bullets', v)} placeholder="F.eks. 120 m² boligareal" maxItems={15} />
                </StudioContentBlock>
              </>
            )}

            {/* ═══ 5. HØJDEPUNKTER ═══ */}
            {currentStep === 'highlights' && (
              <>
                <SectionHeader title="Højdepunkter" subtitle="De oplevelser der skiller boligen ud" badge="Trin 5" />

                <StudioContentBlock title="Highlight-liste" icon={<Star className="h-4 w-4 text-primary" />}
                  actions={<StudioAIButton label="AI Highlights" onClick={() => handleAiAction('generate_highlights')} loading={aiImproving} />}>
                  <StudioField label="Teaser-tekst" hint="Kort intro over highlights">
                    <StudioTextArea value={listing.teaser || ''} onChange={v => update('teaser', v)} rows={2} placeholder="Det bedste ved denne bolig..." />
                  </StudioField>
                  <StudioBulletEditor items={listing.highlights || []} onChange={v => update('highlights', v)} placeholder="F.eks. Havudsigt, Nyistandsat sauna, Privat strand..." maxItems={10} />
                </StudioContentBlock>
              </>
            )}

            {/* ═══ 6. KOMFORT & FACILITETER ═══ */}
            {currentStep === 'comfort' && (
              <>
                <SectionHeader title="Komfort og faciliteter" subtitle="Tekst og beskrivelser af komfort" badge="Trin 6" />

                <StudioContentBlock title="Komfort-sektion" icon={<Sofa className="h-4 w-4 text-primary" />}>
                  <StudioField label="Sektionstitel">
                    <StudioInput value={listing.comfort_title || ''} onChange={v => update('comfort_title', v)} placeholder="Komfort i verdensklasse" />
                  </StudioField>
                  <StudioField label="Intro-tekst">
                    <StudioTextArea value={listing.comfort_intro || ''} onChange={v => update('comfort_intro', v)} rows={3} placeholder="Vi har tænkt på alt..." />
                  </StudioField>
                </StudioContentBlock>

                <StudioContentBlock title="Ekstra sektioner" subtitle="Tilføj egne indholdsblokke" icon={<Layers className="h-4 w-4 text-primary" />}>
                  <AdminSectionEditor
                    sections={(listing.extra_sections as ExtraSection[]) || []}
                    onChange={s => update('extra_sections' as any, s)}
                    listingSlug={listing.slug}
                  />
                </StudioContentBlock>
              </>
            )}

            {/* ═══ 7. GÆSTEADGANG & ANKOMST ═══ */}
            {currentStep === 'access' && (
              <>
                <SectionHeader title="Gæsteadgang og ankomst" subtitle="Smart lock, parkering og ankomstinstruktioner" badge="Trin 7" />

                <StudioContentBlock title="Adgang" icon={<Lock className="h-4 w-4 text-primary" />}>
                  <StudioField label="Sektionstitel">
                    <StudioInput value={listing.access_title || ''} onChange={v => update('access_title', v)} placeholder="Sådan kommer du ind" />
                  </StudioField>
                  <StudioField label="Intro-tekst">
                    <StudioTextArea value={listing.access_intro || ''} onChange={v => update('access_intro', v)} rows={2} placeholder="Vi har gjort det nemt..." />
                  </StudioField>
                  <div className="grid grid-cols-2 gap-5">
                    <StudioField label="Smart lock-tekst">
                      <StudioTextArea value={listing.access_smart_lock || ''} onChange={v => update('access_smart_lock', v)} rows={2} placeholder="Boligen har smart lock..." />
                    </StudioField>
                    <StudioField label="Kode-tekst">
                      <StudioTextArea value={listing.access_code || ''} onChange={v => update('access_code', v)} rows={2} placeholder="Du modtager koden..." />
                    </StudioField>
                  </div>
                  <StudioField label="Parkering">
                    <StudioTextArea value={listing.access_parking || ''} onChange={v => update('access_parking', v)} rows={2} placeholder="Gratis parkering i indkørslen" />
                  </StudioField>
                  <StudioField label="Ankomstforklaring">
                    <StudioTextArea value={listing.access_arrival || ''} onChange={v => update('access_arrival', v)} rows={3} placeholder="Fra motorvejen tag afkørsel..." />
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
              </>
            )}

            {/* ═══ 8. INKLUDERET I OPHOLDET ═══ */}
            {currentStep === 'included' && (
              <>
                <SectionHeader title="Inkluderet i opholdet" subtitle="Hvad er med, hvad skal medbringes, hvad kan tilkøbes" badge="Trin 8" />

                <StudioContentBlock title="Inkluderet" icon={<Package className="h-4 w-4 text-primary" />}>
                  <StudioField label="Sektionstitel">
                    <StudioInput value={listing.included_title || ''} onChange={v => update('included_title', v)} placeholder="Det er inkluderet i dit ophold" />
                  </StudioField>
                  <StudioField label="Intro-tekst">
                    <StudioTextArea value={listing.included_intro || ''} onChange={v => update('included_intro', v)} rows={2} />
                  </StudioField>
                </StudioContentBlock>

                <StudioContentBlock title="Inkluderet i opholdet" icon={<Check className="h-4 w-4 text-primary" />}>
                  <StudioBulletEditor items={listing.included_items || []} onChange={v => update('included_items', v)} placeholder="F.eks. Sengelinned, Håndklæder" maxItems={20} />
                </StudioContentBlock>

                <StudioContentBlock title="Medbring selv" icon={<ShoppingBag className="h-4 w-4 text-primary" />}>
                  <StudioBulletEditor items={listing.bring_yourself_items || []} onChange={v => update('bring_yourself_items', v)} placeholder="F.eks. Badehåndklæder til stranden" maxItems={15} />
                </StudioContentBlock>

                <StudioContentBlock title="Kan tilkøbes" icon={<DollarSign className="h-4 w-4 text-primary" />}>
                  <StudioBulletEditor items={listing.purchasable_items || []} onChange={v => update('purchasable_items', v)} placeholder="F.eks. Slutrengøring (595 kr)" maxItems={15} />
                </StudioContentBlock>
              </>
            )}

            {/* ═══ 9. EKSTRA MULIGHEDER ═══ */}
            {currentStep === 'extras' && (
              <>
                <SectionHeader title="Ekstra muligheder" subtitle="Upsell-tilbud og ekstra services" badge="Trin 9" />

                <StudioContentBlock title="Upsell" icon={<ShoppingBag className="h-4 w-4 text-primary" />}>
                  <StudioField label="Sektionstitel">
                    <StudioInput value={listing.extras_title || ''} onChange={v => update('extras_title', v)} placeholder="Gør dit ophold endnu bedre" />
                  </StudioField>
                  <StudioField label="Intro-tekst">
                    <StudioTextArea value={listing.extras_intro || ''} onChange={v => update('extras_intro', v)} rows={2} />
                  </StudioField>
                  <StudioField label="Upsell-punkter">
                    <StudioBulletEditor items={listing.extras_upsell_items || []} onChange={v => update('extras_upsell_items', v)} placeholder="F.eks. Privat kok-oplevelse" maxItems={10} />
                  </StudioField>
                  <StudioField label="Prisnoter">
                    <StudioTextArea value={listing.extras_pricing_notes || ''} onChange={v => update('extras_pricing_notes', v)} rows={2} placeholder="Priser pr. person..." />
                  </StudioField>
                </StudioContentBlock>
              </>
            )}

            {/* ═══ 10. SOVEPLADSER ═══ */}
            {currentStep === 'bedrooms' && (
              <>
                <SectionHeader title="Her skal du sove" subtitle="Soveværelse-kort med detaljer og galleri" badge="Trin 10" />

                <StudioContentBlock title="Soveværelser" icon={<Bed className="h-4 w-4 text-primary" />}>
                  <BedroomCardEditor cards={listing.bedroom_cards || []} onChange={v => update('bedroom_cards', v)} />
                </StudioContentBlock>
              </>
            )}

            {/* ═══ 11. FACILITETER ═══ */}
            {currentStep === 'amenities' && (
              <>
                <SectionHeader title="Det tilbyder denne bolig" subtitle="Highlighted og fuld facilitetsliste" badge="Trin 11" />

                <StudioContentBlock title="Fremhævede faciliteter" subtitle="De vigtigste / mest synlige" icon={<Star className="h-4 w-4 text-primary" />}>
                  <StudioBulletEditor items={listing.highlighted_amenities || []} onChange={v => update('highlighted_amenities', v)} placeholder="F.eks. Pool, Sauna, WiFi" maxItems={8} />
                </StudioContentBlock>

                <StudioContentBlock title="Alle faciliteter" icon={<Tag className="h-4 w-4 text-primary" />}>
                  <AdminFacilities
                    facilities={(listing.facilities as FacilityCategory[]) || []}
                    onChange={f => update('facilities' as any, f)}
                  />
                </StudioContentBlock>

                <StudioContentBlock title="Quick amenities" subtitle="Simpel amenity-liste" icon={<Check className="h-4 w-4 text-primary" />}>
                  <StudioBulletEditor items={listing.amenities || []} onChange={v => update('amenities', v)} placeholder="F.eks. WiFi, Pool, Sauna..." maxItems={30} />
                  <StudioField label="Knaptekst for 'vis alle'">
                    <StudioInput value={listing.amenities_button_text || 'Vis alle faciliteter'} onChange={v => update('amenities_button_text', v)} />
                  </StudioField>
                </StudioContentBlock>
              </>
            )}

            {/* ═══ 12. OMRÅDET ═══ */}
            {currentStep === 'area' && (
              <>
                <SectionHeader title="Her skal du være" subtitle="Lokation, afstande og lokale oplevelser" badge="Trin 12" />

                <StudioContentBlock title="Område" icon={<MapPin className="h-4 w-4 text-primary" />}>
                  <StudioField label="Sektionstitel">
                    <StudioInput value={listing.area_title || ''} onChange={v => update('area_title', v)} placeholder="Oplev Nordsjælland" />
                  </StudioField>
                  <StudioField label="Lokationstitel">
                    <StudioInput value={listing.location_title || ''} onChange={v => update('location_title', v)} placeholder="Hornbæk – Rivieraen" />
                  </StudioField>
                  <StudioField label="Lokationsbeskrivelse">
                    <StudioTextArea value={listing.location_description || ''} onChange={v => update('location_description', v)} rows={4} placeholder="Boligen ligger i det smukke..." />
                  </StudioField>
                  <StudioField label="Om området">
                    <StudioTextArea value={listing.about_area || ''} onChange={v => update('about_area', v)} rows={4} placeholder="Området byder på..." />
                  </StudioField>
                  <StudioField label="Kom rundt / transport">
                    <StudioTextArea value={listing.getting_around || ''} onChange={v => update('getting_around', v)} rows={3} placeholder="Nærmeste togstation..." />
                  </StudioField>
                </StudioContentBlock>

                <StudioContentBlock title="Afstande" subtitle="Nærliggende steder og transport" icon={<Car className="h-4 w-4 text-primary" />}>
                  <JsonPairEditor items={listing.area_distances || []} onChange={v => update('area_distances', v)}
                    labelA="Sted" labelB="Afstand" placeholderA="Stranden" placeholderB="200 m" />
                </StudioContentBlock>

                <StudioContentBlock title="Lokale attraktioner" subtitle="Seværdigheder og oplevelser" icon={<Heart className="h-4 w-4 text-primary" />}>
                  <JsonPairEditor items={listing.area_attractions || []} onChange={v => update('area_attractions', v)}
                    labelA="Attraktion" labelB="Beskrivelse" placeholderA="Louisiana Museum" placeholderB="20 min i bil" />
                </StudioContentBlock>

                <StudioContentBlock title="Områdebillede" icon={<ImageIcon className="h-4 w-4 text-primary" />}>
                  <StudioField label="Billede-URL">
                    <StudioInput value={listing.area_image || ''} onChange={v => update('area_image', v)} placeholder="https://..." />
                  </StudioField>
                </StudioContentBlock>
              </>
            )}

            {/* ═══ 13. ANMELDELSER ═══ */}
            {currentStep === 'reviews' && (
              <>
                <SectionHeader title="Anmeldelser" subtitle="Rating, badges og gæsteanmeldelser" badge="Trin 13" />

                <StudioContentBlock title="Rating & oversigt" icon={<Star className="h-4 w-4 text-primary" />}>
                  <StudioField label="Sektionstitel">
                    <StudioInput value={listing.reviews_title || ''} onChange={v => update('reviews_title', v)} placeholder="Hvad gæsterne siger" />
                  </StudioField>
                  <div className="grid grid-cols-2 gap-5">
                    <StudioField label="Samlet rating">
                      <StudioInput type="number" value={listing.reviews_rating || ''} onChange={v => update('reviews_rating', parseFloat(v) || null)} placeholder="4.9" />
                    </StudioField>
                    <StudioField label="Antal anmeldelser">
                      <StudioInput type="number" value={listing.reviews_count || ''} onChange={v => update('reviews_count', parseInt(v) || null)} placeholder="47" />
                    </StudioField>
                  </div>
                  <StudioField label="Review-badges" hint="F.eks. 'Superhosts favoritbolig'">
                    <StudioBulletEditor items={listing.reviews_badges || []} onChange={v => update('reviews_badges', v)} placeholder="Tilføj badge..." maxItems={5} />
                  </StudioField>
                </StudioContentBlock>

                <StudioContentBlock title="Anmeldelser" subtitle="Individuelle gæsteanmeldelser" icon={<MessageSquare className="h-4 w-4 text-primary" />}>
                  <ReviewEntryEditor entries={listing.reviews_entries || []} onChange={v => update('reviews_entries', v)} />
                </StudioContentBlock>
              </>
            )}

            {/* ═══ 14. VIDEOGUIDES ═══ */}
            {currentStep === 'videos' && (
              <>
                <SectionHeader title="Videoguides" subtitle="Video-instruktioner og -guides til gæster" badge="Trin 14" />

                <StudioContentBlock title="Listing-videoer" icon={<Play className="h-4 w-4 text-primary" />}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <StudioField label="Video URL (DK)">
                      <StudioInput value={listing.video_url || ''} onChange={v => update('video_url', v)} placeholder="https://youtube.com/..." />
                    </StudioField>
                    <StudioField label="Video URL (EN)">
                      <StudioInput value={listing.video_url_en || ''} onChange={v => update('video_url_en', v)} placeholder="https://youtube.com/..." />
                    </StudioField>
                    <StudioField label="Video URL (DE)">
                      <StudioInput value={listing.video_url_de || ''} onChange={v => update('video_url_de', v)} placeholder="https://youtube.com/..." />
                    </StudioField>
                  </div>
                </StudioContentBlock>

                <StudioContentBlock title="Videoguide-kort" subtitle="Administreres via listing_videos tabellen" icon={<Camera className="h-4 w-4 text-primary" />}>
                  <p className="text-sm text-muted-foreground">Videoguide-kort tilgås via den dedikerede videoguide-editor i listing-opsætningen.</p>
                </StudioContentBlock>
              </>
            )}

            {/* ═══ 15. KONTAKT ═══ */}
            {currentStep === 'contact' && (
              <>
                <SectionHeader title="Kontakt" subtitle="Vært-information og kontakt-CTA" badge="Trin 15" />

                <StudioContentBlock title="Kontaktperson" icon={<Phone className="h-4 w-4 text-primary" />}>
                  <StudioField label="Sektionstitel">
                    <StudioInput value={listing.contact_title || ''} onChange={v => update('contact_title', v)} placeholder="Kontakt din vært" />
                  </StudioField>
                  <div className="grid grid-cols-2 gap-5">
                    <StudioField label="Navn">
                      <StudioInput value={listing.contact_name || ''} onChange={v => update('contact_name', v)} placeholder="Erik Sommer" />
                    </StudioField>
                    <StudioField label="Rolle / titel">
                      <StudioInput value={listing.contact_role || ''} onChange={v => update('contact_role', v)} placeholder="Vært & ejer" />
                    </StudioField>
                  </div>
                  <StudioField label="Kontakt-tekst">
                    <StudioTextArea value={listing.contact_text || ''} onChange={v => update('contact_text', v)} rows={3} placeholder="Vi er altid klar til at hjælpe..." />
                  </StudioField>
                  <div className="grid grid-cols-2 gap-5">
                    <StudioField label="Email">
                      <StudioInput value={listing.contact_email || ''} onChange={v => update('contact_email', v)} placeholder="vært@sommervibes.dk" />
                    </StudioField>
                    <StudioField label="Telefon">
                      <StudioInput value={listing.contact_phone || ''} onChange={v => update('contact_phone', v)} placeholder="+45 12 34 56 78" />
                    </StudioField>
                  </div>
                  <StudioField label="Billede-URL">
                    <StudioInput value={listing.contact_image || ''} onChange={v => update('contact_image', v)} placeholder="https://..." />
                  </StudioField>
                </StudioContentBlock>

                <StudioContentBlock title="CTA-knapper" icon={<Rocket className="h-4 w-4 text-primary" />}>
                  <div className="grid grid-cols-2 gap-5">
                    <StudioField label="Primær CTA">
                      <StudioInput value={listing.contact_cta_primary || 'Kontakt os'} onChange={v => update('contact_cta_primary', v)} />
                    </StudioField>
                    <StudioField label="Sekundær CTA">
                      <StudioInput value={listing.contact_cta_secondary || ''} onChange={v => update('contact_cta_secondary', v)} placeholder="Se flere boliger" />
                    </StudioField>
                  </div>
                </StudioContentBlock>
              </>
            )}

            {/* ═══ 16. STICKY BOOKING BAR ═══ */}
            {currentStep === 'stickybar' && (
              <>
                <SectionHeader title="Sticky booking bar" subtitle="Den faste booking-bar i bunden af listingen" badge="Trin 16" />

                <StudioContentBlock title="Booking bar" icon={<Monitor className="h-4 w-4 text-primary" />}>
                  <div className="grid grid-cols-2 gap-5">
                    <StudioField label="Logo URL">
                      <StudioInput value={listing.sticky_bar_logo || ''} onChange={v => update('sticky_bar_logo', v)} placeholder="https://..." />
                    </StudioField>
                    <StudioField label="Pris-label">
                      <StudioInput value={listing.sticky_bar_price_label || 'Fra'} onChange={v => update('sticky_bar_price_label', v)} />
                    </StudioField>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <StudioField label="Rating">
                      <StudioInput type="number" value={listing.hero_rating || ''} onChange={v => update('hero_rating', parseFloat(v) || null)} placeholder="4.9" />
                    </StudioField>
                    <StudioField label="Antal anmeldelser">
                      <StudioInput type="number" value={listing.hero_review_count || ''} onChange={v => update('hero_review_count', parseInt(v) || null)} placeholder="47" />
                    </StudioField>
                  </div>
                  <StudioField label="CTA-tekst">
                    <StudioInput value={listing.sticky_bar_cta || 'Book nu'} onChange={v => update('sticky_bar_cta', v)} />
                  </StudioField>
                  <StudioField label="Betalingsikoner" hint="F.eks. Visa, Mastercard, MobilePay">
                    <StudioBulletEditor items={listing.sticky_bar_payment_icons || []} onChange={v => update('sticky_bar_payment_icons', v)} placeholder="Visa" maxItems={6} />
                  </StudioField>
                </StudioContentBlock>

                <StudioContentBlock title="Priser & booking-regler" icon={<DollarSign className="h-4 w-4 text-primary" />}>
                  <div className="grid grid-cols-2 gap-5">
                    <StudioField label="Basispris pr. nat">
                      <StudioInput type="number" value={listing.base_price_per_night} onChange={v => update('base_price_per_night', parseInt(v) || 0)} />
                    </StudioField>
                    <StudioField label="Weekend-pris pr. nat">
                      <StudioInput type="number" value={listing.weekend_price_per_night || ''} onChange={v => update('weekend_price_per_night', parseInt(v) || null)} placeholder="Samme som basis" />
                    </StudioField>
                  </div>
                  <div className="grid grid-cols-3 gap-5">
                    <StudioField label="Rengøringsgebyr">
                      <StudioInput type="number" value={listing.cleaning_fee || 0} onChange={v => update('cleaning_fee', parseInt(v) || 0)} />
                    </StudioField>
                    <StudioField label="Depositum">
                      <StudioInput type="number" value={listing.deposit || 0} onChange={v => update('deposit', parseInt(v) || 0)} />
                    </StudioField>
                    <StudioField label="Min. nætter">
                      <StudioInput type="number" value={listing.min_nights || 2} onChange={v => update('min_nights', parseInt(v) || 1)} />
                    </StudioField>
                  </div>
                  <StudioField label="Husregler">
                    <StudioTextArea value={listing.house_rules || ''} onChange={v => update('house_rules', v)} rows={4} placeholder="Ingen rygning, ingen fester..." />
                  </StudioField>
                </StudioContentBlock>
              </>
            )}

            {/* ═══ MEDIER ═══ */}
            {currentStep === 'media' && (
              <>
                <SectionHeader title="Mediebibliotek" subtitle="Billeder, video og plantegninger" />

                <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-muted/10 border border-border/20">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-lg font-bold text-foreground">{(listing.images || []).length}</span>
                      <span className="text-xs text-muted-foreground ml-1">billeder</span>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-border/30" />
                  <span className={cn('text-xs font-medium', listing.hero_image ? 'text-emerald-500' : 'text-amber-500')}>
                    {listing.hero_image ? '✓ Hero valgt' : '⚠ Intet hero'}
                  </span>
                  <div className="w-px h-8 bg-border/30" />
                  <div className="text-xs text-muted-foreground">Min. 5 billeder anbefalet</div>
                </div>

                <StudioContentBlock title="Upload billeder" icon={<Camera className="h-4 w-4 text-primary" />}>
                  <ListingImageUpload listingSlug={listing.slug} onUploaded={url => update('images', [...(listing.images || []), url])} />
                </StudioContentBlock>

                <StudioContentBlock title="Galleri" icon={<ImageIcon className="h-4 w-4 text-primary" />}>
                  <SortableImageGallery
                    images={listing.images || []}
                    heroImage={listing.hero_image || ''}
                    bedroomImages={(listing.bedroom_images as BedroomImage[]) || []}
                    imageLabels={(listing.image_labels as ImageLabel[]) || []}
                    comboHeroImages={(listing.combo_hero_images as string[]) || []}
                    onImagesChange={imgs => update('images', imgs)}
                    onHeroChange={url => update('hero_image', url)}
                    onBedroomImagesChange={bi => update('bedroom_images' as any, bi)}
                    onImageLabelsChange={labels => update('image_labels' as any, labels)}
                    onComboHeroToggle={url => {
                      const current = (listing.combo_hero_images as string[]) || [];
                      const next = current.includes(url) ? current.filter((u: string) => u !== url) : [...current, url];
                      update('combo_hero_images' as any, next);
                    }}
                  />
                </StudioContentBlock>
              </>
            )}

            {/* ═══ PUBLICERING ═══ */}
            {currentStep === 'publish' && (
              <>
                <SectionHeader title="Publicering på SommerVibes" subtitle="SEO, status, preview og kanal-readiness" />

                <StudioContentBlock title="Draft / Live status" icon={<Rocket className="h-4 w-4 text-primary" />}>
                  <div className="flex items-center gap-5 mb-4">
                    <ReadinessRing score={readiness.score} size={72} strokeWidth={4} />
                    <div>
                      <h4 className="font-display font-semibold text-foreground text-lg">
                        {readiness.score === 100 ? 'Alt er klar!' : readiness.score >= 80 ? 'Næsten klar!' : readiness.score >= 50 ? 'Godt på vej' : 'Mere data mangler'}
                      </h4>
                      <p className="text-sm text-muted-foreground">{readiness.passed.length} af {readiness.passed.length + readiness.missing.length} felter udfyldt</p>
                    </div>
                  </div>
                  {readiness.missing.length > 0 && (
                    <div className="space-y-1 mb-4">
                      {readiness.missing.map(m => (
                        <div key={m} className="flex items-center gap-2 text-xs py-0.5 text-amber-500"><AlertTriangle className="h-3.5 w-3.5" /> {m}</div>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Preview: <code className="font-mono text-primary">/listings/{listing.slug}</code>
                  </div>
                </StudioContentBlock>

                <StudioContentBlock title="SEO" icon={<Search className="h-4 w-4 text-primary" />}>
                  <StudioField label="SEO-titel" hint="Max 60 tegn">
                    <StudioInput value={listing.seo_title || ''} onChange={v => update('seo_title', v)} placeholder="Luksussommerhus i Hornbæk | SommerVibes" />
                  </StudioField>
                  <StudioField label="SEO-beskrivelse" hint="Max 160 tegn">
                    <StudioTextArea value={listing.seo_description || ''} onChange={v => update('seo_description', v)} rows={2} placeholder="Oplev det perfekte sommerhus..." />
                  </StudioField>
                  <StudioField label="Social preview billede (OG image)">
                    <StudioInput value={listing.seo_image || ''} onChange={v => update('seo_image', v)} placeholder="https://..." />
                  </StudioField>
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

            {/* ═══ CHANNEL REVIEW STAGES ═══ */}
            {currentStep === 'airbnb' && (
              <>
                <div className="mb-6">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Kanal-review</p>
                  <h1 className="font-display text-xl font-bold text-foreground">Airbnb</h1>
                  <p className="text-xs text-muted-foreground mt-1">Gennemgå og godkend auto-genereret indhold fra SommerVibes master</p>
                </div>
                <ChannelDataSection channelName="Airbnb" channelKey="airbnb" emoji="🏠" listing={listing}
                  onUpdate={(key, value) => update(key as any, value)} onAiFill={() => handlePrepareChannel('airbnb')} aiFilling={airbnbPreparing}
                  readinessScore={channelReadiness.airbnb.score} readinessPassed={channelReadiness.airbnb.passed} readinessMissing={channelReadiness.airbnb.missing}
                  onNavigateToStep={setCurrentStep}
                  fields={getChannelFields('airbnb').map(f => ({
                    key: f.channelField, label: f.label, type: f.type,
                    maxLength: f.maxLength, minLength: f.minLength, rows: f.rows,
                    hint: f.hint, masterSource: f.masterSource, platformSpecific: f.platformSpecific,
                    required: f.required, getMasterValue: () => f.getMasterValue(listing),
                  }))} />
              </>
            )}

            {currentStep === 'bookingcom' && (
              <>
                <div className="mb-6">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Kanal-review</p>
                  <h1 className="font-display text-xl font-bold text-foreground">Booking.com</h1>
                  <p className="text-xs text-muted-foreground mt-1">Gennemgå og godkend auto-genereret indhold fra SommerVibes master</p>
                </div>
                <ChannelDataSection channelName="Booking.com" channelKey="booking" emoji="🅱️" listing={listing}
                  onUpdate={(key, value) => update(key as any, value)} onAiFill={() => handlePrepareChannel('booking')} aiFilling={channelPreparing}
                  readinessScore={channelReadiness.booking.score} readinessPassed={channelReadiness.booking.passed} readinessMissing={channelReadiness.booking.missing}
                  onNavigateToStep={setCurrentStep}
                  fields={getChannelFields('booking').map(f => ({
                    key: f.channelField, label: f.label, type: f.type,
                    maxLength: f.maxLength, minLength: f.minLength, rows: f.rows,
                    hint: f.hint, masterSource: f.masterSource, platformSpecific: f.platformSpecific,
                    required: f.required, getMasterValue: () => f.getMasterValue(listing),
                  }))} />
              </>
            )}

            {currentStep === 'vrbo' && (
              <>
                <div className="mb-6">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Kanal-review</p>
                  <h1 className="font-display text-xl font-bold text-foreground">Vrbo</h1>
                  <p className="text-xs text-muted-foreground mt-1">Gennemgå og godkend auto-genereret indhold fra SommerVibes master</p>
                </div>
                <ChannelDataSection channelName="Vrbo" channelKey="vrbo" emoji="🏡" listing={listing}
                  onUpdate={(key, value) => update(key as any, value)} onAiFill={() => handlePrepareChannel('vrbo')} aiFilling={channelPreparing}
                  readinessScore={channelReadiness.vrbo.score} readinessPassed={channelReadiness.vrbo.passed} readinessMissing={channelReadiness.vrbo.missing}
                  onNavigateToStep={setCurrentStep}
                  fields={getChannelFields('vrbo').map(f => ({
                    key: f.channelField, label: f.label, type: f.type,
                    maxLength: f.maxLength, minLength: f.minLength, rows: f.rows,
                    hint: f.hint, masterSource: f.masterSource, platformSpecific: f.platformSpecific,
                    required: f.required, getMasterValue: () => f.getMasterValue(listing),
                  }))} />
              </>
            )}

            {/* ═══ AKTØRER ═══ */}
            {currentStep === 'actors' && (
              <>
                <SectionHeader title="Aktører" subtitle="Ejer, kontaktpersoner og sekundære aktører" />
                <ListingActorsTab listingId={listing.id} ownerId={listing.owner_id} />
              </>
            )}

            {/* ═══ MEDARBEJDERE ═══ */}
            {currentStep === 'staff' && (
              <>
                <SectionHeader title="Medarbejdere" subtitle="Tildelte medarbejdere til denne sag" />
                <ListingStaffTab listingId={listing.id} />
              </>
            )}

            {/* ═══ DOKUMENTER ═══ */}
            {currentStep === 'documents' && (
              <>
                <SectionHeader title="Dokumenter" subtitle="Sagens dokumenter og formularer" />
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
