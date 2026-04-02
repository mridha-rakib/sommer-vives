import { useState, useRef, useCallback, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ImagePlus, GripVertical, Trash2, Star, BedDouble, X, CheckCircle2, Layers } from 'lucide-react';
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

export function ListingImageUpload({ listingSlug, onUploaded }: UploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const valid = files.filter(f => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE);
    if (valid.length === 0) { toast({ title: 'Ingen gyldige billeder', variant: 'destructive' }); return; }

    setUploading(true);
    setProgress({ done: 0, total: valid.length });
    let ok = 0;
    for (const file of valid) {
      const ext = file.name.split('.').pop();
      const path = `${listingSlug}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const { error } = await supabase.storage.from('listing-images').upload(path, file, { cacheControl: '31536000', upsert: false });
      if (!error) {
        const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(path);
        onUploaded(urlData.publicUrl);
        ok++;
      }
      setProgress(prev => ({ ...prev, done: prev.done + 1 }));
    }
    if (ok > 0) toast({ title: `${ok} billede${ok > 1 ? 'r' : ''} uploadet` });
    setUploading(false);
    setProgress({ done: 0, total: 0 });
    if (fileRef.current) fileRef.current.value = '';
  }, [listingSlug, onUploaded, toast]);

  return (
    <div className="space-y-2">
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => processFiles(Array.from(e.target.files || []))} />
      <div
        onDrop={e => { e.preventDefault(); setDragOver(false); processFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))); }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
        onClick={() => !uploading && fileRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'} ${uploading ? 'pointer-events-none opacity-70' : ''}`}
      >
        {uploading ? (
          <><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="text-sm font-medium">Uploader {progress.done}/{progress.total}...</p></>
        ) : (
          <><ImagePlus className="h-8 w-8 text-muted-foreground" /><p className="text-sm font-medium text-foreground">{dragOver ? 'Slip for at uploade' : 'Træk billeder hertil'}</p><p className="text-xs text-muted-foreground">eller klik for at vælge · Max 20 MB</p></>
        )}
      </div>
      {uploading && progress.total > 0 && <Progress value={(progress.done / progress.total) * 100} className="h-2" />}
    </div>
  );
}

const BEDROOM_OPTIONS = [
  { value: '', label: '—' },
  { value: 'Soveværelse nr. 1', label: 'Soveværelse 1' },
  { value: 'Soveværelse nr. 2', label: 'Soveværelse 2' },
  { value: 'Soveværelse nr. 3', label: 'Soveværelse 3' },
  { value: 'Soveværelse nr. 4', label: 'Soveværelse 4' },
];

