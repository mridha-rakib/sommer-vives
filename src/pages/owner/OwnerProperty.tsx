import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertCircle,
  Bath,
  BedDouble,
  Building2,
  Edit3,
  Eye,
  Globe,
  Image,
  ImagePlus,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UploadCloud,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  createOwnerListing,
  deleteOwnerListing,
  getOwnerListings,
  setOwnerListingPublished,
  updateOwnerListing,
  type OwnerListing,
  type OwnerListingFormValues,
} from '@/lib/owner-listings-api';
import { useTranslation, type Language } from '@/lib/i18n';
import { LocationPicker } from '@/components/owner/LocationPicker';


const localeCodes: Record<Language, string> = {
  da: 'da-DK',
  en: 'en-US',
  de: 'de-DE',
  nl: 'nl-NL',
};

const emptyForm: OwnerListingFormValues = {
  name: '',
  description: '',
  address: '',
  region: '',
  property_type: 'Holiday home',
  max_guests: 4,
  bedrooms: 2,
  bathrooms: 1,
  base_price_per_night: 1200,
  weekend_price_per_night: null,
  cleaning_fee: null,
  hero_image: '',
  images: [],
  amenities: [],
  house_rules: '',
  latitude: null,
  longitude: null,
};


const fromListing = (listing: OwnerListing): OwnerListingFormValues => ({
  name: listing.name || '',
  description: listing.description || '',
  address: listing.address || '',
  region: listing.region || '',
  property_type: listing.property_type || 'Holiday home',
  max_guests: listing.max_guests || 1,
  bedrooms: listing.bedrooms ?? null,
  bathrooms: listing.bathrooms ?? null,
  base_price_per_night: (listing.base_price_per_night || 0) / 100,
  weekend_price_per_night: listing.weekend_price_per_night ? listing.weekend_price_per_night / 100 : null,
  cleaning_fee: listing.cleaning_fee ? listing.cleaning_fee / 100 : null,
  hero_image: listing.hero_image || '',
  images: listing.images || [],
  amenities: listing.amenities || [],
  house_rules: listing.house_rules || '',
  latitude: (listing as { latitude?: number | null }).latitude ?? null,
  longitude: (listing as { longitude?: number | null }).longitude ?? null,
});


const splitList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const maxImageSize = 20 * 1024 * 1024;

const getListingImageStoragePath = (url: string) => {
  try {
    const pathname = new URL(url).pathname;
    const marker = '/object/public/listing-images/';
    const index = pathname.indexOf(marker);
    if (index < 0) return null;
    return decodeURIComponent(pathname.slice(index + marker.length));
  } catch {
    return null;
  }
};

function numberOrNull(value: FormDataEntryValue | null) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
}

