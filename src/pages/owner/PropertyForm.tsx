import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const REGIONS = [
  'Nordjylland', 'Midtjylland', 'Syddanmark', 'Sjælland', 'Hovedstaden', 'Bornholm'
];

const AMENITIES = [
  'WiFi', 'TV', 'Opvaskemaskine', 'Vaskemaskine', 'Tørretumbler', 'Sauna',
  'Spabad', 'Pool', 'Pejs', 'Grill', 'Terrasse', 'Have', 'Parkering',
  'Husdyr tilladt', 'Handicapvenlig', 'Havudsigt', 'Tæt på strand'
];

export default function PropertyForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    region: '',
    capacity: 4,
    bedrooms: 2,
    bathrooms: 1,
    amenities: [] as string[],
    house_rules: '',
    price_per_night: '',
    price_per_week: '',
    cleaning_fee: '',
    images: [] as string[],
  });

  useEffect(() => {
    if (isEdit) {
      loadProperty();
    }
  }, [id]);

  const loadProperty = async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast({ title: 'Fejl', description: 'Kunne ikke indlæse ejendom', variant: 'destructive' });
      return;
    }

    setForm({
      title: data.title || '',
      description: data.description || '',
      address: data.address || '',
      region: data.region || '',
      capacity: data.capacity || 4,
      bedrooms: data.bedrooms || 2,
      bathrooms: data.bathrooms || 1,
      amenities: data.amenities || [],
      house_rules: data.house_rules || '',
      price_per_night: data.price_per_night?.toString() || '',
      price_per_week: data.price_per_week?.toString() || '',
      cleaning_fee: data.cleaning_fee?.toString() || '',
      images: data.images || [],
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('property-images')
        .upload(fileName, file);

      if (error) {
        toast({ title: 'Fejl', description: 'Kunne ikke uploade billede', variant: 'destructive' });
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      newImages.push(publicUrl);
    }

    setForm(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const propertyData = {
      owner_id: user.id,
      title: form.title,
      description: form.description,
      address: form.address,
      region: form.region,
      capacity: form.capacity,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      amenities: form.amenities,
      house_rules: form.house_rules,
      price_per_night: form.price_per_night ? parseFloat(form.price_per_night) : null,
      price_per_week: form.price_per_week ? parseFloat(form.price_per_week) : null,
      cleaning_fee: form.cleaning_fee ? parseFloat(form.cleaning_fee) : null,
      images: form.images,
      status: 'draft',
    };

    let error;
    if (isEdit) {
      const result = await supabase
        .from('properties')
        .update(propertyData)
        .eq('id', id);
      error = result.error;
    } else {
      const result = await supabase
        .from('properties')
        .insert(propertyData);
      error = result.error;
    }

    if (error) {
      toast({ title: 'Fejl', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Gemt!', description: isEdit ? 'Sommerhuset er opdateret.' : 'Sommerhuset er oprettet.' });
      navigate('/owner/properties');
    }

    setLoading(false);
  };

  return (
    <OwnerLayout>
      <div className="max-w-3xl mx-auto">
        <Link to="/owner/properties" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Tilbage til mine sommerhuse
        </Link>

        <h1 className="font-display text-3xl font-bold text-primary mb-8">
          {isEdit ? 'Rediger sommerhus' : 'Opret nyt sommerhus'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-display text-xl font-semibold text-primary">Grundlæggende info</h2>

            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="F.eks. Hyggeligt sommerhus ved Vesterhavet"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Beskriv dit sommerhus..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">Adresse *</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Vejnavn 123, 1234 By"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="region">Region *</Label>
                <select
                  id="region"
                  value={form.region}
                  onChange={e => setForm(prev => ({ ...prev, region: e.target.value }))}
                  required
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Vælg region</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Capacity */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-display text-xl font-semibold text-primary">Kapacitet</h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="capacity">Antal personer *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={e => setForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bedrooms">Soveværelser</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min={0}
                  value={form.bedrooms}
                  onChange={e => setForm(prev => ({ ...prev, bedrooms: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bathrooms">Badeværelser</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min={0}
                  value={form.bathrooms}
                  onChange={e => setForm(prev => ({ ...prev, bathrooms: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-display text-xl font-semibold text-primary">Faciliteter</h2>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    form.amenities.includes(amenity)
                      ? 'bg-accent text-primary'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-display text-xl font-semibold text-primary">Priser</h2>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price_per_night">Pris pr. nat (DKK)</Label>
                <Input
                  id="price_per_night"
                  type="number"
                  min={0}
                  value={form.price_per_night}
                  onChange={e => setForm(prev => ({ ...prev, price_per_night: e.target.value }))}
                  placeholder="1200"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="price_per_week">Pris pr. uge (DKK)</Label>
                <Input
                  id="price_per_week"
                  type="number"
                  min={0}
                  value={form.price_per_week}
                  onChange={e => setForm(prev => ({ ...prev, price_per_week: e.target.value }))}
                  placeholder="7000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cleaning_fee">Rengøringsgebyr (DKK)</Label>
                <Input
                  id="cleaning_fee"
                  type="number"
                  min={0}
                  value={form.cleaning_fee}
                  onChange={e => setForm(prev => ({ ...prev, cleaning_fee: e.target.value }))}
                  placeholder="800"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* House Rules */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-display text-xl font-semibold text-primary">Husregler</h2>
            <Textarea
              id="house_rules"
              value={form.house_rules}
              onChange={e => setForm(prev => ({ ...prev, house_rules: e.target.value }))}
              placeholder="F.eks. Ingen rygning indendørs, Ingen fester..."
              rows={3}
            />
          </div>

          {/* Images */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-display text-xl font-semibold text-primary">Billeder</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {form.images.map((img, i) => (
                <div key={i} className="relative aspect-video rounded-lg overflow-hidden group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <label className="aspect-video rounded-lg border-2 border-dashed border-border hover:border-accent cursor-pointer flex flex-col items-center justify-center text-muted-foreground hover:text-accent transition-colors">
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-sm">Upload billeder</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" variant="gold" size="lg" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isEdit ? 'Gem ændringer' : 'Opret sommerhus'}
            </Button>
            <Link to="/owner/properties">
              <Button type="button" variant="outline" size="lg">Annuller</Button>
            </Link>
          </div>
        </form>
      </div>
    </OwnerLayout>
  );
}
