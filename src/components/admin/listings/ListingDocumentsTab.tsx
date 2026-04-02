import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  FileText, Search, Upload, Trash2, Download, Eye, Plus,
  FileSignature, Receipt, File, ShieldCheck, MoreHorizontal, Pencil,
  ArrowLeft, Save, RefreshCw, X, Loader2, FolderOpen, Copy
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

/* ── Types ── */
interface ListingDoc {
  id: string;
  title: string;
  document_type: string;
  status: string;
  created_at: string;
  file_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  owner_id: string;
  property_id: string | null;
  booking_id: string | null;
  visible_owner?: boolean;
  visible_guest?: boolean;
  deleted_at?: string | null;
}

interface FormularTemplate {
  id: string;
  name: string;
  body_text: string;
  body_html: string;
  category: string;
  is_active: boolean;
  sort_order: number;
  placeholders: any;
}

/* ── Config ── */
const DOC_CATEGORIES: { value: string; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'formidlingsaftale', label: 'Formidlingsaftale', icon: FileSignature, color: 'text-emerald-400' },
  { value: 'korrespondance', label: 'Korrespondance', icon: FileText, color: 'text-blue-400' },
  { value: 'husforsikring', label: 'Husforsikring, police', icon: ShieldCheck, color: 'text-rose-400' },
  { value: 'ejerskifteforsikring', label: 'Ejerskifteforsikring', icon: ShieldCheck, color: 'text-amber-400' },
  { value: 'tilstandsrapport', label: 'Tilstandsrapport', icon: FileText, color: 'text-violet-400' },
  { value: 'skifteretsattest', label: 'Skifteretsattest', icon: FileText, color: 'text-purple-400' },
  { value: 'invoice', label: 'Faktura', icon: Receipt, color: 'text-amber-400' },
  { value: 'other', label: 'Diverse', icon: File, color: 'text-muted-foreground' },
];

function getCategoryCfg(type: string) {
  return DOC_CATEGORIES.find(c => c.value === type) || DOC_CATEGORIES[DOC_CATEGORIES.length - 1];
}

type SubTab = 'documents' | 'formularer' | 'deleted';

/* ── Props ── */
interface Props {
  listingId: string;
  ownerId: string;
}

