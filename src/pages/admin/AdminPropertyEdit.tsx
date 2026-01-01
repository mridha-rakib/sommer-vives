import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { useAuth } from "@/lib/auth";

const REGIONS = [
  "Nordjylland",
  "Midtjylland",
  "Syddanmark",
  "Sjælland",
  "Hovedstaden",
  "Bornholm",
];

type FormState = {
  title: string;
  description: string;
  address: string;
  region: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  house_rules: string;
  price_per_night: string;
  price_per_week: string;
  cleaning_fee: string;
  images: string[];
};

export default function AdminPropertyEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    address: "",
    region: "",
    capacity: 4,
    bedrooms: 2,
    bathrooms: 1,
    house_rules: "",
    price_per_night: "",
    price_per_week: "",
    cleaning_fee: "",
    images: [],
  });

  useEffect(() => {
    if (!id) return;
    void loadProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProperty = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("properties").select("*").eq("id", id).single();

    if (error || !data) {
      toast({ title: "Fejl", description: "Kunne ikke indlæse ejendom", variant: "destructive" });
      setLoading(false);
      return;
    }

    setForm({
      title: data.title || "",
      description: data.description || "",
      address: data.address || "",
      region: data.region || "",
      capacity: data.capacity || 4,
      bedrooms: data.bedrooms || 2,
      bathrooms: data.bathrooms || 1,
      house_rules: data.house_rules || "",
      price_per_night: data.price_per_night?.toString() || "",
      price_per_week: data.price_per_week?.toString() || "",
      cleaning_fee: data.cleaning_fee?.toString() || "",
      images: data.images || [],
    });

    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id || "admin"}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error } = await supabase.storage.from("property-images").upload(fileName, file);
      if (error) {
        toast({ title: "Fejl", description: "Kunne ikke uploade billede", variant: "destructive" });
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("property-images").getPublicUrl(fileName);

      newImages.push(publicUrl);
    }

    setForm((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);

    const update = {
      title: form.title,
      description: form.description || null,
      address: form.address,
      region: form.region,
      capacity: form.capacity,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      house_rules: form.house_rules || null,
      price_per_night: form.price_per_night ? parseFloat(form.price_per_night) : null,
      price_per_week: form.price_per_week ? parseFloat(form.price_per_week) : null,
      cleaning_fee: form.cleaning_fee ? parseFloat(form.cleaning_fee) : null,
      images: form.images,
    };

    const { error } = await supabase.from("properties").update(update).eq("id", id);

    if (error) {
      toast({ title: "Fejl", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    toast({ title: "Gemt!", description: "Ejendommen er opdateret." });
    setSaving(false);
    navigate("/admin/properties");
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <Link to="/admin/properties" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Tilbage til ejendomme
        </Link>

        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold text-primary">Rediger ejendom</h1>
          <p className="text-muted-foreground">Rediger tekst, priser og billeder for ejendommen.</p>
        </header>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Indlæser...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-8">
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-display text-xl font-semibold text-primary">Grundlæggende info</h2>

              <div>
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
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
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="region">Region *</Label>
                  <select
                    id="region"
                    value={form.region}
                    onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))}
                    required
                    className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="">Vælg region</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

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
                    onChange={(e) => setForm((p) => ({ ...p, capacity: parseInt(e.target.value) || 1 }))}
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
                    onChange={(e) => setForm((p) => ({ ...p, bedrooms: parseInt(e.target.value) || 0 }))}
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
                    onChange={(e) => setForm((p) => ({ ...p, bathrooms: parseInt(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

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
                    onChange={(e) => setForm((p) => ({ ...p, price_per_night: e.target.value }))}
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
                    onChange={(e) => setForm((p) => ({ ...p, price_per_week: e.target.value }))}
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
                    onChange={(e) => setForm((p) => ({ ...p, cleaning_fee: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-display text-xl font-semibold text-primary">Husregler</h2>
              <Textarea
                id="house_rules"
                value={form.house_rules}
                onChange={(e) => setForm((p) => ({ ...p, house_rules: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-display text-xl font-semibold text-primary">Billeder</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {form.images.map((img, i) => (
                  <div key={i} className="relative aspect-video rounded-lg overflow-hidden group">
                    <img src={img} alt="Ejendomsbillede" className="w-full h-full object-cover" loading="lazy" />
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

            <div className="flex gap-4">
              <Button type="submit" variant="gold" size="lg" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Gem ændringer
              </Button>
              <Button type="button" variant="outline" size="lg" asChild>
                <Link to="/admin/properties">Annuller</Link>
              </Button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
