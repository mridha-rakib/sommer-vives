import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, X, Plus, Check, Image, MapPin, Type, DollarSign, Settings, Sparkles, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

/* ─── types ─── */
interface ContentFields {
  name: string; description: string; address: string; region: string; city: string;
  max_guests: number; bedrooms: number; bathrooms: number;
  base_price_per_night: number; cleaning_fee: number; weekend_price_per_night: number;
  min_nights: number; max_nights: number;
  check_in_time: string; check_out_time: string; is_active: boolean;
  house_rules: string; practical_info: string; checkin_info: string; checkout_info: string;
  hero_image: string; amenities: string[]; images: string[];
  property_type: string; tagline: string;
}

interface ListingRow {
  id: string; slug: string; name: string; description: string | null;
  address: string | null; city: string | null; max_guests: number; bedrooms: number | null; bathrooms: number | null;
  base_price_per_night: number; cleaning_fee: number | null;
  weekend_price_per_night: number | null;
  check_in_time: string | null; check_out_time: string | null;
  is_active: boolean; amenities: string[] | null; house_rules: string | null;
  practical_info: string | null; images: string[] | null; hero_image: string | null;
  currency: string; region: string | null; owner_id: string;
  min_nights: number | null; max_nights: number | null;
  checkin_info: string | null; checkout_info: string | null;
  property_type: string | null; tagline: string | null;
}

interface Props { listing: ListingRow; onBack: () => void; }

function fromRow(row: ListingRow): ContentFields {
  return {
    name: row.name, description: row.description || '', address: row.address || '',
    region: row.region || '', city: row.city || '',
    max_guests: row.max_guests, bedrooms: row.bedrooms || 1, bathrooms: row.bathrooms || 1,
    base_price_per_night: (row.base_price_per_night || 0) / 100,
    cleaning_fee: (row.cleaning_fee || 0) / 100,
    weekend_price_per_night: (row.weekend_price_per_night || 0) / 100,
    min_nights: row.min_nights || 1, max_nights: row.max_nights || 30,
    check_in_time: row.check_in_time || '15:00', check_out_time: row.check_out_time || '10:00',
    is_active: row.is_active, house_rules: row.house_rules || '',
    practical_info: row.practical_info || '', checkin_info: row.checkin_info || '',
    checkout_info: row.checkout_info || '',
    hero_image: row.hero_image || '', amenities: row.amenities || [], images: row.images || [],
    property_type: row.property_type || '', tagline: row.tagline || '',
  };
}

/* ─── reusable building blocks ─── */
function Section({ title, icon: Icon, children, badge }: {
  title: string; icon: React.ElementType; children: React.ReactNode; badge?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-muted/30">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold text-foreground flex-1">{title}</h3>
        {badge}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground -mt-0.5">{hint}</p>}
      {children}
    </div>
  );
}