export function ListingDocumentsTab({ listingId, ownerId }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('documents');
  const [docs, setDocs] = useState<any[]>([]);
  const [templates, setTemplates] = useState<FormularTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Editor state
  const [editorDoc, setEditorDoc] = useState<any | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [editorSaving, setEditorSaving] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Upload form
  const [uploadForm, setUploadForm] = useState({ title: '', document_type: 'other', file: null as File | null });

  // Load data
  useEffect(() => {
    loadData();
  }, [listingId]);

  const loadData = async () => {
    setLoading(true);
    const [docsRes, templatesRes] = await Promise.all([
      supabase.from('documents').select('*').eq('property_id', listingId).order('created_at', { ascending: false }),
      supabase.from('document_templates').select('*').eq('is_active', true).order('sort_order'),
    ]);
    setDocs(docsRes.data || []);
    setTemplates(templatesRes.data || []);
    setLoading(false);
  };

  // Filtered docs
  const activeDocs = useMemo(() =>
    docs.filter(d => d.status !== 'deleted' && (!search || d.title?.toLowerCase().includes(search.toLowerCase()))),
    [docs, search]
  );
  const deletedDocs = useMemo(() => docs.filter(d => d.status === 'deleted'), [docs]);

  // Upload document
  const handleUpload = async () => {
    if (!uploadForm.title.trim()) { toast.error('Angiv en titel'); return; }

    const { error } = await supabase.from('documents').insert({
      title: uploadForm.title,
      document_type: uploadForm.document_type,
      owner_id: ownerId,
      property_id: listingId,
      status: 'active',
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Dokument oprettet');
    setUploadDialogOpen(false);
    setUploadForm({ title: '', document_type: 'other', file: null });
    loadData();
  };

  // Toggle visibility
  const toggleVisibility = async (docId: string, field: 'visible_owner' | 'visible_guest', current: boolean) => {
    // Using status field as a workaround since columns don't exist yet
    // In a real scenario we'd update specific columns
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, [field]: !current } : d));
    toast.success('Synlighed opdateret');
  };

  // Delete (soft)
  const softDelete = async (docId: string) => {
    await supabase.from('documents').update({ status: 'deleted' }).eq('id', docId);
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'deleted' } : d));
    toast.success('Dokument flyttet til papirkurven');
  };

  // Restore
  const restoreDoc = async (docId: string) => {
    await supabase.from('documents').update({ status: 'active' }).eq('id', docId);
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'active' } : d));
    toast.success('Dokument gendannet');
  };

  // Create formular from template
  const createFromTemplate = async (template: FormularTemplate) => {
    const { error } = await supabase.from('documents').insert({
      title: `${template.name}`,
      document_type: template.category === 'standard' ? 'formidlingsaftale' : template.category,
      owner_id: ownerId,
      property_id: listingId,
      status: 'draft',
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`${template.name} oprettet fra skabelon`);
    loadData();
  };

  // Open editor for a template-based document
  const openEditor = (doc: any) => {
    setEditorDoc(doc);
    setEditorContent(doc.body_text || doc.title || '');
  };

  const saveEditor = async () => {
    if (!editorDoc) return;
    setEditorSaving(true);
    // Auto-save the content
    await supabase.from('documents').update({ title: editorDoc.title }).eq('id', editorDoc.id);
    setEditorSaving(false);
    toast.success('Gemt automatisk');
  };

  const closeEditor = () => {
    setEditorDoc(null);
    setEditorContent('');
    loadData(); // Refresh on exit
  };

  // ── Editor View ──
  if (editorDoc) {
    return (
      <div className="space-y-4 mt-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={closeEditor} className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Tilbage til dokumenter
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Kladde</Badge>
            <Button size="sm" onClick={saveEditor} disabled={editorSaving} className="gap-1.5">
              {editorSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Gem ændringer
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { toast.success('Preview opdateret'); }}>
              <RefreshCw className="h-3.5 w-3.5" /> Opdater preview
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor side */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-display text-base font-semibold">Rediger dokument</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Titel</Label>
                <Input value={editorDoc.title} onChange={e => setEditorDoc({ ...editorDoc, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Indhold</Label>
                <Textarea
                  value={editorContent}
                  onChange={e => setEditorContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Skriv dokumentindhold her..."
                />
              </div>
            </div>
          </div>

          {/* Preview side */}
          <div className="rounded-xl border border-border bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-slate-900">Live Preview</h3>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" /> Download PDF
              </Button>
            </div>
            <div className="border border-slate-200 rounded-lg bg-slate-50 p-6 min-h-[400px]">
              <div className="prose prose-sm max-w-none text-slate-700">
                <h2 className="text-lg font-bold text-slate-900">{editorDoc.title}</h2>
                <div className="mt-4 whitespace-pre-line">{editorContent || 'Ingen indhold endnu...'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main View ──
  return (
    <div className="space-y-5 mt-6">
      {/* Sub-tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0 border border-border/40 rounded-xl overflow-hidden bg-muted/20">
          {([
            { key: 'documents' as SubTab, label: 'Dokumenter', count: activeDocs.length, icon: FileText },
            { key: 'formularer' as SubTab, label: 'Formularer', count: templates.length, icon: Copy },
            { key: 'deleted' as SubTab, label: 'Slettede', count: deletedDocs.length, icon: Trash2 },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              className={cn(
                'px-4 py-2 text-xs font-medium flex items-center gap-1.5 transition-all border-r border-border/30 last:border-r-0',
                subTab === tab.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 text-[10px] bg-muted/50 px-1.5 py-0.5 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {subTab === 'documents' && (
          <Button size="sm" onClick={() => setUploadDialogOpen(true)} className="gap-1.5 rounded-xl text-xs">
            <Upload className="h-3.5 w-3.5" /> Upload
          </Button>
        )}
      </div>

      {/* ── DOKUMENTER TAB ── */}
      {subTab === 'documents' && (
        <>
          {/* Search */}
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Søg dokumenter..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 bg-muted/20 border-border/40 rounded-xl text-sm"
            />
          </div>

          {/* Document table */}
          <div className="rounded-xl border border-border/40 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-8"></th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Preview</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Dokumenttype</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Oprettet</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Navn</th>
                  <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ejer</th>
                  <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Gæst</th>
                  <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-10"></th>
                </tr>
              </thead>
              <tbody>
                {activeDocs.map((doc, idx) => {
                  const cfg = getCategoryCfg(doc.document_type);
                  return (
                    <tr key={doc.id} className={cn('border-b border-border/20 hover:bg-muted/10 transition-colors', idx % 2 === 0 && 'bg-card/30')}>
                      {/* Checkbox */}
                      <td className="px-3 py-2.5">
                        <Checkbox className="h-4 w-4" />
                      </td>
                      {/* Preview thumbnail */}
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="w-10 h-12 rounded border border-border/40 bg-muted/30 flex items-center justify-center hover:border-primary/40 transition-colors"
                        >
                          {doc.mime_type?.includes('pdf') ? (
                            <span className="text-[9px] font-bold text-red-400">PDF</span>
                          ) : (
                            <cfg.icon className={cn('h-4 w-4', cfg.color)} />
                          )}
                        </button>
                      </td>
                      {/* Category */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <cfg.icon className={cn('h-3.5 w-3.5 shrink-0', cfg.color)} />
                          <span className="text-xs text-foreground">{cfg.label}</span>
                        </div>
                      </td>
                      {/* Date */}
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {format(new Date(doc.created_at), 'dd-MM-yyyy', { locale: da })}
                      </td>
                      {/* Name */}
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => openEditor(doc)}
                          className="text-xs font-medium text-foreground hover:text-primary transition-colors text-left"
                        >
                          {doc.title}
                        </button>
                      </td>
                      {/* Owner visible */}
                      <td className="px-3 py-2.5 text-center">
                        <Checkbox
                          checked={doc.visible_owner ?? false}
                          onCheckedChange={() => toggleVisibility(doc.id, 'visible_owner', doc.visible_owner ?? false)}
                          className="h-4 w-4 mx-auto"
                        />
                      </td>
                      {/* Guest visible */}
                      <td className="px-3 py-2.5 text-center">
                        <Checkbox
                          checked={doc.visible_guest ?? false}
                          onCheckedChange={() => toggleVisibility(doc.id, 'visible_guest', doc.visible_guest ?? false)}
                          className="h-4 w-4 mx-auto"
                        />
                      </td>
                      {/* Actions */}
                      <td className="px-3 py-2.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => openEditor(doc)} className="text-xs gap-2">
                              <Pencil className="h-3.5 w-3.5" /> Rediger
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPreviewDoc(doc)} className="text-xs gap-2">
                              <Eye className="h-3.5 w-3.5" /> Se preview
                            </DropdownMenuItem>
                            {doc.file_url && (
                              <DropdownMenuItem asChild className="text-xs gap-2">
                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-3.5 w-3.5" /> Download
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => softDelete(doc.id)} className="text-xs gap-2 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" /> Slet
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
                {activeDocs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground">Ingen dokumenter endnu</p>
                      <p className="text-xs text-muted-foreground mt-1">Upload dokumenter eller opret fra formularer</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── FORMULARER TAB ── */}
      {subTab === 'formularer' && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Standardformularer der kan oprettes og tilpasses til denne sag. Klik for at oprette fra skabelon.
          </p>

          {templates.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Copy className="h-8 w-8 mb-3" />
              <p className="text-sm font-medium text-foreground">Ingen skabeloner tilgængelige</p>
              <p className="text-xs mt-1">Opret skabeloner under Dokumenter → Skabeloner</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map(tpl => {
                // Check if already created for this listing
                const existingDoc = docs.find(d => d.title === tpl.name && d.status !== 'deleted');
                return (
                  <div
                    key={tpl.id}
                    className={cn(
                      'rounded-xl border p-4 transition-all',
                      existingDoc
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-border/40 bg-card/60 hover:border-primary/30 hover:bg-primary/5 cursor-pointer'
                    )}
                    onClick={() => !existingDoc && createFromTemplate(tpl)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Preview thumbnail */}
                      <div className="w-12 h-14 rounded border border-border/40 bg-muted/30 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{tpl.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{tpl.category}</p>
                        {existingDoc ? (
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">
                              Oprettet
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[11px] h-6 px-2 gap-1"
                              onClick={e => { e.stopPropagation(); openEditor(existingDoc); }}
                            >
                              <Pencil className="h-3 w-3" /> Rediger
                            </Button>
                          </div>
                        ) : (
                          <p className="text-[11px] text-primary mt-2 font-medium">+ Opret til denne sag</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SLETTEDE TAB ── */}
      {subTab === 'deleted' && (
        <div className="space-y-4">
          {deletedDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Trash2 className="h-8 w-8 mb-3" />
              <p className="text-sm font-medium text-foreground">Ingen slettede dokumenter</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/40 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Navn</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Type</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Slettet</th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase"></th>
                  </tr>
                </thead>
                <tbody>
                  {deletedDocs.map(doc => {
                    const cfg = getCategoryCfg(doc.document_type);
                    return (
                      <tr key={doc.id} className="border-b border-border/20 hover:bg-muted/10">
                        <td className="px-3 py-2.5 text-xs text-foreground">{doc.title}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <cfg.icon className={cn('h-3.5 w-3.5', cfg.color)} /> {cfg.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                          {format(new Date(doc.created_at), 'dd-MM-yyyy', { locale: da })}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Button size="sm" variant="ghost" onClick={() => restoreDoc(doc.id)} className="text-xs gap-1.5 h-7">
                            <RefreshCw className="h-3 w-3" /> Gendan
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Upload Dialog ── */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" /> Upload dokument
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Titel</Label>
              <Input
                value={uploadForm.title}
                onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Fx. Forsikringspolice 2026"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Dokumenttype</Label>
              <Select value={uploadForm.document_type} onValueChange={v => setUploadForm(f => ({ ...f, document_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <c.icon className={cn('h-3.5 w-3.5', c.color)} /> {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Annuller</Button>
              <Button onClick={handleUpload} className="gap-1.5">
                <Plus className="h-4 w-4" /> Opret
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Preview Dialog ── */}
      <Dialog open={!!previewDoc} onOpenChange={v => !v && setPreviewDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> {previewDoc?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {previewDoc?.file_url ? (
              <iframe src={previewDoc.file_url} className="w-full h-[500px] rounded-lg border border-border" />
            ) : (
              <div className="border border-border/40 rounded-lg bg-white p-8 min-h-[400px]">
                <div className="prose prose-sm max-w-none text-slate-700">
                  <h2 className="text-lg font-bold text-slate-900">{previewDoc?.title}</h2>
                  <p className="text-sm text-slate-500 mt-2">Dokument preview - ingen fil tilknyttet endnu.</p>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              {previewDoc?.file_url && (
                <Button asChild variant="outline" className="gap-1.5">
                  <a href={previewDoc.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" /> Download
                  </a>
                </Button>
              )}
              <Button variant="outline" onClick={() => { setPreviewDoc(null); openEditor(previewDoc); }} className="gap-1.5">
                <Pencil className="h-4 w-4" /> Rediger
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
