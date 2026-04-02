import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { StatusChip, type StatusVariant } from '@/components/admin/ui/StatusChip';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  FileText, Search, Download, Eye, FolderOpen, Grid3X3, List, Filter,
  FileSignature, Receipt, Upload, ShieldCheck, File, CalendarDays,
  User, FolderOpen as FolderIcon, ExternalLink, Link2, Clock, MoreHorizontal,
  AlertTriangle, Pencil, Copy, Plus, Trash2, BookTemplate
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ── Config ── */
type DocType = 'formidlingsaftale' | 'owner_upload' | 'invoice' | 'statement' | 'id_personal' | 'internal' | 'other';

const DOC_TYPE_CFG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  formidlingsaftale: { label: 'Formidlingsaftale', icon: FileSignature, color: 'text-emerald-400' },
  agreement:         { label: 'Formidlingsaftale', icon: FileSignature, color: 'text-emerald-400' },
  owner_upload:      { label: 'Ejer-upload',       icon: Upload,        color: 'text-blue-400' },
  invoice:           { label: 'Faktura',            icon: Receipt,       color: 'text-amber-400' },
  statement:         { label: 'Opgørelse',          icon: FileText,      color: 'text-violet-400' },
  id_personal:       { label: 'ID / Personligt',    icon: ShieldCheck,   color: 'text-rose-400' },
  internal:          { label: 'Internt dokument',   icon: File,          color: 'text-muted-foreground' },
  other:             { label: 'Andet',              icon: FileText,      color: 'text-muted-foreground' },
};

const STATUS_CFG: Record<string, { label: string; variant: StatusVariant }> = {
  active:   { label: 'Aktiv',      variant: 'success' },
  draft:    { label: 'Kladde',     variant: 'muted' },
  archived: { label: 'Arkiveret',  variant: 'muted' },
  pending:  { label: 'Afventer',   variant: 'warning' },
  signed:   { label: 'Underskrevet', variant: 'success' },
  sent:     { label: 'Sendt',      variant: 'info' },
  expired:  { label: 'Udløbet',    variant: 'danger' },
};

function getDocCfg(type: string) {
  return DOC_TYPE_CFG[type] || DOC_TYPE_CFG.other;
}

function getStatusCfg(status: string) {
  return STATUS_CFG[status] || { label: status, variant: 'muted' as StatusVariant };
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMimeIcon(mime: string | null) {
  if (!mime) return 'DOC';
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('image')) return 'IMG';
  if (mime.includes('word') || mime.includes('document')) return 'DOC';
  if (mime.includes('sheet') || mime.includes('excel')) return 'XLS';
  return 'FIL';
}

function getMimeColor(mime: string | null) {
  if (!mime) return 'bg-muted/40 text-muted-foreground';
  if (mime.includes('pdf')) return 'bg-red-500/10 text-red-400';
  if (mime.includes('image')) return 'bg-blue-500/10 text-blue-400';
  if (mime.includes('word') || mime.includes('document')) return 'bg-blue-500/10 text-blue-400';
  if (mime.includes('sheet') || mime.includes('excel')) return 'bg-emerald-500/10 text-emerald-400';
  return 'bg-muted/40 text-muted-foreground';
}

type PageTab = 'documents' | 'templates';