function ImageManager({
  ownerId,
  listing,
  form,
  onChange,
}: {
  ownerId: string;
  listing: OwnerListing | null;
  form: OwnerListingFormValues;
  onChange: (next: OwnerListingFormValues) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [cloudUrl, setCloudUrl] = useState('');
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [editedUrl, setEditedUrl] = useState('');
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const allImages = Array.from(new Set([form.hero_image, ...form.images].filter(Boolean)));

  const updateImages = (images: string[], heroImage = form.hero_image) => {
    const cleanedImages = Array.from(new Set(images.map((url) => url.trim()).filter(Boolean)));
    const nextHero = heroImage.trim() || cleanedImages[0] || '';
    onChange({
      ...form,
      hero_image: nextHero,
      images: cleanedImages.filter((url) => url !== nextHero),
    });
  };

  const addImages = (urls: string[]) => {
    const cleaned = urls.map((url) => url.trim()).filter(Boolean);
    if (cleaned.length === 0) return;
    updateImages([...allImages, ...cleaned], form.hero_image || cleaned[0]);
  };

  const uploadFiles = async (files: File[]) => {
    const valid = files.filter((file) => allowedImageTypes.includes(file.type) && file.size <= maxImageSize);
    if (valid.length === 0) {
      toast.error('Choose JPG, PNG, WebP, AVIF, or GIF images up to 20 MB');
      return;
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      const folder = listing?.slug || `${ownerId}/drafts`;

      for (const file of valid) {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage
          .from('listing-images')
          .upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type });

        if (error) throw new Error(error.message);

        const { data } = supabase.storage.from('listing-images').getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }

      addImages(uploaded);
      toast.success(`${uploaded.length} image${uploaded.length === 1 ? '' : 's'} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not upload images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (url: string) => {
    setDeletingUrl(url);
    try {
      const storagePath = getListingImageStoragePath(url);
      if (storagePath) {
        const { error } = await supabase.storage.from('listing-images').remove([storagePath]);
        if (error) throw new Error(error.message);
      }

      const next = allImages.filter((imageUrl) => imageUrl !== url);
      updateImages(next, form.hero_image === url ? next[0] || '' : form.hero_image);
      if (viewingUrl === url) setViewingUrl(null);
      if (editingUrl === url) setEditingUrl(null);
      toast.success('Image deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete image');
    } finally {
      setDeletingUrl(null);
    }
  };

  const saveEditedUrl = () => {
    if (!editingUrl) return;
    const cleaned = editedUrl.trim();
    if (!cleaned) {
      toast.error('Image URL is required');
      return;
    }
    const next = allImages.map((url) => (url === editingUrl ? cleaned : url));
    updateImages(next, form.hero_image === editingUrl ? cleaned : form.hero_image);
    setEditingUrl(null);
    setEditedUrl('');
  };

  return (
    <div className="md:col-span-2 space-y-4 rounded-xl border border-border/60 bg-muted/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Images</h3>
          <p className="text-xs text-muted-foreground">Upload from your device or add cloud-hosted image URLs.</p>
        </div>
        <Badge variant="outline">{allImages.length} total</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/60 p-4 text-center hover:border-primary/40">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              uploadFiles(Array.from(event.target.files || []));
              event.currentTarget.value = '';
            }}
          />
          {uploading ? <Loader2 className="mb-2 h-6 w-6 animate-spin text-primary" /> : <UploadCloud className="mb-2 h-6 w-6 text-primary" />}
          <span className="text-sm font-medium text-foreground">{uploading ? 'Uploading...' : 'Upload local images'}</span>
          <span className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP, AVIF, GIF. Max 20 MB.</span>
        </label>

        <div className="flex min-h-32 flex-col justify-center rounded-xl border border-border bg-background/60 p-4">
          <Label htmlFor="cloud_image_url" className="mb-2">Cloud image URL</Label>
          <div className="flex gap-2">
            <Input
              id="cloud_image_url"
              value={cloudUrl}
              placeholder="https://..."
              onChange={(event) => setCloudUrl(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                addImages(splitList(cloudUrl));
                setCloudUrl('');
              }}
            >
              <ImagePlus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {allImages.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {allImages.map((url) => (
            <div key={url} className="group overflow-hidden rounded-xl border border-border bg-card">
              <button type="button" className="block aspect-[4/3] w-full bg-muted" onClick={() => setViewingUrl(url)}>
                <img src={url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              </button>
              <div className="space-y-2 p-2">
                {form.hero_image === url && <Badge className="w-full justify-center">Cover</Badge>}
                <div className="grid grid-cols-2 gap-1.5">
                  <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => updateImages(allImages, url)}>
                    Cover
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => setViewingUrl(url)}>
                    View
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => {
                      setEditingUrl(url);
                      setEditedUrl(url);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs text-destructive hover:text-destructive"
                    disabled={deletingUrl === url}
                    onClick={() => removeImage(url)}
                  >
                    {deletingUrl === url ? 'Deleting' : 'Delete'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-background/50 p-8 text-center text-sm text-muted-foreground">
          No images added yet.
        </div>
      )}

      <Dialog open={!!viewingUrl} onOpenChange={(open) => !open && setViewingUrl(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Image detail</DialogTitle>
            <DialogDescription>Preview, copy the image URL, or make it the cover image.</DialogDescription>
          </DialogHeader>
          {viewingUrl && (
            <div className="space-y-4">
              <div className="max-h-[65vh] overflow-hidden rounded-xl bg-muted">
                <img src={viewingUrl} alt="" className="mx-auto max-h-[65vh] w-auto object-contain" />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input readOnly value={viewingUrl} className="font-mono text-xs" />
                <Button type="button" variant="outline" onClick={() => updateImages(allImages, viewingUrl)}>Set cover</Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={deletingUrl === viewingUrl}
                  onClick={() => removeImage(viewingUrl)}
                  className="text-destructive hover:text-destructive"
                >
                  {deletingUrl === viewingUrl ? 'Deleting' : 'Delete'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingUrl} onOpenChange={(open) => !open && setEditingUrl(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit image</DialogTitle>
            <DialogDescription>Replace the stored URL with another local or cloud-hosted image URL.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit_image_url">Image URL</Label>
            <Input id="edit_image_url" value={editedUrl} onChange={(event) => setEditedUrl(event.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingUrl(null)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="button" variant="gold" onClick={saveEditedUrl}>
              <Save className="mr-2 h-4 w-4" />
              Save image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HomeDialog({
  ownerId,
  listing,
  open,
  onOpenChange,
  onSubmit,
  saving,
}: {
  ownerId: string;
  listing: OwnerListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: OwnerListingFormValues) => void;
  saving: boolean;
}) {
  const initial = useMemo(() => (listing ? fromListing(listing) : emptyForm), [listing]);
  const [form, setForm] = useState(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial, open]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values: OwnerListingFormValues = {
      name: String(data.get('name') || '').trim(),
      description: String(data.get('description') || ''),
      address: String(data.get('address') || ''),
      region: String(data.get('region') || ''),
      property_type: String(data.get('property_type') || ''),
      max_guests: Math.max(1, Math.round(Number(data.get('max_guests')) || 1)),
      bedrooms: numberOrNull(data.get('bedrooms')),
      bathrooms: numberOrNull(data.get('bathrooms')),
      base_price_per_night: Math.max(0, Number(data.get('base_price_per_night')) || 0),
      weekend_price_per_night: numberOrNull(data.get('weekend_price_per_night')),
      cleaning_fee: numberOrNull(data.get('cleaning_fee')),
      hero_image: String(data.get('hero_image') || ''),
      images: splitList(String(data.get('images') || '')),
      amenities: splitList(String(data.get('amenities') || '')),
      house_rules: String(data.get('house_rules') || ''),
      latitude: form.latitude,
      longitude: form.longitude,
    };


    if (!values.name) {
      toast.error('Name is required');
      return;
    }

    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{listing ? 'Edit home' : 'Create home'}</DialogTitle>
          <DialogDescription>
            Published homes appear automatically in the public Holiday Homes section.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input id="region" name="region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="property_type">Type</Label>
              <Input id="property_type" name="property_type" value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_guests">Guests</Label>
              <Input id="max_guests" name="max_guests" type="number" min={1} value={form.max_guests} onChange={(e) => setForm({ ...form, max_guests: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input id="bedrooms" name="bedrooms" type="number" min={0} value={form.bedrooms ?? ''} onChange={(e) => setForm({ ...form, bedrooms: numberOrNull(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input id="bathrooms" name="bathrooms" type="number" min={0} value={form.bathrooms ?? ''} onChange={(e) => setForm({ ...form, bathrooms: numberOrNull(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base_price_per_night">Nightly price (DKK)</Label>
              <Input id="base_price_per_night" name="base_price_per_night" type="number" min={0} value={form.base_price_per_night} onChange={(e) => setForm({ ...form, base_price_per_night: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekend_price_per_night">Weekend price (DKK)</Label>
              <Input id="weekend_price_per_night" name="weekend_price_per_night" type="number" min={0} value={form.weekend_price_per_night ?? ''} onChange={(e) => setForm({ ...form, weekend_price_per_night: numberOrNull(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cleaning_fee">Cleaning fee (DKK)</Label>
              <Input id="cleaning_fee" name="cleaning_fee" type="number" min={0} value={form.cleaning_fee ?? ''} onChange={(e) => setForm({ ...form, cleaning_fee: numberOrNull(e.target.value) })} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <LocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              address={[form.address, form.region].filter(Boolean).join(', ')}
              onChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })}
            />

            <input type="hidden" name="hero_image" value={form.hero_image} />
            <input type="hidden" name="images" value={form.images.join('\n')} />
            <ImageManager ownerId={ownerId} listing={listing} form={form} onChange={setForm} />
            <div className="space-y-2">
              <Label htmlFor="amenities">Amenities</Label>
              <Textarea id="amenities" name="amenities" rows={5} value={form.amenities.join(', ')} onChange={(e) => setForm({ ...form, amenities: splitList(e.target.value) })} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="house_rules">House rules</Label>
              <Textarea id="house_rules" name="house_rules" rows={3} value={form.house_rules} onChange={(e) => setForm({ ...form, house_rules: e.target.value })} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {listing ? 'Save changes' : 'Create home'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function OwnerProperty() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<OwnerListing | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<OwnerListing | null>(null);

  const queryKey = ['owner-listings', user?.id];
  const { data: listings = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () => getOwnerListings(user!.id),
    enabled: !!user?.id,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const createMutation = useMutation({
    mutationFn: (values: OwnerListingFormValues) => createOwnerListing(user!.id, values),
    onSuccess: () => {
      toast.success('Home created');
      setDialogOpen(false);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not create home'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ listingId, values }: { listingId: string; values: OwnerListingFormValues }) =>
      updateOwnerListing(user!.id, listingId, values),
    onSuccess: () => {
      toast.success('Home updated');
      setDialogOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update home'),
  });

  const publishMutation = useMutation({
    mutationFn: ({ listingId, published }: { listingId: string; published: boolean }) =>
      setOwnerListingPublished(user!.id, listingId, published),
    onSuccess: (_, vars) => {
      toast.success(vars.published ? 'Home published to Holiday Homes' : 'Home unpublished');
      invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update publish status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (listingId: string) => deleteOwnerListing(user!.id, listingId),
    onSuccess: () => {
      toast.success('Home deleted');
      setDeleting(null);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not delete home'),
  });

  const formatMoney = (value: number | null | undefined) => {
    if (value == null || Number(value) <= 0) return '-';
    const formatted = (Number(value) / 100).toLocaleString(localeCodes[language]);
    return language === 'da' ? `${formatted} kr` : `DKK ${formatted}`;
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (listing: OwnerListing) => {
    setEditing(listing);
    setDialogOpen(true);
  };

  const handleSubmit = (values: OwnerListingFormValues) => {
    if (editing) {
      updateMutation.mutate({ listingId: editing.id, values });
      return;
    }
    createMutation.mutate(values);
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[hsl(var(--gold))] border-t-transparent rounded-full animate-spin" />
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">My homes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create, publish, edit, and delete your holiday homes. Published homes are shown on the public Holiday Homes page.
            </p>
          </div>
          <Button variant="gold" className="gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Add home
          </Button>
        </div>

        {isError && (
          <Card>
            <CardContent className="p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-destructive/70" />
                <div>
                  <div className="font-medium text-foreground">{t('owner.property.errorTitle')}</div>
                  <div className="text-sm text-muted-foreground">
                    {error instanceof Error ? error.message : t('owner.property.errorDescription')}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                {t('owner.property.retry')}
              </Button>
            </CardContent>
          </Card>
        )}

        {listings.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-7 h-7 text-muted-foreground/30" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground mb-2">No homes yet</h2>
              <p className="text-muted-foreground text-sm mb-6">Add your first home as a draft, then publish it when it is ready.</p>
              <Button variant="gold" className="gap-2" onClick={openCreate}>
                <Plus className="w-4 h-4" />
                Add home
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {listings.map((listing) => {
              const cover = listing.hero_image || listing.images?.[0];
              const isBusy = publishMutation.isPending || deleteMutation.isPending;

              return (
                <Card key={listing.id} className="overflow-hidden">
                  <div className="aspect-[16/9] bg-muted relative">
                    {cover ? (
                      <img src={cover} alt={listing.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground/40">
                        <Image className="w-10 h-10" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge variant="outline" className={listing.is_active ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' : 'bg-amber-400/15 text-amber-400 border-amber-400/20'}>
                        {listing.is_active ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-5 space-y-5">
                    <div>
                      <h2 className="font-display text-xl font-bold text-foreground">{listing.name}</h2>
                      {[listing.address, listing.region].filter(Boolean).length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          {[listing.address, listing.region].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {listing.max_guests} guests</span>
                      <span className="flex items-center gap-1.5"><BedDouble className="w-4 h-4" /> {listing.bedrooms ?? 0} bedrooms</span>
                      <span className="flex items-center gap-1.5"><Bath className="w-4 h-4" /> {listing.bathrooms ?? 0} bathrooms</span>
                    </div>

                    {listing.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{listing.description}</p>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-muted/30 p-3">
                        <div className="text-[11px] text-muted-foreground">Per night</div>
                        <div className="text-sm font-semibold text-foreground">{formatMoney(listing.base_price_per_night)}</div>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3">
                        <div className="text-[11px] text-muted-foreground">Weekend</div>
                        <div className="text-sm font-semibold text-foreground">{formatMoney(listing.weekend_price_per_night)}</div>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3">
                        <div className="text-[11px] text-muted-foreground">Cleaning</div>
                        <div className="text-sm font-semibold text-foreground">{formatMoney(listing.cleaning_fee)}</div>
                      </div>
                    </div>

                    {listing.amenities && listing.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {listing.amenities.slice(0, 8).map((amenity) => (
                          <Badge key={amenity} variant="secondary" className="text-xs rounded-lg">{amenity}</Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={listing.is_active ? 'outline' : 'gold'}
                        size="sm"
                        className="gap-1.5"
                        disabled={isBusy}
                        onClick={() => publishMutation.mutate({ listingId: listing.id, published: !listing.is_active })}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        {listing.is_active ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openEdit(listing)}>
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                      {listing.is_active && (
                        <Button variant="outline" size="sm" className="gap-1.5" asChild>
                          <Link to={`/listing/${listing.slug}`} target="_blank">
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </Link>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleting(listing)}>
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <HomeDialog
        ownerId={user!.id}
        listing={editing}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={handleSubmit}
        saving={saving}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this home?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {deleting?.name}. Published homes disappear from Holiday Homes immediately when deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OwnerLayout>
  );
}
