import { useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, X, Plus, Globe, FileText, Settings2 } from 'lucide-react';

interface ContentFields {
  name: string; description: string; address: string; region: string;
  max_guests: number; bedrooms: number; bathrooms: number;
  base_price_per_night: number; cleaning_fee: number;
  check_in_time: string; check_out_time: string; is_active: boolean;
  house_rules: string; practical_info: string; hero_image: string;
  amenities: string[]; images: string[];
}

interface ListingRow {
  id: string; slug: string; name: string; description: string | null;
  address: string | null; max_guests: number; bedrooms: number | null; bathrooms: number | null;
  base_price_per_night: number; cleaning_fee: number | null;
  check_in_time: string | null; check_out_time: string | null;
  is_active: boolean; amenities: string[] | null; house_rules: string | null;
  practical_info: string | null; images: string[] | null; hero_image: string | null;
  currency: string; region: string | null; owner_id: string;
  [key: string]: any;
}

interface Props { listing: ListingRow; onBack: () => void; }

function publishedContentFromRow(row: ListingRow): ContentFields {
  return {
    name: row.name, description: row.description || '', address: row.address || '',
    region: row.region || '', max_guests: row.max_guests, bedrooms: row.bedrooms || 1,
    bathrooms: row.bathrooms || 1, base_price_per_night: row.base_price_per_night,
    cleaning_fee: row.cleaning_fee || 0, check_in_time: row.check_in_time || '15:00',
    check_out_time: row.check_out_time || '10:00', is_active: row.is_active,
    house_rules: row.house_rules || '', practical_info: row.practical_info || '',
    hero_image: row.hero_image || '', amenities: row.amenities || [], images: row.images || [],
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm text-muted-foreground">{label}</Label>{children}</div>;
}

export function ListingEditor({ listing, onBack }: Props) {
  const { toast } = useToast();
  const publishedContent = useMemo(() => publishedContentFromRow(listing), [listing]);
  const [form, setForm] = useState<ContentFields>({
    ...publishedContent,
    base_price_per_night: publishedContent.base_price_per_night / 100,
    cleaning_fee: publishedContent.cleaning_fee / 100,
  });
  const [newAmenity, setNewAmenity] = useState('');
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const updateField = <K extends keyof ContentFields>(key: K, value: ContentFields[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const addAmenity = () => {
    const trimmed = newAmenity.trim();
    if (trimmed && !form.amenities.includes(trimmed)) {
      updateField('amenities', [...form.amenities, trimmed]);
      setNewAmenity('');
    }
  };

  const removeAmenity = (a: string) => updateField('amenities', form.amenities.filter((x) => x !== a));

  const handleSave = async () => {
    setSaving(true);
    const content = {
      ...form,
      base_price_per_night: Math.round(form.base_price_per_night * 100),
      cleaning_fee: Math.round(form.cleaning_fee * 100),
    };

    if (!content.hero_image && content.images.length > 0) {
      content.hero_image = content.images[0];
      setForm(prev => ({ ...prev, hero_image: content.images[0] }));
    }

    const { error } = await supabase.from('listings').update({
      name: content.name, description: content.description || null,
      address: content.address || null, region: content.region || null,
      max_guests: content.max_guests, bedrooms: content.bedrooms, bathrooms: content.bathrooms,
      base_price_per_night: content.base_price_per_night,
      cleaning_fee: content.cleaning_fee,
      check_in_time: content.check_in_time, check_out_time: content.check_out_time,
      is_active: content.is_active, house_rules: content.house_rules || null,
      practical_info: content.practical_info || null,
      amenities: content.amenities, images: content.images,
      hero_image: content.hero_image || null,
    }).eq('id', listing.id);

    setSaving(false);
    if (error) {
      toast({ title: 'Fejl ved gem', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Gemt!', description: `${content.name} er opdateret.` });
      setIsDirty(false);
      onBack();
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-2xl font-semibold text-foreground">{listing.name}</h2>
          <p className="text-sm text-muted-foreground">Redigér listing</p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving || !isDirty} className="gap-1.5 text-xs">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
          Gem
        </Button>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="w-full justify-start bg-card border border-border rounded-xl p-1 h-auto flex-wrap gap-1">
          <TabsTrigger value="content" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="h-3.5 w-3.5" /> Indhold
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Settings2 className="h-3.5 w-3.5" /> Indstillinger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Section title="Grundlæggende info">
                <Field label="Titel"><Input value={form.name} onChange={(e) => updateField('name', e.target.value)} /></Field>
                <Field label="Beskrivelse">
                  <Textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={4} placeholder="Beskrivelse af boligen..." />
                </Field>
                <Field label="Adresse"><Input value={form.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Søvej 28, 6823 Ansager" /></Field>
                <Field label="Region"><Input value={form.region} onChange={(e) => updateField('region', e.target.value)} placeholder="Nordsjælland" /></Field>
                <div className="flex items-center gap-3">
                  <Label className="text-sm">Aktiv</Label>
                  <Switch checked={form.is_active} onCheckedChange={(v) => updateField('is_active', v)} />
                </div>
              </Section>

              <Section title="Kapacitet">
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Max gæster"><Input type="number" min={1} value={form.max_guests} onChange={(e) => updateField('max_guests', parseInt(e.target.value) || 1)} /></Field>
                  <Field label="Soveværelser"><Input type="number" min={0} value={form.bedrooms} onChange={(e) => updateField('bedrooms', parseInt(e.target.value) || 0)} /></Field>
                  <Field label="Badeværelser"><Input type="number" min={0} value={form.bathrooms} onChange={(e) => updateField('bathrooms', parseInt(e.target.value) || 0)} /></Field>
                </div>
              </Section>

              <Section title="Priser (DKK)">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Basispris pr. nat"><Input type="number" min={0} step={50} value={form.base_price_per_night} onChange={(e) => updateField('base_price_per_night', parseFloat(e.target.value) || 0)} /></Field>
                  <Field label="Rengøringsgebyr"><Input type="number" min={0} step={50} value={form.cleaning_fee} onChange={(e) => updateField('cleaning_fee', parseFloat(e.target.value) || 0)} /></Field>
                </div>
              </Section>
            </div>

            <div className="space-y-6">
              <Section title="Check-in / Check-out">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Check-in tid"><Input type="time" value={form.check_in_time} onChange={(e) => updateField('check_in_time', e.target.value)} /></Field>
                  <Field label="Check-out tid"><Input type="time" value={form.check_out_time} onChange={(e) => updateField('check_out_time', e.target.value)} /></Field>
                </div>
              </Section>

              <Section title="Husregler">
                <Textarea value={form.house_rules} onChange={(e) => updateField('house_rules', e.target.value)} rows={4} placeholder="Ingen rygning, ingen fester..." />
              </Section>

              <Section title="Praktisk info">
                <Textarea value={form.practical_info} onChange={(e) => updateField('practical_info', e.target.value)} rows={5} placeholder="WiFi-kode, parkering, nøgleboks..." />
              </Section>

              <Section title="Faciliteter">
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.amenities.map((a) => (
                    <Badge key={a} variant="secondary" className="gap-1 text-xs">
                      {a}
                      <button onClick={() => removeAmenity(a)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                    placeholder="Tilføj facilitet..." className="flex-1" />
                  <Button size="sm" variant="outline" onClick={addAmenity}><Plus className="h-4 w-4" /></Button>
                </div>
              </Section>

              <Section title="Billeder">
                <Field label="Hero-billede URL"><Input value={form.hero_image} onChange={(e) => updateField('hero_image', e.target.value)} placeholder="https://..." /></Field>
                <div className="space-y-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input value={img} onChange={(e) => {
                        const newImages = [...form.images]; newImages[i] = e.target.value;
                        updateField('images', newImages);
                      }} className="flex-1" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => updateField('images', form.images.filter((_, idx) => idx !== i))}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => updateField('images', [...form.images, ''])} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Tilføj billede
                  </Button>
                </div>
              </Section>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Section title="Slug & ID">
            <Field label="Slug (URL)">
              <Input value={listing.slug} disabled className="bg-muted" />
            </Field>
            <Field label="Listing ID">
              <Input value={listing.id} disabled className="bg-muted font-mono text-xs" />
            </Field>
            <Field label="Ejer ID">
              <Input value={listing.owner_id} disabled className="bg-muted font-mono text-xs" />
            </Field>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
