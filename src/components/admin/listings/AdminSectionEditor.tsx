import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, ChevronDown, ImageIcon, Upload, Loader2, X } from 'lucide-react';

export interface ExtraSection { title: string; body: string; image?: string; }

interface Props { sections: ExtraSection[]; onChange: (s: ExtraSection[]) => void; listingSlug: string; }

export function AdminSectionEditor({ sections, onChange, listingSlug }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(sections.length > 0 ? 0 : null);

  const addSection = () => {
    const newSections = [...sections, { title: '', body: '', image: '' }];
    onChange(newSections);
    setExpandedIndex(newSections.length - 1);
  };

  const updateSection = (i: number, field: keyof ExtraSection, value: string) => {
    onChange(sections.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  const removeSection = (i: number) => {
    onChange(sections.filter((_, idx) => idx !== i));
    if (expandedIndex === i) setExpandedIndex(null);
  };

  const moveSection = (i: number, dir: -1 | 1) => {
    const ni = i + dir;
    if (ni < 0 || ni >= sections.length) return;
    const arr = [...sections]; [arr[i], arr[ni]] = [arr[ni], arr[i]]; onChange(arr);
    setExpandedIndex(ni);
  };

  return (
    <div className="space-y-3">
      {sections.map((section, index) => (
        <SectionCard key={index} section={section} index={index} total={sections.length}
          isExpanded={expandedIndex === index} onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
          onUpdate={(field, value) => updateSection(index, field, value)}
          onRemove={() => removeSection(index)} onMove={(dir) => moveSection(index, dir)}
          onImageUploaded={(url) => updateSection(index, 'image', url)}
          onImageRemoved={() => updateSection(index, 'image', '')} listingSlug={listingSlug} />
      ))}

      {sections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-border bg-muted/20">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Ingen sektioner endnu</p>
          <p className="text-xs text-muted-foreground mb-4">Tilføj sektioner der vises som forskudte blokke på listing-siden</p>
        </div>
      )}
      <Button variant="outline" className="gap-2 w-full h-11 border-dashed" onClick={addSection}>
        <Plus className="h-4 w-4" /> Tilføj sektion
      </Button>
    </div>
  );
}

function SectionCard({ section, index, total, isExpanded, onToggle, onUpdate, onRemove, onMove, onImageUploaded, onImageRemoved, listingSlug }: {
  section: ExtraSection; index: number; total: number; isExpanded: boolean;
  onToggle: () => void; onUpdate: (f: keyof ExtraSection, v: string) => void;
  onRemove: () => void; onMove: (dir: -1 | 1) => void;
  onImageUploaded: (url: string) => void; onImageRemoved: () => void; listingSlug: string;
}) {
  return (
    <div className={`rounded-xl border transition-all ${isExpanded ? 'border-primary/30 bg-card shadow-sm' : 'border-border bg-card hover:border-primary/20'}`}>
      <button type="button" onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${isExpanded ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          {String(index + 1).padStart(2, '0')}
        </span>
        {section.image ? (
          <img src={section.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-border" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"><ImageIcon className="h-4 w-4 text-muted-foreground/50" /></div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${section.title ? 'text-foreground' : 'text-muted-foreground italic'}`}>{section.title || 'Uden titel'}</p>
          {section.body && !isExpanded && <p className="text-xs text-muted-foreground truncate mt-0.5">{section.body.slice(0, 80)}...</p>}
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Titel</label>
            <Input value={section.title} onChange={e => onUpdate('title', e.target.value)} placeholder="f.eks. Boligen, Højdepunkter, Naturen..." className="font-medium" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Billede</label>
            <SectionImageUpload currentUrl={section.image || ''} onUploaded={onImageUploaded} onRemove={onImageRemoved} listingSlug={listingSlug} sectionIndex={index} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Indhold</label>
            <Textarea value={section.body} onChange={e => onUpdate('body', e.target.value)} rows={6}
              placeholder="Skriv tekst her..." className="text-sm leading-relaxed" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onMove(-1)} disabled={index === 0}>
                <ChevronDown className="h-4 w-4 rotate-180" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onMove(1)} disabled={index === total - 1}>
                <ChevronDown className="h-4 w-4" />
              </Button>
              <span className="text-[10px] text-muted-foreground ml-1">{index + 1} af {total}</span>
            </div>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onRemove}>
              <Trash2 className="h-3.5 w-3.5" /> Fjern
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionImageUpload({ currentUrl, onUploaded, onRemove, listingSlug, sectionIndex }: {
  currentUrl: string; onUploaded: (url: string) => void; onRemove: () => void; listingSlug: string; sectionIndex: number;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${listingSlug}/section-${sectionIndex}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('listing-images').upload(path, file, { upsert: true });
    if (error) { toast({ title: 'Upload fejlede', description: error.message, variant: 'destructive' }); }
    else { const { data } = supabase.storage.from('listing-images').getPublicUrl(path); onUploaded(data.publicUrl); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {currentUrl ? (
        <div className="relative group rounded-xl overflow-hidden border border-border">
          <img src={currentUrl} alt="" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <Button size="sm" variant="secondary" className="h-8 text-xs gap-1 shadow-lg" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Erstat
            </Button>
            <Button size="sm" variant="destructive" className="h-8 text-xs gap-1 shadow-lg" onClick={onRemove}>
              <Trash2 className="h-3 w-3" /> Fjern
            </Button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => !uploading && fileRef.current?.click()} disabled={uploading}
          className="w-full flex items-center gap-3 rounded-xl border-2 border-dashed border-border p-4 cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : (
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><Upload className="h-4 w-4 text-muted-foreground" /></div>
          )}
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">{uploading ? 'Uploader...' : 'Upload billede'}</p>
            <p className="text-xs text-muted-foreground">Valgfrit – vises ved siden af teksten</p>
          </div>
        </button>
      )}
    </div>
  );
}