const SortableImageItem = memo(function SortableImageItem({
  url, index, isHero, isComboHero, bedroomLabel, imageLabel,
  onSetHero, onRemove, onBedroomChange, onImageLabelChange, onComboHeroToggle,
  isSelected, onToggleSelect,
}: {
  url: string; index: number; isHero: boolean; isComboHero: boolean;
  bedroomLabel: string; imageLabel: string;
  onSetHero: () => void; onRemove: () => void;
  onBedroomChange: (label: string) => void; onImageLabelChange: (label: string) => void;
  onComboHeroToggle?: () => void;
  isSelected: boolean; onToggleSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.6 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={`relative group rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-primary ring-2 ring-primary/30' : isHero ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'} ${isDragging ? 'shadow-xl scale-[1.02]' : ''}`}>
      <div className="relative aspect-[4/3] bg-muted">
        <img src={url} alt="" className="w-full h-full object-cover" />
        <button type="button" onClick={e => { e.stopPropagation(); onToggleSelect(); }}
          className="absolute top-2 left-2 z-20 w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer"
          style={{ background: isSelected ? undefined : 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
          <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${isSelected ? 'bg-primary text-primary-foreground' : 'border-2 border-white/80'}`}>
            {isSelected && <CheckCircle2 className="h-4 w-4" />}
          </div>
        </button>
        {isSelected && <div className="absolute inset-0 bg-primary/10 pointer-events-none z-10" />}
        <button {...attributes} {...listeners} className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none focus:outline-none">
          <div className="absolute top-2 left-11 bg-black/50 backdrop-blur-sm rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-white" />
          </div>
        </button>
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">{index + 1}</div>
        <div className="absolute bottom-2 left-2 flex gap-1.5 flex-wrap max-w-[80%]">
          {isHero && <Badge className="text-[10px] bg-primary text-primary-foreground">★ Hero</Badge>}
          {isComboHero && <Badge className="text-[10px] bg-accent text-accent-foreground border border-accent-foreground/20">✦ Kombi</Badge>}
          {bedroomLabel && <Badge variant="secondary" className="text-[10px] gap-0.5 bg-black/60 text-white border-0"><BedDouble className="h-2.5 w-2.5" />{bedroomLabel}</Badge>}
          {imageLabel && <Badge variant="secondary" className="text-[10px] gap-0.5 bg-primary/80 text-primary-foreground border-0">🏠 {imageLabel}</Badge>}
        </div>
      </div>
      <div className="p-2 space-y-1.5 bg-card">
        <input type="text" value={imageLabel} onChange={e => onImageLabelChange(e.target.value)}
          placeholder="🏠 Lokation (f.eks. Strandvilla)"
          className="w-full text-xs px-2 py-1.5 rounded border border-border bg-background text-foreground placeholder:text-muted-foreground" />
        <Select value={bedroomLabel} onValueChange={onBedroomChange}>
          <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="Soveværelse?" /></SelectTrigger>
          <SelectContent>
            {BEDROOM_OPTIONS.map(o => <SelectItem key={o.value} value={o.value || '_none'}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant={isHero ? 'default' : 'secondary'} className="h-7 text-xs flex-1 px-2" onClick={onSetHero}>
            {isHero ? '★ Hero' : 'Hero'}
          </Button>
          {onComboHeroToggle && (
            <Button size="sm" variant={isComboHero ? 'default' : 'secondary'} className="h-7 text-xs flex-1 px-2 gap-0.5" onClick={onComboHeroToggle}>
              <Layers className="h-3 w-3" /> {isComboHero ? '✦ Kombi' : 'Kombi'}
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" className="h-7 flex-1 text-xs gap-1 px-2"><Trash2 className="h-3 w-3" /> Slet</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Slet billede?</AlertDialogTitle><AlertDialogDescription>Kan ikke fortrydes.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuller</AlertDialogCancel>
                <AlertDialogAction onClick={onRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Slet</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
});

export const SortableImageGallery = memo(function SortableImageGallery({
  images, heroImage, bedroomImages, imageLabels, comboHeroImages,
  onImagesChange, onHeroChange, onBedroomImagesChange, onImageLabelsChange, onComboHeroToggle,
}: GalleryProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
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
    const filtered = imageLabels.filter(l => l.url !== url);
    if (label.trim()) filtered.push({ url, label: label.trim() });
    onImageLabelsChange(filtered);
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

  if (images.length === 0) return <p className="text-sm text-muted-foreground mt-2">Ingen billeder endnu.</p>;

  return (
    <div className="space-y-3">
      {isSelecting && (
        <div className="flex items-center gap-2 mt-3 flex-wrap sticky top-0 z-30 bg-background/95 backdrop-blur-sm py-2 px-3 rounded-lg border border-primary/20 shadow-sm">
          <span className="text-sm font-medium text-foreground">{selected.size} valgt</span>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setSelected(new Set(images))}>Vælg alle ({images.length})</Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs gap-1" onClick={() => setSelected(new Set())}><X className="h-3 w-3" /> Fravælg</Button>
          <div className="flex-1" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" className="h-8 text-xs gap-1.5"><Trash2 className="h-3 w-3" /> Slet {selected.size}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Slet {selected.size} billeder?</AlertDialogTitle><AlertDialogDescription>Kan ikke fortrydes.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuller</AlertDialogCancel>
                <AlertDialogAction onClick={deleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Slet</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={images} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((url, i) => (
              <SortableImageItem
                key={url}
                url={url} index={i}
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
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
});