function Row({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  const cls = cols === 4 ? 'grid-cols-2 sm:grid-cols-4' : cols === 3 ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-2';
  return <div className={`grid ${cls} gap-4`}>{children}</div>;
}

/* ─── common amenities ─── */
const COMMON_AMENITIES = [
  'WiFi', 'Parkering', 'Opvaskemaskine', 'Vaskemaskine', 'Tørretumbler',
  'Brændeovn', 'Grill', 'Terrasse', 'Have', 'Spa/Jacuzzi',
  'Sauna', 'Pool', 'Husdyr tilladt', 'Børnevenlig', 'Handicapvenlig',
  'Havudsigt', 'Søudsigt', 'Skovudsigt',
];

/* ─── main component ─── */
export function ListingEditor({ listing, onBack }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<ContentFields>(() => fromRow(listing));
  const [newAmenity, setNewAmenity] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef(form);
  formRef.current = form;

  const persist = useCallback(async (data: ContentFields) => {
    setSaving(true);
    const payload: Record<string, unknown> = {
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
    if (error) {
      toast({ title: 'Fejl ved auto-gem', description: error.message, variant: 'destructive' });
    } else {
      setLastSaved(new Date());
    }
  }, [listing.id, toast]);

  /* auto-save after 2s idle */
  const scheduleSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => persist(formRef.current), 2000);
  }, [persist]);

  const updateField = <K extends keyof ContentFields>(key: K, value: ContentFields[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    scheduleSave();
  };

  useEffect(() => () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); }, []);

  const addAmenity = (a: string) => {
    const trimmed = a.trim();
    if (trimmed && !form.amenities.includes(trimmed)) {
      updateField('amenities', [...form.amenities, trimmed]);
    }
  };

  const toggleAmenity = (a: string) => {
    if (form.amenities.includes(a)) {
      updateField('amenities', form.amenities.filter(x => x !== a));
    } else {
      updateField('amenities', [...form.amenities, a]);
    }
  };

  const sections = ['Grunddata', 'Beskrivelse', 'Billeder', 'Faciliteter', 'Priser', 'Klargøring'];

  return (
    <div className="space-y-0 pb-24">
      {/* ─── header ─── */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl font-semibold text-foreground truncate">{form.name || 'Ny listing'}</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            {saving ? (
              <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Gemmer…</span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1 text-primary"><Check className="h-3 w-3" /> Gemt {lastSaved.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</span>
            ) : (
              <span>Ændringer gemmes automatisk</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{form.is_active ? 'Aktiv' : 'Inaktiv'}</span>
          <Switch checked={form.is_active} onCheckedChange={v => updateField('is_active', v)} />
        </div>
      </div>

      {/* ─── section nav ─── */}
      <div className="flex gap-1 overflow-x-auto pb-4 mb-2 scrollbar-none">
        {sections.map((s, i) => (
          <button key={s} onClick={() => setActiveSection(i)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeSection === i
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {/* ─── 1. Grunddata ─── */}
      {activeSection === 0 && (
        <Section title="Grunddata" icon={MapPin}>
          <Field label="Titel" hint="Det navn gæsten ser">
            <Input value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="Strandvillaen i Hornbæk" />
          </Field>
          <Field label="Tagline" hint="Kort sætning til listings-kort">
            <Input value={form.tagline} onChange={e => updateField('tagline', e.target.value)} placeholder="Moderne sommerhus med havudsigt" />
          </Field>
          <Row>
            <Field label="Boligtype">
              <Input value={form.property_type} onChange={e => updateField('property_type', e.target.value)} placeholder="Sommerhus" />
            </Field>
            <Field label="Region">
              <Input value={form.region} onChange={e => updateField('region', e.target.value)} placeholder="Nordsjælland" />
            </Field>
          </Row>
          <Field label="Adresse">
            <Input value={form.address} onChange={e => updateField('address', e.target.value)} placeholder="Søvej 28, 3100 Hornbæk" />
          </Field>
          <Field label="By">
            <Input value={form.city} onChange={e => updateField('city', e.target.value)} placeholder="Hornbæk" />
          </Field>
          <Row cols={3}>
            <Field label="Max gæster">
              <Input type="number" min={1} value={form.max_guests} onChange={e => updateField('max_guests', parseInt(e.target.value) || 1)} />
            </Field>
            <Field label="Soveværelser">
              <Input type="number" min={0} value={form.bedrooms} onChange={e => updateField('bedrooms', parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Badeværelser">
              <Input type="number" min={0} value={form.bathrooms} onChange={e => updateField('bathrooms', parseInt(e.target.value) || 0)} />
            </Field>
          </Row>
        </Section>
      )}

      {/* ─── 2. Beskrivelse ─── */}
      {activeSection === 1 && (
        <Section title="Beskrivelse" icon={Type}>
          <Field label="Hovedbeskrivelse" hint="Beskriv boligen, stemningen og omgivelserne">
            <Textarea value={form.description} onChange={e => updateField('description', e.target.value)}
              rows={6} placeholder="Velkommen til et charmerende sommerhus beliggende kun 200 m fra stranden…" />
          </Field>
          <Field label="Husregler">
            <Textarea value={form.house_rules} onChange={e => updateField('house_rules', e.target.value)}
              rows={3} placeholder="Ingen rygning indendørs, max 8 gæster, ro efter kl. 22…" />
          </Field>
          <Field label="Praktisk info" hint="WiFi, parkering, affald, nøgleboks etc.">
            <Textarea value={form.practical_info} onChange={e => updateField('practical_info', e.target.value)}
              rows={3} placeholder="WiFi: SommerNet / Kode: 12345. Parkering i indkørslen…" />
          </Field>
        </Section>
      )}

      {/* ─── 3. Billeder ─── */}
      {activeSection === 2 && (
        <Section title="Billeder" icon={Image}
          badge={<Badge variant="secondary" className="text-xs">{form.images.length} billeder</Badge>}>
          <Field label="Hero-billede" hint="Hovedbilledet der vises øverst">
            <Input value={form.hero_image} onChange={e => updateField('hero_image', e.target.value)} placeholder="https://…" />
          </Field>
          {form.hero_image && (
            <div className="rounded-xl overflow-hidden border border-border h-40">
              <img src={form.hero_image} alt="Hero" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Galleri</Label>
            {form.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {form.images.map((img, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-border aspect-[4/3] bg-muted">
                    {img ? (
                      <img src={img} alt={`Billede ${i + 1}`} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Tom URL</div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <button onClick={() => updateField('images', form.images.filter((_, idx) => idx !== i))}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-destructive rounded-full p-1.5">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <input value={img} onChange={e => {
                      const newImages = [...form.images]; newImages[i] = e.target.value;
                      updateField('images', newImages);
                    }} className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity outline-none" placeholder="URL…" />
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => updateField('images', [...form.images, ''])} className="gap-1.5 w-full">
              <Plus className="h-3.5 w-3.5" /> Tilføj billede
            </Button>
          </div>
        </Section>
      )}

      {/* ─── 4. Faciliteter ─── */}
      {activeSection === 3 && (
        <Section title="Faciliteter" icon={Sparkles}
          badge={<Badge variant="secondary" className="text-xs">{form.amenities.length} valgt</Badge>}>
          <div>
            <Label className="text-sm font-medium mb-2 block">Hurtigvalg</Label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_AMENITIES.map(a => {
                const active = form.amenities.includes(a);
                return (
                  <button key={a} onClick={() => toggleAmenity(a)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground border-border hover:border-primary/40'
                    }`}>
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
          {form.amenities.filter(a => !COMMON_AMENITIES.includes(a)).length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Egne faciliteter</Label>
              <div className="flex flex-wrap gap-1.5">
                {form.amenities.filter(a => !COMMON_AMENITIES.includes(a)).map(a => (
                  <Badge key={a} variant="secondary" className="gap-1 text-xs">
                    {a}
                    <button onClick={() => updateField('amenities', form.amenities.filter(x => x !== a))} className="ml-0.5 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Input value={newAmenity} onChange={e => setNewAmenity(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity(newAmenity); setNewAmenity(''); } }}
              placeholder="Tilføj egen facilitet…" className="flex-1" />
            <Button size="sm" variant="outline" onClick={() => { addAmenity(newAmenity); setNewAmenity(''); }} disabled={!newAmenity.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </Section>
      )}

      {/* ─── 5. Priser ─── */}
      {activeSection === 4 && (
        <Section title="Priser" icon={DollarSign}>
          <Row>
            <Field label="Pris pr. nat (DKK)" hint="Standard hverdagspris">
              <Input type="number" min={0} step={50} value={form.base_price_per_night}
                onChange={e => updateField('base_price_per_night', parseFloat(e.target.value) || 0)} />
            </Field>
            <Field label="Weekend-pris (DKK)" hint="Fredag–søndag, 0 = samme som hverdag">
              <Input type="number" min={0} step={50} value={form.weekend_price_per_night}
                onChange={e => updateField('weekend_price_per_night', parseFloat(e.target.value) || 0)} />
            </Field>
          </Row>
          <Row>
            <Field label="Rengøringsgebyr (DKK)">
              <Input type="number" min={0} step={50} value={form.cleaning_fee}
                onChange={e => updateField('cleaning_fee', parseFloat(e.target.value) || 0)} />
            </Field>
            <div />
          </Row>
          <Row>
            <Field label="Min. nætter">
              <Input type="number" min={1} value={form.min_nights}
                onChange={e => updateField('min_nights', parseInt(e.target.value) || 1)} />
            </Field>
            <Field label="Max nætter">
              <Input type="number" min={1} value={form.max_nights}
                onChange={e => updateField('max_nights', parseInt(e.target.value) || 30)} />
            </Field>
          </Row>
        </Section>
      )}

      {/* ─── 6. Klargøring ─── */}
      {activeSection === 5 && (() => {
        const checks: { label: string; ok: boolean; fix: string; section: number }[] = [
          { label: 'Titel', ok: !!form.name.trim(), fix: 'Tilføj en titel', section: 0 },
          { label: 'Adresse', ok: !!form.address.trim(), fix: 'Tilføj adresse', section: 0 },
          { label: 'Region', ok: !!form.region.trim(), fix: 'Angiv region', section: 0 },
          { label: 'Kapacitet', ok: form.max_guests >= 1, fix: 'Sæt antal gæster', section: 0 },
          { label: 'Beskrivelse', ok: form.description.trim().length >= 20, fix: 'Skriv en beskrivelse (min. 20 tegn)', section: 1 },
          { label: 'Husregler', ok: !!form.house_rules.trim(), fix: 'Tilføj husregler', section: 1 },
          { label: 'Praktisk info', ok: !!form.practical_info.trim(), fix: 'Tilføj praktisk info (WiFi, parkering…)', section: 1 },
          { label: 'Hero-billede', ok: !!form.hero_image.trim(), fix: 'Vælg et hovedbillede', section: 2 },
          { label: 'Min. 5 billeder', ok: form.images.filter(i => i.trim()).length >= 5, fix: `Mangler ${Math.max(0, 5 - form.images.filter(i => i.trim()).length)} billeder`, section: 2 },
          { label: 'Faciliteter', ok: form.amenities.length >= 3, fix: `Tilføj ${Math.max(0, 3 - form.amenities.length)} flere faciliteter`, section: 3 },
          { label: 'Pris pr. nat', ok: form.base_price_per_night > 0, fix: 'Sæt en pris per nat', section: 4 },
          { label: 'Rengøringsgebyr', ok: form.cleaning_fee > 0, fix: 'Angiv rengøringsgebyr', section: 4 },
          { label: 'Check-in tid', ok: !!form.check_in_time, fix: 'Sæt check-in tidspunkt', section: 5 },
          { label: 'Check-out tid', ok: !!form.check_out_time, fix: 'Sæt check-out tidspunkt', section: 5 },
          { label: 'Check-in info', ok: !!form.checkin_info.trim(), fix: 'Beskriv ankomst-procedure', section: 5 },
        ];
        const passed = checks.filter(c => c.ok).length;
        const score = Math.round((passed / checks.length) * 100);
        const missing = checks.filter(c => !c.ok);
        const circumference = 2 * Math.PI * 40;
        const offset = circumference - (score / 100) * circumference;

        return (
          <Section title="Klargøring" icon={Settings}>
            {/* Score */}
            <div className="flex items-center gap-5 pb-4 border-b border-border">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="7" className="text-muted/30" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="7"
                    strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                    className={score >= 80 ? 'text-primary' : score >= 50 ? 'text-accent-foreground' : 'text-destructive'} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-foreground">{score}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {score === 100 ? 'Klar til publicering! 🎉' : score >= 80 ? 'Næsten klar' : score >= 50 ? 'Halvvejs — fortsæt!' : 'Mangler grunddata'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{passed} af {checks.length} felter udfyldt</p>
              </div>
            </div>

            {/* Missing items */}
            {missing.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mangler</p>
                {missing.map(item => (
                  <button key={item.label} onClick={() => setActiveSection(item.section)}
                    className="w-full flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left hover:bg-muted/50 transition-colors group">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.fix}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {/* Completed items */}
            {passed > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Udfyldt</p>
                <div className="flex flex-wrap gap-1.5">
                  {checks.filter(c => c.ok).map(item => (
                    <span key={item.label} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      <CheckCircle2 className="h-3 w-3" /> {item.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Check-in/out fields inline */}
            <div className="pt-3 border-t border-border space-y-4">
              <Row>
                <Field label="Check-in tid">
                  <Input type="time" value={form.check_in_time} onChange={e => updateField('check_in_time', e.target.value)} />
                </Field>
                <Field label="Check-out tid">
                  <Input type="time" value={form.check_out_time} onChange={e => updateField('check_out_time', e.target.value)} />
                </Field>
              </Row>
              <Field label="Check-in instruktioner" hint="Hvad gæsten skal vide ved ankomst">
                <Textarea value={form.checkin_info} onChange={e => updateField('checkin_info', e.target.value)}
                  rows={3} placeholder="Nøgleboksen sidder til venstre for hoveddøren. Koden er…" />
              </Field>
              <Field label="Check-out instruktioner" hint="Hvad gæsten skal gøre ved afrejse">
                <Textarea value={form.checkout_info} onChange={e => updateField('checkout_info', e.target.value)}
                  rows={3} placeholder="Tøm køleskab, start opvaskemaskine, lås hoveddør…" />
              </Field>
            </div>

            {/* Meta */}
            <div className="pt-2 border-t border-border space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Slug</span>
                <span className="font-mono text-xs text-foreground">{listing.slug}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Listing ID</span>
                <span className="font-mono text-[10px] text-foreground">{listing.id}</span>
              </div>
            </div>
          </Section>
        );
      })()}

      {/* ─── bottom bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border p-3 flex items-center justify-between z-50">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-xs">
          <ArrowLeft className="h-3.5 w-3.5" /> Tilbage
        </Button>
        <div className="flex items-center gap-3">
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          {lastSaved && !saving && (
            <span className="text-xs text-primary flex items-center gap-1"><Check className="h-3 w-3" /> Gemt</span>
          )}
          <Button size="sm" onClick={() => persist(form)} disabled={saving} className="gap-1.5 text-xs">
            Gem nu
          </Button>
        </div>
      </div>
    </div>
  );
}
