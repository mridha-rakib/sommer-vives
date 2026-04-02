import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface FacilityItem { name: string; description?: string; included: boolean; }
export interface FacilityCategory { category: string; items: FacilityItem[]; }

interface Props { facilities: FacilityCategory[]; onChange: (f: FacilityCategory[]) => void; }

const SUGGESTED_CATEGORIES = [
  'Badeværelse', 'Soveværelse og tøjvask', 'Underholdning', 'Familie',
  'Varme- og kølefunktion', 'Sikkerhed i hjemmet', 'Internet og kontor',
  'Køkken og spisning', 'Ting i nærheden', 'Udendørs',
  'Parkering og faciliteter', 'Tjenester', 'Ikke inkluderet',
];

export function AdminFacilities({ facilities, onChange }: Props) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<number>>(new Set());

  const toggleCategory = (i: number) => {
    setOpenCategories(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  };

  const addCategory = (name?: string) => {
    const catName = (name || newCategoryName).trim();
    if (!catName) return;
    onChange([...facilities, { category: catName, items: [] }]);
    setNewCategoryName('');
    setOpenCategories(prev => new Set(prev).add(facilities.length));
  };

  const removeCategory = (i: number) => onChange(facilities.filter((_, idx) => idx !== i));
  const updateCategoryName = (i: number, name: string) => onChange(facilities.map((c, idx) => idx === i ? { ...c, category: name } : c));
  const moveCategory = (i: number, dir: -1 | 1) => {
    const ni = i + dir;
    if (ni < 0 || ni >= facilities.length) return;
    const arr = [...facilities]; [arr[i], arr[ni]] = [arr[ni], arr[i]]; onChange(arr);
  };

  const addItem = (ci: number) => onChange(facilities.map((c, i) => i === ci ? { ...c, items: [...c.items, { name: '', included: true }] } : c));
  const updateItem = (ci: number, ii: number, updates: Partial<FacilityItem>) => {
    onChange(facilities.map((c, i) => i === ci ? { ...c, items: c.items.map((item, j) => j === ii ? { ...item, ...updates } : item) } : c));
  };
  const removeItem = (ci: number, ii: number) => onChange(facilities.map((c, i) => i === ci ? { ...c, items: c.items.filter((_, j) => j !== ii) } : c));
  const moveItem = (ci: number, ii: number, dir: -1 | 1) => {
    const ni = ii + dir;
    const cat = facilities[ci];
    if (ni < 0 || ni >= cat.items.length) return;
    const items = [...cat.items]; [items[ii], items[ni]] = [items[ni], items[ii]];
    onChange(facilities.map((c, i) => i === ci ? { ...c, items } : c));
  };

  const usedNames = new Set(facilities.map(f => f.category));
  const unusedSuggestions = SUGGESTED_CATEGORIES.filter(c => !usedNames.has(c));
  const totalItems = facilities.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{facilities.length} kategorier · {totalItems} faciliteter</p>

      <div className="space-y-3">
        {facilities.map((cat, catIndex) => (
          <Collapsible key={catIndex} open={openCategories.has(catIndex)} onOpenChange={() => toggleCategory(catIndex)}>
            <div className="bg-muted/50 border border-border rounded-lg overflow-hidden">
              <CollapsibleTrigger asChild>
                <div className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/80 transition-colors">
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openCategories.has(catIndex) ? 'rotate-0' : '-rotate-90'}`} />
                  <span className="flex-1 font-medium text-sm text-foreground">{cat.category || 'Unavngivet'}</span>
                  <Badge variant="secondary" className="text-[10px]">{cat.items.length}</Badge>
                  <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
                    <button onClick={() => moveCategory(catIndex, -1)} disabled={catIndex === 0} className="p-1 hover:text-primary disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                    <button onClick={() => moveCategory(catIndex, 1)} disabled={catIndex === facilities.length - 1} className="p-1 hover:text-primary disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => removeCategory(catIndex)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border p-3 space-y-3">
                  <Input value={cat.category} onChange={e => updateCategoryName(catIndex, e.target.value)} placeholder="Kategorinavn" className="font-medium text-sm" />
                  <div className="space-y-2">
                    {cat.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="bg-background border border-border rounded-md p-2.5 space-y-2">
                        <div className="flex items-center gap-2">
                          <Input value={item.name} onChange={e => updateItem(catIndex, itemIndex, { name: e.target.value })} placeholder="Facilitetsnavn" className="flex-1 text-sm h-8" />
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Label className="text-[10px] text-muted-foreground">{item.included ? 'Ja' : 'Nej'}</Label>
                            <Switch checked={item.included} onCheckedChange={v => updateItem(catIndex, itemIndex, { included: v })} className="scale-75" />
                          </div>
                          <div className="flex gap-0.5 shrink-0">
                            <button onClick={() => moveItem(catIndex, itemIndex, -1)} disabled={itemIndex === 0} className="p-0.5 hover:text-primary disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                            <button onClick={() => moveItem(catIndex, itemIndex, 1)} disabled={itemIndex === cat.items.length - 1} className="p-0.5 hover:text-primary disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                          </div>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive shrink-0" onClick={() => removeItem(catIndex, itemIndex)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                        <Input value={item.description || ''} onChange={e => updateItem(catIndex, itemIndex, { description: e.target.value || undefined })} placeholder="Valgfri beskrivelse..." className="text-xs h-7 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs w-full" onClick={() => addItem(catIndex)}><Plus className="h-3 w-3" /> Tilføj facilitet</Button>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>

      <div className="flex gap-2">
        <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Ny kategori..."
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())} className="text-sm" />
        <Button variant="outline" size="sm" onClick={() => addCategory()} disabled={!newCategoryName.trim()} className="gap-1 shrink-0"><Plus className="h-3.5 w-3.5" /> Tilføj</Button>
      </div>

      {unusedSuggestions.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Foreslåede kategorier:</p>
          <div className="flex flex-wrap gap-1.5">
            {unusedSuggestions.map(name => (
              <button key={name} onClick={() => addCategory(name)}
                className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                + {name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