export default function AdminDokumenter() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selected, setSelected] = useState<any | null>(null);
  const [pageTab, setPageTab] = useState<PageTab>('documents');
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateForm, setTemplateForm] = useState({ name: '', body_text: '', body_html: '', version: '1.0', is_active: true });
  const [propertyMap, setPropertyMap] = useState<Record<string, string>>({});
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      supabase.from('documents').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('agreements').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('agreement_templates').select('*').order('created_at', { ascending: false }),
      supabase.from('properties').select('id, title, case_number'),
      supabase.from('profiles').select('id, full_name, email'),
    ]).then(([docRes, agrRes, tplRes, propRes, profRes]) => {
      setDocuments(docRes.data || []);
      setAgreements(agrRes.data || []);
      setTemplates(tplRes.data || []);
      const pMap: Record<string, string> = {};
      (propRes.data || []).forEach((p: any) => { pMap[p.id] = p.title || p.case_number || p.id.slice(0, 8); });
      setPropertyMap(pMap);
      const prMap: Record<string, string> = {};
      (profRes.data || []).forEach((p: any) => { prMap[p.id] = p.full_name || p.email || p.id.slice(0, 8); });
      setProfileMap(prMap);
      setLoading(false);
    });
  }, []);

  // Merge agreements into a unified document list
  const allDocs = useMemo(() => {
    const agreementDocs = agreements.map(a => ({
      id: a.id,
      title: `Formidlingsaftale — ${a.owner_name || a.property_title || 'Ukendt ejer'}`,
      document_type: 'agreement',
      status: a.status,
      created_at: a.created_at,
      file_url: a.pdf_url,
      file_size: null,
      mime_type: a.pdf_url ? 'application/pdf' : null,
      owner_id: a.owner_id,
      property_id: a.property_id,
      booking_id: null,
      _source: 'agreement' as const,
      _agreement: a,
    }));
    const normalDocs = documents.map(d => ({ ...d, _source: 'document' as const, _agreement: null }));
    return [...normalDocs, ...agreementDocs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [documents, agreements]);

  // Pending agreements count (draft or sent but not signed)
  const pendingAgreements = agreements.filter(a => a.status === 'draft' || a.status === 'sent');

  const types = useMemo(() => [...new Set(allDocs.map(d => d.document_type))], [allDocs]);

  const filtered = useMemo(() => {
    return allDocs.filter(d => {
      if (typeFilter !== 'all' && d.document_type !== typeFilter) return false;
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return d.title?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allDocs, typeFilter, statusFilter, search]);

  const counts = useMemo(() => ({
    total: allDocs.length,
    active: allDocs.filter(d => d.status === 'active' || d.status === 'signed').length,
    draft: allDocs.filter(d => d.status === 'draft').length,
    types: types.length,
  }), [allDocs, types]);

  // Template CRUD
  const openNewTemplate = () => {
    setEditingTemplate('new');
    setTemplateForm({ name: '', body_text: '', body_html: '', version: '1.0', is_active: true });
  };
  const openEditTemplate = (t: any) => {
    setEditingTemplate(t);
    setTemplateForm({ name: t.name, body_text: t.body_text, body_html: t.body_html, version: t.version, is_active: t.is_active });
  };
  const saveTemplate = async () => {
    if (!templateForm.name.trim()) { toast.error('Navn er påkrævet'); return; }
    if (editingTemplate === 'new') {
      const { error } = await supabase.from('agreement_templates').insert(templateForm);
      if (error) { toast.error(error.message); return; }
      toast.success('Skabelon oprettet');
    } else {
      const { error } = await supabase.from('agreement_templates').update(templateForm).eq('id', editingTemplate.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Skabelon opdateret');
    }
    setEditingTemplate(null);
    const { data } = await supabase.from('agreement_templates').select('*').order('created_at', { ascending: false });
    setTemplates(data || []);
  };
  const deleteTemplate = async (id: string) => {
    await supabase.from('agreement_templates').delete().eq('id', id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Skabelon slettet');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Dokumenter"
          subtitle="Dokumentbibliotek, aftaler og skabeloner"
          actions={
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-xl border border-border/40 overflow-hidden">
                <button onClick={() => setPageTab('documents')} className={cn('px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-all', pageTab === 'documents' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                  <FileText className="h-3.5 w-3.5" />Dokumenter
                </button>
                <button onClick={() => setPageTab('templates')} className={cn('px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-all border-l border-border/40', pageTab === 'templates' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                  <Copy className="h-3.5 w-3.5" />Skabeloner
                </button>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-2.5 py-1">
                {counts.total} dokumenter
              </Badge>
            </div>
          }
        />

        {/* ── Pending agreements alert ── */}
        {pendingAgreements.length > 0 && pageTab === 'documents' && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {pendingAgreements.length} {pendingAgreements.length === 1 ? 'aftale afventer' : 'aftaler afventer'} behandling
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pendingAgreements.filter(a => a.status === 'draft').length > 0 && `${pendingAgreements.filter(a => a.status === 'draft').length} kladde(r)`}
                {pendingAgreements.filter(a => a.status === 'draft').length > 0 && pendingAgreements.filter(a => a.status === 'sent').length > 0 && ' · '}
                {pendingAgreements.filter(a => a.status === 'sent').length > 0 && `${pendingAgreements.filter(a => a.status === 'sent').length} sendt og afventer signatur`}
              </p>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setTypeFilter('agreement')}>
              Vis aftaler
            </Button>
          </div>
        )}

        {pageTab === 'documents' && (<>
        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            { label: 'Alle dokumenter', value: counts.total, icon: FolderOpen },
            { label: 'Aktive / signerede', value: counts.active, icon: FileText },
            { label: 'Kladder', value: counts.draft, icon: File },
            { label: 'Dokumenttyper', value: counts.types, icon: Grid3X3 },
          ]).map(kpi => (
            <div key={kpi.label} className="rounded-xl border border-border/40 bg-card/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground font-medium">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Søg dokumenter..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 bg-muted/20 border-border/40 rounded-xl text-sm"
            />
          </div>

          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
            <TabsList className="h-9 bg-muted/20 border border-border/30 rounded-xl p-0.5">
              <TabsTrigger value="all" className="text-xs rounded-lg px-3 h-7">Alle</TabsTrigger>
              <TabsTrigger value="active" className="text-xs rounded-lg px-3 h-7">Aktive</TabsTrigger>
              <TabsTrigger value="draft" className="text-xs rounded-lg px-3 h-7">Kladder</TabsTrigger>
              <TabsTrigger value="archived" className="text-xs rounded-lg px-3 h-7">Arkiv</TabsTrigger>
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 rounded-xl border-border/40 text-xs gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                {typeFilter === 'all' ? 'Alle typer' : getDocCfg(typeFilter).label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => setTypeFilter('all')}>Alle typer</DropdownMenuItem>
              <DropdownMenuSeparator />
              {types.map(t => {
                const cfg = getDocCfg(t);
                return (
                  <DropdownMenuItem key={t} onClick={() => setTypeFilter(t)}>
                    <cfg.icon className={`w-3.5 h-3.5 mr-2 ${cfg.color}`} />
                    {cfg.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View toggle */}
          <div className="flex items-center border border-border/30 rounded-xl overflow-hidden bg-muted/20 ml-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
          )
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card/40 p-16 text-center">
            <FolderOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Ingen dokumenter fundet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tilpas dine filtre eller upload et nyt dokument</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── Grid view ── */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map(d => {
              const cfg = getDocCfg(d.document_type);
              const sCfg = getStatusCfg(d.status);
              return (
                <div
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className="rounded-xl border border-border/40 bg-card/60 hover:bg-card/80 hover:border-border/60 transition-all cursor-pointer group overflow-hidden"
                >
                  {/* Preview area */}
                  <div className={`h-28 flex flex-col items-center justify-center gap-2 ${getMimeColor(d.mime_type)} border-b border-border/20`}>
                    <span className="text-lg font-bold opacity-60">{getMimeIcon(d.mime_type)}</span>
                    <cfg.icon className={`w-5 h-5 ${cfg.color} opacity-40`} />
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <p className="text-xs font-medium text-foreground truncate mb-1">{d.title}</p>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(d.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
                      </span>
                      <StatusChip label={sCfg.label} variant={sCfg.variant} size="sm" />
                    </div>
                    {d.file_size && (
                      <span className="text-[10px] text-muted-foreground/50 block mt-1">{formatFileSize(d.file_size)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── List view ── */
          <div className="rounded-xl border border-border/40 bg-card/40 divide-y divide-border/30 overflow-hidden">
            {filtered.map(d => {
              const cfg = getDocCfg(d.document_type);
              const sCfg = getStatusCfg(d.status);
              return (
                <div
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-muted/15 transition-colors cursor-pointer group"
                >
                  {/* File icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${getMimeColor(d.mime_type)}`}>
                    {getMimeIcon(d.mime_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{d.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <cfg.icon className={`w-3 h-3 ${cfg.color}`} />
                      <span className="text-[11px] text-muted-foreground">{cfg.label}</span>
                      {d.file_size && (
                        <>
                          <span className="text-muted-foreground/30">·</span>
                          <span className="text-[11px] text-muted-foreground/60">{formatFileSize(d.file_size)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="hidden sm:flex items-center gap-3 shrink-0">
                    <StatusChip label={sCfg.label} variant={sCfg.variant} dot size="sm" />
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(d.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.file_url && (
                      <>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          <a href={d.file_url} target="_blank" rel="noreferrer"><Eye className="h-3.5 w-3.5" /></a>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          <a href={d.file_url} download><Download className="h-3.5 w-3.5" /></a>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </>)}

        {/* ═══════ TEMPLATES TAB ═══════ */}
        {pageTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Aftale-skabeloner</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Skabeloner til formidlingsaftaler med dynamiske felter</p>
              </div>
              <Button size="sm" className="gap-1.5 rounded-xl" onClick={openNewTemplate}>
                <Plus className="h-3.5 w-3.5" />Ny skabelon
              </Button>
            </div>

            {templates.length === 0 ? (
              <div className="rounded-xl border border-border/40 bg-card/40 p-16 text-center">
                <Copy className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Ingen skabeloner endnu</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Opret din første aftale-skabelon</p>
                <Button size="sm" variant="outline" className="mt-4 rounded-xl gap-1.5" onClick={openNewTemplate}>
                  <Plus className="h-3.5 w-3.5" />Opret skabelon
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map(t => (
                  <div key={t.id} className="flex items-center gap-4 rounded-xl border border-border/40 bg-card/60 hover:bg-card/80 transition-all px-4 py-3 group">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <FileSignature className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">v{t.version}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <StatusChip label={t.is_active ? 'Aktiv' : 'Inaktiv'} variant={t.is_active ? 'success' : 'muted'} dot size="sm" />
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-[11px] text-muted-foreground">{new Date(t.updated_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => openEditTemplate(t)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-destructive" onClick={() => deleteTemplate(t.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Template editor sheet */}
            <Sheet open={!!editingTemplate} onOpenChange={open => !open && setEditingTemplate(null)}>
              <SheetContent className="sm:max-w-lg bg-card border-border/50 overflow-y-auto">
                <SheetHeader className="pb-4 border-b border-border/30">
                  <SheetTitle>{editingTemplate === 'new' ? 'Ny skabelon' : 'Rediger skabelon'}</SheetTitle>
                </SheetHeader>
                <div className="py-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Skabelonnavn</Label>
                    <Input value={templateForm.name} onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value }))} placeholder="Standard formidlingsaftale" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Version</Label>
                    <Input value={templateForm.version} onChange={e => setTemplateForm(f => ({ ...f, version: e.target.value }))} placeholder="1.0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Aftaletekst</Label>
                    <p className="text-[11px] text-muted-foreground">Brug placeholders som {"{{owner_name}}"}, {"{{property_address}}"}, {"{{commission_rate}}"}, {"{{binding_months}}"}</p>
                    <Textarea value={templateForm.body_text} onChange={e => setTemplateForm(f => ({ ...f, body_text: e.target.value }))} rows={12} placeholder="Mellem {{owner_name}} (herefter &quot;Udlejer&quot;) og SommerDrøm ApS..." />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="text-sm">Aktiv</Label>
                    <input type="checkbox" checked={templateForm.is_active} onChange={e => setTemplateForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                  </div>
                  <div className="flex gap-2 pt-3">
                    <Button onClick={saveTemplate} className="flex-1 rounded-xl">Gem skabelon</Button>
                    <Button variant="outline" onClick={() => setEditingTemplate(null)} className="rounded-xl">Annuller</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>

      {/* ── Detail drawer ── */}
      <Sheet open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-lg bg-card border-border/50 overflow-y-auto">
          {selected && (() => {
            const cfg = getDocCfg(selected.document_type);
            const sCfg = getStatusCfg(selected.status);
            return (
              <>
                <SheetHeader className="pb-5 border-b border-border/30">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${getMimeColor(selected.mime_type)}`}>
                      {getMimeIcon(selected.mime_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <SheetTitle className="text-base font-semibold text-foreground leading-tight">{selected.title}</SheetTitle>
                      <div className="flex items-center gap-2 mt-1.5">
                        <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                        <span className="text-xs text-muted-foreground">{cfg.label}</span>
                      </div>
                      <div className="mt-2">
                        <StatusChip label={sCfg.label} variant={sCfg.variant} dot />
                      </div>
                    </div>
                  </div>
                </SheetHeader>

                {/* Preview area */}
                {selected.file_url && (
                  <div className="py-5 border-b border-border/30">
                    {selected.mime_type?.includes('pdf') ? (
                      <iframe
                        src={selected.file_url}
                        className="w-full h-64 rounded-xl border border-border/20"
                        title="Dokument preview"
                      />
                    ) : selected.mime_type?.includes('image') ? (
                      <img
                        src={selected.file_url}
                        alt={selected.title}
                        className="w-full max-h-64 object-contain rounded-xl border border-border/20"
                      />
                    ) : (
                      <div className={`rounded-xl h-48 flex items-center justify-center ${getMimeColor(selected.mime_type)} border border-border/20`}>
                        <div className="text-center">
                          <span className="text-3xl font-bold opacity-30 block">{getMimeIcon(selected.mime_type)}</span>
                          <p className="text-xs text-muted-foreground mt-2">Forhåndsvisning ikke tilgængelig</p>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1 rounded-xl text-xs gap-1.5 h-9" asChild>
                        <a href={selected.file_url} target="_blank" rel="noreferrer">
                          <Eye className="w-3.5 h-3.5" /> Åbn
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 rounded-xl text-xs gap-1.5 h-9" asChild>
                        <a href={selected.file_url} download>
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="py-5 border-b border-border/30 space-y-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Dokumentdetaljer</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1">Type</p>
                      <div className="flex items-center gap-1.5">
                        <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                        <span className="text-sm font-medium text-foreground">{cfg.label}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1">Oprettet</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(selected.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1">Filstørrelse</p>
                      <p className="text-sm font-medium text-foreground">{formatFileSize(selected.file_size)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1">Format</p>
                      <p className="text-sm font-medium text-foreground">{selected.mime_type || 'Ukendt'}</p>
                    </div>
                  </div>
                </div>

                {/* Linked entities */}
                <div className="py-5 border-b border-border/30 space-y-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Tilknytninger</p>
                  {selected.property_id && (
                    <button
                      onClick={() => { setSelected(null); navigate(`/admin/sager/${selected.property_id}`); }}
                      className="flex items-center gap-2 text-sm w-full rounded-lg px-2 py-1.5 hover:bg-muted/20 transition-colors group/link"
                    >
                      <FolderIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-foreground font-medium">Sag</span>
                      <span className="text-primary text-xs truncate group-hover/link:underline">{propertyMap[selected.property_id] || selected._agreement?.property_title || selected.property_id.slice(0, 8)}</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover/link:opacity-100 transition-opacity" />
                    </button>
                  )}
                  {selected.owner_id && (
                    <button
                      onClick={() => { setSelected(null); navigate(`/admin/crm/udlejere`); }}
                      className="flex items-center gap-2 text-sm w-full rounded-lg px-2 py-1.5 hover:bg-muted/20 transition-colors group/link"
                    >
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-foreground font-medium">Ejer</span>
                      <span className="text-primary text-xs truncate group-hover/link:underline">{profileMap[selected.owner_id] || selected._agreement?.owner_name || selected.owner_id.slice(0, 8)}</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover/link:opacity-100 transition-opacity" />
                    </button>
                  )}
                  {selected.booking_id && (
                    <button
                      onClick={() => { setSelected(null); navigate(`/admin/bookings`); }}
                      className="flex items-center gap-2 text-sm w-full rounded-lg px-2 py-1.5 hover:bg-muted/20 transition-colors group/link"
                    >
                      <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-foreground font-medium">Booking</span>
                      <span className="text-primary text-xs truncate group-hover/link:underline">{selected.booking_id.slice(0, 8)}</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover/link:opacity-100 transition-opacity" />
                    </button>
                  )}
                  {!selected.property_id && !selected.owner_id && !selected.booking_id && (
                    <p className="text-xs text-muted-foreground/60">Ingen tilknytninger endnu</p>
                  )}
                </div>

                {/* Actions */}
                <div className="py-5 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-3">Handlinger</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="justify-start gap-2 rounded-xl border-border/40 text-xs h-9">
                      <Link2 className="w-3.5 h-3.5" /> Knyt til sag
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start gap-2 rounded-xl border-border/40 text-xs h-9">
                      <User className="w-3.5 h-3.5" /> Knyt til ejer
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start gap-2 rounded-xl border-border/40 text-xs h-9">
                      <ExternalLink className="w-3.5 h-3.5" /> Del link
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start gap-2 rounded-xl border-border/40 text-xs h-9">
                      <FolderOpen className="w-3.5 h-3.5" /> Arkivér
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
