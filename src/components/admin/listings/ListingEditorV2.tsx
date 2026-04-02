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
import {
  ArrowLeft, Loader2, Save, X, Plus, Home, ImageIcon, Tag, DollarSign, CheckCircle2, Globe,
  GripVertical, Star, AlertTriangle, Info
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

// ── Readiness calc ──
function calcReadiness(f: Partial<ListingFull>): { score: number; missing: string[] } {
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
  const passed = checks.filter(([, ok]) => ok).length;
  const missing = checks.filter(([, ok]) => !ok).map(([name]) => name);
  return { score: Math.round((passed / checks.length) * 100), missing };
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

  const readiness = useMemo(() => listing ? calcReadiness(listing) : { score: 0, missing: [] }, [listing]);

  const handleSave = async () => {
    if (!listing) return;
    setSaving(true);

    const score = calcReadiness(listing).score;

    const { error } = await supabase.from('listings').update({
      name: listing.name,
      description: listing.description,
      address: listing.address,
      region: listing.region,
      max_guests: listing.max_guests,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      base_price_per_night: listing.base_price_per_night,
      cleaning_fee: listing.cleaning_fee,
      check_in_time: listing.check_in_time,
      check_out_time: listing.check_out_time,
      is_active: listing.is_active,
      house_rules: listing.house_rules,
      practical_info: listing.practical_info,
      amenities: listing.amenities,
      images: listing.images,
      hero_image: listing.hero_image,
      tagline: listing.tagline,
      long_description: listing.long_description,
      about_property: listing.about_property,
      about_area: listing.about_area,
      highlights: listing.highlights,
      sqm: listing.sqm,
      property_type: listing.property_type,
      weekend_price_per_night: listing.weekend_price_per_night,
      min_nights: listing.min_nights,
      deposit: listing.deposit,
      channel_airbnb_ready: listing.channel_airbnb_ready,
      channel_booking_ready: listing.channel_booking_ready,
      channel_vrbo_ready: listing.channel_vrbo_ready,
      channel_airbnb_title: listing.channel_airbnb_title,
      channel_booking_title: listing.channel_booking_title,
      channel_vrbo_title: listing.channel_vrbo_title,
      channel_airbnb_description: listing.channel_airbnb_description,
      channel_booking_description: listing.channel_booking_description,
      channel_vrbo_description: listing.channel_vrbo_description,
      readiness_score: score,
      internal_status: listing.internal_status,
      checkin_info: listing.checkin_info,
      checkout_info: listing.checkout_info,
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

  if (loading || !listing) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Henter listing...
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl font-bold text-foreground truncate">{listing.name}</h2>
          <p className="text-xs text-muted-foreground">{listing.slug} · Readiness {readiness.score}%</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={listing.internal_status || 'draft'} onValueChange={v => update('internal_status', v)}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Kladde</SelectItem>
              <SelectItem value="review">Til gennemgang</SelectItem>
              <SelectItem value="ready">Klar</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="paused">Pauset</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleSave} disabled={saving || !isDirty} className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Gem
          </Button>
        </div>
      </div>

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
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 text-[10px]"
                      onClick={() => { update('hero_image', img); }}
                    >
                      <Star className="h-3 w-3 mr-1" /> Hero
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-[10px]"
                      onClick={() => update('images', (listing.images || []).filter((_, idx) => idx !== i))}
                    >
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
                      if (isSelected) {
                        update('amenities', (listing.amenities || []).filter(x => x !== a));
                      } else {
                        update('amenities', [...(listing.amenities || []), a]);
                      }
                    }}
                    className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                        : 'bg-card border-border text-muted-foreground hover:border-primary/20'
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
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
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
                <SelectItem value="draft">Kladde</SelectItem>
                <SelectItem value="review">Til gennemgang</SelectItem>
                <SelectItem value="ready">Klar</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="paused">Pauset</SelectItem>
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

        {/* ─── 7. KANALER ─── */}
        <TabsContent value="kanaler" className="mt-4 space-y-5">
          {[
            { key: 'airbnb' as const, label: 'Airbnb', color: 'text-rose-500' },
            { key: 'booking' as const, label: 'Booking.com', color: 'text-blue-600' },
            { key: 'vrbo' as const, label: 'Vrbo', color: 'text-indigo-500' },
          ].map(ch => (
            <Section key={ch.key} title={ch.label}>
              <div className="flex items-center gap-3 mb-3">
                <Switch
                  checked={(listing as any)[`channel_${ch.key}_ready`] || false}
                  onCheckedChange={v => update(`channel_${ch.key}_ready` as any, v)}
                />
                <span className={`text-sm font-medium ${ch.color}`}>{ch.label} klar</span>
              </div>
              <Field label={`${ch.label}-specifik titel`}>
                <Input
                  value={(listing as any)[`channel_${ch.key}_title`] || ''}
                  onChange={e => update(`channel_${ch.key}_title` as any, e.target.value)}
                  placeholder={`Titel optimeret til ${ch.label}`}
                />
              </Field>
              <Field label={`${ch.label}-specifik beskrivelse`}>
                <Textarea
                  value={(listing as any)[`channel_${ch.key}_description`] || ''}
                  onChange={e => update(`channel_${ch.key}_description` as any, e.target.value)}
                  rows={3}
                  placeholder={`Beskrivelse optimeret til ${ch.label}`}
                />
              </Field>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  Push-status: Ikke forbundet (placeholder)
                </p>
              </div>
            </Section>
          ))}
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
