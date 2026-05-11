import { useState, useRef, useCallback, memo, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Loader2, ImagePlus, GripVertical, Trash2, Star, BedDouble, X, CheckCircle2, Layers,
  Upload, Camera, Film, MapIcon, Eye, Grid3X3, LayoutGrid, Tag, Sparkles, Crown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface BedroomImage { url: string; label: string; description?: string; }
export interface ImageLabel { url: string; label: string; }

interface UploadProps { listingSlug: string; onUploaded: (url: string) => void; }
interface GalleryProps {
  images: string[]; heroImage: string; bedroomImages: BedroomImage[];
  imageLabels: ImageLabel[]; comboHeroImages?: string[];
  onImagesChange: (imgs: string[]) => void; onHeroChange: (url: string) => void;
  onBedroomImagesChange: (bi: BedroomImage[]) => void; onImageLabelsChange: (labels: ImageLabel[]) => void;
  onComboHeroToggle?: (url: string) => void;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

const IMAGE_CATEGORIES = [
  { value: '', label: 'Ingen kategori', icon: '📷' },
  { value: 'hero', label: 'Hero', icon: '⭐' },
  { value: 'outdoor', label: 'Udendørs', icon: '🌿' },
  { value: 'living', label: 'Stue', icon: '🛋️' },
  { value: 'kitchen', label: 'Køkken', icon: '🍳' },
  { value: 'bathroom', label: 'Badeværelse', icon: '🚿' },
  { value: 'bedroom-1', label: 'Soveværelse 1', icon: '🛏️' },
  { value: 'bedroom-2', label: 'Soveværelse 2', icon: '🛏️' },
  { value: 'bedroom-3', label: 'Soveværelse 3', icon: '🛏️' },
  { value: 'bedroom-4', label: 'Soveværelse 4', icon: '🛏️' },
  { value: 'facilities', label: 'Faciliteter', icon: '🏊' },
  { value: 'area', label: 'Området', icon: '🗺️' },
  { value: 'detail', label: 'Detalje', icon: '✨' },
];

const BEDROOM_OPTIONS = [
  { value: '', label: '—' },
  { value: 'Soveværelse nr. 1', label: 'Soveværelse 1' },
  { value: 'Soveværelse nr. 2', label: 'Soveværelse 2' },
  { value: 'Soveværelse nr. 3', label: 'Soveværelse 3' },
  { value: 'Soveværelse nr. 4', label: 'Soveværelse 4' },
];

// ═══ PREMIUM UPLOAD ZONE ═══
export function ListingImageUpload({ listingSlug, onUploaded }: UploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [recentUploads, setRecentUploads] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const valid = files.filter(f => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE);
    if (valid.length === 0) { toast({ title: 'Ingen gyldige billeder', variant: 'destructive' }); return; }

    setUploading(true);
    setProgress({ done: 0, total: valid.length });
    const newUrls: string[] = [];
    for (const file of valid) {
      const ext = file.name.split('.').pop();
      const path = `${listingSlug}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const { error } = await supabase.storage.from('listing-images').upload(path, file, { cacheControl: '31536000', upsert: false });
      if (!error) {
        const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(path);
        onUploaded(urlData.publicUrl);
        newUrls.push(urlData.publicUrl);
      }
      setProgress(prev => ({ ...prev, done: prev.done + 1 }));
    }
    if (newUrls.length > 0) {
      toast({ title: `${newUrls.length} billede${newUrls.length > 1 ? 'r' : ''} uploadet` });
      setRecentUploads(newUrls);
      setTimeout(() => setRecentUploads([]), 3000);
    }
    setUploading(false);
    setProgress({ done: 0, total: 0 });
    if (fileRef.current) fileRef.current.value = '';
  }, [listingSlug, onUploaded, toast]);

  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => processFiles(Array.from(e.target.files || []))} />
      <div
        onDrop={e => { e.preventDefault(); setDragOver(false); processFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))); }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
        onClick={() => !uploading && fileRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-all duration-300',
          dragOver
            ? 'border-primary bg-primary/5 scale-[1.01] shadow-lg shadow-primary/10'
            : 'border-border/40 hover:border-primary/40 hover:bg-muted/20',
          uploading && 'pointer-events-none opacity-70'
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Uploader billeder...</p>
              <p className="text-xs text-muted-foreground mt-0.5">{progress.done} af {progress.total} færdige</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
              dragOver ? 'bg-primary/15' : 'bg-muted/40'
            )}>
              <Upload className={cn('h-7 w-7 transition-colors', dragOver ? 'text-primary' : 'text-muted-foreground')} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                {dragOver ? 'Slip for at uploade' : 'Træk billeder hertil'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                eller klik for at vælge · JPG, PNG, WebP · Max 20 MB
              </p>
            </div>
          </div>
        )}
      </div>
      {uploading && progress.total > 0 && (
        <Progress value={(progress.done / progress.total) * 100} className="h-1.5 rounded-full" />
      )}

      {/* Recent uploads flash */}
      {recentUploads.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="text-xs font-medium" style={{ color: 'hsl(142, 71%, 45%)' }}>
            {recentUploads.length} nye billeder tilføjet til galleriet
          </span>
          <div className="flex -space-x-2 ml-auto">
            {recentUploads.slice(0, 4).map((url, i) => (
              <img key={i} src={url} className="w-8 h-8 rounded-lg object-cover border-2 border-card" alt="" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══ PREMIUM SORTABLE IMAGE CARD ═══
const SortableImageItem = memo(function SortableImageItem({
  url, index, isHero, isComboHero, bedroomLabel, imageLabel,
  onSetHero, onRemove, onBedroomChange, onImageLabelChange, onComboHeroToggle,
  isSelected, onToggleSelect, viewMode,
}: {
  url: string; index: number; isHero: boolean; isComboHero: boolean;
  bedroomLabel: string; imageLabel: string;
  onSetHero: () => void; onRemove: () => void;
  onBedroomChange: (label: string) => void; onImageLabelChange: (label: string) => void;
  onComboHeroToggle?: () => void;
  isSelected: boolean; onToggleSelect: () => void;
  viewMode: 'grid' | 'large';
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.7 : 1 };
  const [showActions, setShowActions] = useState(false);

  const categoryLabel = IMAGE_CATEGORIES.find(c => c.value === imageLabel)?.label;
  const categoryIcon = IMAGE_CATEGORIES.find(c => c.value === imageLabel)?.icon;

  return (
    <div ref={setNodeRef} style={style}
      className={cn(
        'relative group rounded-2xl overflow-hidden transition-all duration-200',
        isSelected ? 'ring-2 ring-primary shadow-lg shadow-primary/10' : isHero ? 'ring-2 ring-primary/40' : 'ring-1 ring-border/30 hover:ring-border/60',
        isDragging && 'shadow-2xl scale-[1.03]',
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Image */}
      <div className={cn('relative bg-muted', viewMode === 'large' ? 'aspect-[3/2]' : 'aspect-square')}>
        <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />

        {/* Gradient overlay on hover */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-200',
          showActions || isSelected ? 'opacity-100' : 'opacity-0'
        )} />

        {/* Selection checkbox - always visible area */}
        <button type="button" onClick={e => { e.stopPropagation(); onToggleSelect(); }}
          className="absolute top-3 left-3 z-20">
          <div className={cn(
            'w-6 h-6 rounded-lg flex items-center justify-center transition-all',
            isSelected
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-black/40 backdrop-blur-sm border border-white/20 hover:bg-black/60'
          )}>
            {isSelected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="w-3 h-3 rounded border border-white/60" />}
          </div>
        </button>

        {/* Drag handle */}
        <button {...attributes} {...listeners}
          className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none focus:outline-none z-10" />

        {/* Position badge */}
        <div className="absolute top-3 right-3 z-20">
          <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg tabular-nums">
            {index + 1}
          </span>
        </div>

        {/* Hero crown */}
        {isHero && (
          <div className="absolute top-3 right-10 z-20">
            <div className="bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
              <Crown className="h-3 w-3" /> Hero
            </div>
          </div>
        )}

        {/* Bottom tags */}
        <div className="absolute bottom-3 left-3 right-3 z-20 flex items-end justify-between">
          <div className="flex flex-wrap gap-1.5">
            {isComboHero && (
              <span className="bg-accent/90 text-accent-foreground text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                ✦ Kombi-hero
              </span>
            )}
            {bedroomLabel && (
              <span className="bg-black/50 text-white text-[9px] font-medium px-2 py-0.5 rounded-md backdrop-blur-sm flex items-center gap-1">
                <BedDouble className="h-2.5 w-2.5" /> {bedroomLabel}
              </span>
            )}
            {categoryLabel && (
              <span className="bg-primary/80 text-primary-foreground text-[9px] font-medium px-2 py-0.5 rounded-md backdrop-blur-sm">
                {categoryIcon} {categoryLabel}
              </span>
            )}
          </div>

          {/* Quick drag indicator */}
          <div className={cn(
            'bg-black/40 backdrop-blur-sm rounded-lg p-1.5 transition-opacity',
            showActions ? 'opacity-100' : 'opacity-0'
          )}>
            <GripVertical className="h-3.5 w-3.5 text-white/70" />
          </div>
        </div>
      </div>

      {/* Controls panel */}
      <div className={cn(
        'bg-card border-t border-border/20 transition-all overflow-hidden',
        showActions || isSelected ? 'max-h-40 p-3' : 'max-h-0 p-0'
      )}>
        <div className="space-y-2">
          {/* Category selector */}
          <Select value={imageLabel} onValueChange={onImageLabelChange}>
            <SelectTrigger className="h-7 text-[11px] rounded-lg bg-background/50 border-border/30">
              <SelectValue placeholder="📷 Kategori..." />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_CATEGORIES.map(c => (
                <SelectItem key={c.value || '_none'} value={c.value || '_none'} className="text-xs">
                  {c.icon} {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Bedroom selector */}
          <Select value={bedroomLabel} onValueChange={onBedroomChange}>
            <SelectTrigger className="h-7 text-[11px] rounded-lg bg-background/50 border-border/30">
              <SelectValue placeholder="🛏️ Soveværelse..." />
            </SelectTrigger>
            <SelectContent>
              {BEDROOM_OPTIONS.map(o => (
                <SelectItem key={o.value || '_none'} value={o.value || '_none'} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant={isHero ? 'default' : 'outline'} className="h-6 text-[10px] flex-1 px-2 rounded-lg gap-1" onClick={onSetHero}>
              <Crown className="h-2.5 w-2.5" /> {isHero ? 'Hero ✓' : 'Sæt hero'}
            </Button>
            {onComboHeroToggle && (
              <Button size="sm" variant={isComboHero ? 'default' : 'outline'} className="h-6 text-[10px] flex-1 px-2 rounded-lg gap-1" onClick={onComboHeroToggle}>
                <Layers className="h-2.5 w-2.5" /> {isComboHero ? 'Kombi ✓' : 'Kombi'}
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 rounded-lg text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Slet billede?</AlertDialogTitle>
                  <AlertDialogDescription>Kan ikke fortrydes.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuller</AlertDialogCancel>
                  <AlertDialogAction onClick={onRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Slet</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
});

// ═══ PREMIUM GALLERY ═══
export const SortableImageGallery = memo(function SortableImageGallery({
  images, heroImage, bedroomImages, imageLabels, comboHeroImages,
  onImagesChange, onHeroChange, onBedroomImagesChange, onImageLabelsChange, onComboHeroToggle,
}: GalleryProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'large'>('large');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const isSelecting = selected.size > 0;
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.indexOf(active.id as string);
      const newIndex = images.indexOf(over.id as string);
      onImagesChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  const getBedroomLabel = (url: string) => bedroomImages.find(b => b.url === url)?.label || '';
  const getImageLabel = (url: string) => imageLabels.find(l => l.url === url)?.label || '';

  const setBedroomLabel = (url: string, label: string) => {
    const resolved = label === '_none' ? '' : label;
    const filtered = bedroomImages.filter(b => b.url !== url);
    if (resolved) filtered.push({ url, label: resolved });
    onBedroomImagesChange(filtered);
  };

  const setImageLabel = (url: string, label: string) => {
    const resolved = label === '_none' ? '' : label;
    const filtered = imageLabels.filter(l => l.url !== url);
    if (resolved.trim()) filtered.push({ url, label: resolved.trim() });
    onImageLabelsChange(filtered);
  };

  const setSelectedImageLabel = (label: string) => {
    const urls = Array.from(selected);
    const untouched = imageLabels.filter(l => !selected.has(l.url));
    const next = label === '_none'
      ? untouched
      : [...untouched, ...urls.map(url => ({ url, label }))];
    onImageLabelsChange(next);
    toast({ title: `${urls.length} billede${urls.length > 1 ? 'r' : ''} opdateret` });
  };

  const removeImage = (url: string) => {
    onImagesChange(images.filter(i => i !== url));
    onBedroomImagesChange(bedroomImages.filter(b => b.url !== url));
    onImageLabelsChange(imageLabels.filter(l => l.url !== url));
    if (heroImage === url) onHeroChange('');
  };

  const toggleSelect = (url: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url); else next.add(url);
      return next;
    });
  };

  const deleteSelected = () => {
    onImagesChange(images.filter(i => !selected.has(i)));
    onBedroomImagesChange(bedroomImages.filter(b => !selected.has(b.url)));
    onImageLabelsChange(imageLabels.filter(l => !selected.has(l.url)));
    if (selected.has(heroImage)) onHeroChange('');
    toast({ title: `${selected.size} billede${selected.size > 1 ? 'r' : ''} slettet` });
    setSelected(new Set());
  };

  // Category stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = { all: images.length };
    images.forEach(url => {
      const label = getImageLabel(url) || 'uncategorized';
      stats[label] = (stats[label] || 0) + 1;
    });
    return stats;
  }, [images, imageLabels]);

  const filteredImages = filterCategory === 'all'
    ? images
    : filterCategory === 'uncategorized'
      ? images.filter(url => !getImageLabel(url))
      : images.filter(url => getImageLabel(url) === filterCategory);

  const hasHero = !!heroImage;

  // ═══ EMPTY STATE ═══
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8">
        <div className="w-20 h-20 rounded-3xl bg-muted/30 flex items-center justify-center mb-5">
          <Camera className="h-9 w-9 text-muted-foreground/40" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">Ingen billeder endnu</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Upload dine første billeder ovenfor for at bygge et smukt galleri til din listing
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ═══ HERO PREVIEW ═══ */}
      {hasHero && (
        <div className="rounded-2xl overflow-hidden ring-1 ring-border/20">
          <div className="relative aspect-[21/9] bg-muted">
            <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-5 flex items-center gap-2">
              <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg">
                <Crown className="h-3.5 w-3.5" /> Hero-billede
              </div>
            </div>
            <div className="absolute bottom-4 right-5">
              <span className="bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-lg">
                Vises som forsidebillede på alle kanaler
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TOOLBAR ═══ */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Gallery stats */}
        <div className="flex items-center gap-2 mr-auto">
          <span className="text-xs font-semibold text-foreground">{images.length} billeder</span>
          {!hasHero && (
            <span className="text-[10px] font-medium text-amber-500 flex items-center gap-1">
              <Star className="h-3 w-3" /> Intet hero valgt
            </span>
          )}
        </div>

        {/* Category filter chips */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button onClick={() => setFilterCategory('all')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors whitespace-nowrap',
              filterCategory === 'all' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/30'
            )}>
            Alle ({categoryStats.all || 0})
          </button>
          {IMAGE_CATEGORIES.filter(c => c.value && categoryStats[c.value]).map(c => (
            <button key={c.value} onClick={() => setFilterCategory(c.value)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors whitespace-nowrap',
                filterCategory === c.value ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/30'
              )}>
              {c.icon} {categoryStats[c.value]}
            </button>
          ))}
          {categoryStats.uncategorized > 0 && (
            <button onClick={() => setFilterCategory('uncategorized')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors whitespace-nowrap',
                filterCategory === 'uncategorized' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/30'
              )}>
              📷 Uden ({categoryStats.uncategorized})
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-border/30 overflow-hidden">
          <button onClick={() => setViewMode('large')}
            className={cn('p-1.5 transition-colors', viewMode === 'large' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/30')}>
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setViewMode('grid')}
            className={cn('p-1.5 transition-colors', viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/30')}>
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ═══ SELECTION BAR ═══ */}
      {isSelecting && (
        <div className="flex items-center gap-2 sticky top-0 z-30 bg-card/95 backdrop-blur-md py-2.5 px-4 rounded-xl border border-primary/20 shadow-lg">
          <span className="text-sm font-semibold text-foreground">{selected.size} valgt</span>
          <Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg" onClick={() => setSelected(new Set(images))}>Vælg alle</Button>
          <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1 rounded-lg" onClick={() => setSelected(new Set())}><X className="h-3 w-3" /> Fravælg</Button>
          <Select onValueChange={setSelectedImageLabel}>
            <SelectTrigger className="h-7 w-[170px] rounded-lg text-[11px]">
              <SelectValue placeholder="Sæt kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Fjern kategori</SelectItem>
              {IMAGE_CATEGORIES.filter(c => c.value).map(c => (
                <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" className="h-7 text-[11px] gap-1.5 rounded-lg">
                <Trash2 className="h-3 w-3" /> Slet {selected.size}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Slet {selected.size} billeder?</AlertDialogTitle>
                <AlertDialogDescription>Kan ikke fortrydes.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuller</AlertDialogCancel>
                <AlertDialogAction onClick={deleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Slet</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* ═══ IMAGE GRID ═══ */}
      {filterCategory !== 'all' && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-600">
          Reordering gemmes i den fulde billedrækkefølge. Skift til "Alle" for den mest præcise drag-and-drop sortering.
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredImages} strategy={rectSortingStrategy}>
          <div className={cn(
            'grid gap-3',
            viewMode === 'large'
              ? 'grid-cols-2 md:grid-cols-3'
              : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5'
          )}>
            {filteredImages.map((url, i) => (
              <SortableImageItem
                key={url}
                url={url} index={images.indexOf(url)}
                isHero={heroImage === url}
                isComboHero={(comboHeroImages || []).includes(url)}
                bedroomLabel={getBedroomLabel(url)}
                imageLabel={getImageLabel(url)}
                onSetHero={() => onHeroChange(url)}
                onRemove={() => removeImage(url)}
                onBedroomChange={l => setBedroomLabel(url, l)}
                onImageLabelChange={l => setImageLabel(url, l)}
                onComboHeroToggle={onComboHeroToggle ? () => onComboHeroToggle(url) : undefined}
                isSelected={selected.has(url)}
                onToggleSelect={() => toggleSelect(url)}
                viewMode={viewMode}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
});
