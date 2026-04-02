import { useState, useEffect, useRef } from 'react';
import { Search, X, Calendar, Home, User, Loader2, Target, FolderOpen, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface SearchResult {
  type: 'booking' | 'property' | 'guest' | 'lead' | 'owner';
  id: string;
  title: string;
  subtitle: string;
  caseNumber?: string;
  status?: string;
  extra?: string;
}

const TYPE_CONFIG: Record<string, { label: string; plural: string; icon: React.ElementType; color: string }> = {
  booking: { label: 'Booking', plural: 'Bookinger', icon: Calendar, color: 'bg-blue-500/10 text-blue-600' },
  property: { label: 'Sag', plural: 'Sager', icon: FolderOpen, color: 'bg-amber-500/10 text-amber-600' },
  guest: { label: 'Gæst', plural: 'Gæster', icon: User, color: 'bg-emerald-500/10 text-emerald-600' },
  lead: { label: 'Lead', plural: 'Leads', icon: Target, color: 'bg-purple-500/10 text-purple-600' },
  owner: { label: 'Udlejer', plural: 'Udlejere', icon: UserCheck, color: 'bg-rose-500/10 text-rose-600' },
};

const STATUS_MAP: Record<string, string> = {
  confirmed: 'Bekræftet', pending: 'Afventer', cancelled: 'Annulleret',
  draft: 'Kladde', published: 'Aktiv', new: 'Ny',
  contacted: 'Kontaktet', won: 'Vundet', lost: 'Tabt',
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    const search = async () => {
      if (!query || query.length < 2) { setResults([]); return; }
      setLoading(true);
      try {
        const q = query.trim();
        const searchResults: SearchResult[] = [];

        const [bookingsRes, propertiesRes, guestsRes, leadsRes, ownersRes] = await Promise.all([
          supabase
            .from('bookings')
            .select('id, case_number, guest_name, guest_email, status, check_in, check_out, total_amount')
            .or(`case_number.ilike.%${q}%,guest_name.ilike.%${q}%,guest_email.ilike.%${q}%`)
            .limit(5),
          supabase
            .from('properties')
            .select('id, title, region, case_number, status, address')
            .or(`title.ilike.%${q}%,region.ilike.%${q}%,case_number.ilike.%${q}%,address.ilike.%${q}%`)
            .limit(5),
          supabase
            .from('guests')
            .select('id, name, email, phone, case_number')
            .or(`name.ilike.%${q}%,email.ilike.%${q}%,case_number.ilike.%${q}%,phone.ilike.%${q}%`)
            .limit(5),
          supabase
            .from('leads')
            .select('id, name, email, phone, status, region, source')
            .or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,region.ilike.%${q}%`)
            .limit(5),
          supabase
            .from('profiles')
            .select('id, full_name, email, phone, case_number, company_name')
            .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,case_number.ilike.%${q}%,phone.ilike.%${q}%`)
            .limit(5),
        ]);

        bookingsRes.data?.forEach(b => {
          searchResults.push({
            type: 'booking', id: b.id,
            title: b.guest_name || b.guest_email || 'Ukendt gæst',
            subtitle: b.check_in && b.check_out ? `${b.check_in} → ${b.check_out}` : '',
            caseNumber: b.case_number,
            status: b.status || undefined,
            extra: b.total_amount ? `${b.total_amount.toLocaleString('da-DK')} DKK` : undefined,
          });
        });

        propertiesRes.data?.forEach(p => {
          searchResults.push({
            type: 'property', id: p.id,
            title: p.title,
            subtitle: [p.address, p.region].filter(Boolean).join(', '),
            caseNumber: p.case_number,
            status: p.status || undefined,
          });
        });

        guestsRes.data?.forEach(g => {
          searchResults.push({
            type: 'guest', id: g.id,
            title: g.name,
            subtitle: [g.email, g.phone].filter(Boolean).join(' · '),
            caseNumber: g.case_number,
          });
        });

        leadsRes.data?.forEach(l => {
          searchResults.push({
            type: 'lead', id: l.id,
            title: l.name,
            subtitle: [l.email, l.region, l.source].filter(Boolean).join(' · '),
            status: l.status || undefined,
          });
        });

        ownersRes.data?.forEach(o => {
          searchResults.push({
            type: 'owner', id: o.id,
            title: o.full_name || o.email,
            subtitle: [o.email, o.phone, o.company_name].filter(Boolean).join(' · '),
            caseNumber: o.case_number,
          });
        });

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(search, 250);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const getLink = (r: SearchResult) => {
    switch (r.type) {
      case 'booking': return `/admin/sager`;
      case 'property': return `/admin/sager`;
      case 'guest': return `/admin/crm/gaester`;
      case 'lead': return `/admin/leads`;
      case 'owner': return `/admin/crm/udlejere`;
      default: return '#';
    }
  };

  const close = () => { setOpen(false); setQuery(''); };

  const typeOrder = ['booking', 'property', 'lead', 'guest', 'owner'];
  const totalResults = results.length;

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-9 w-72 justify-start gap-2 rounded-xl border-border/40 bg-muted/20 text-muted-foreground hover:text-foreground text-xs font-normal px-3"
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-left">Søg sager, kunder, leads...</span>
        <kbd className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded-md font-mono">⌘K</kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl border-border/50">
          <Command shouldFilter={false} className="bg-card">
            {/* Search input */}
            <div className="flex items-center gap-2 border-b border-border/40 px-4 py-1">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Søg på sagsnr., navn, email, telefon..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex h-12 w-full border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 focus-visible:ring-0 shadow-none"
              />
              {query && (
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setQuery('')}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Results */}
            <CommandList className="max-h-[420px] overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Søger...</span>
                </div>
              )}

              {!loading && query.length >= 2 && totalResults === 0 && (
                <CommandEmpty className="py-10 text-center text-muted-foreground text-sm">
                  Ingen resultater for "{query}"
                </CommandEmpty>
              )}

              {!loading && query.length < 2 && query.length > 0 && (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  Skriv mindst 2 tegn...
                </div>
              )}

              {!loading && totalResults > 0 && (
                <>
                  <div className="px-4 py-2 text-[11px] text-muted-foreground/60 font-medium">
                    {totalResults} resultat{totalResults !== 1 ? 'er' : ''} fundet
                  </div>

                  {typeOrder.map(type => {
                    const items = results.filter(r => r.type === type);
                    if (!items.length) return null;
                    const config = TYPE_CONFIG[type];

                    return (
                      <CommandGroup key={type} heading={
                        <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <config.icon className="w-3 h-3" />
                          {config.plural}
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-full">
                            {items.length}
                          </Badge>
                        </span>
                      }>
                        {items.map(result => {
                          const Icon = config.icon;
                          return (
                            <CommandItem
                              key={`${result.type}-${result.id}`}
                              asChild
                              className="cursor-pointer rounded-xl mx-1 py-2.5 px-3 aria-selected:bg-primary/5"
                            >
                              <Link to={getLink(result)} onClick={close} className="flex items-center gap-3 w-full">
                                <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${config.color}`}>
                                  <Icon className="h-4 w-4" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm truncate">{result.title}</span>
                                    {result.caseNumber && (
                                      <Badge variant="outline" className="text-[10px] font-mono shrink-0 px-1.5 py-0 h-4 rounded-md">
                                        {result.caseNumber}
                                      </Badge>
                                    )}
                                    {result.status && (
                                      <Badge variant="secondary" className="text-[10px] shrink-0 px-1.5 py-0 h-4 rounded-md capitalize">
                                        {STATUS_MAP[result.status] || result.status}
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground truncate block mt-0.5">
                                    {result.subtitle}
                                  </span>
                                </div>

                                {result.extra && (
                                  <span className="text-xs font-semibold text-foreground shrink-0">
                                    {result.extra}
                                  </span>
                                )}
                              </Link>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    );
                  })}
                </>
              )}

              {!loading && !query && (
                <div className="py-10 px-6 text-center space-y-3">
                  <div className="flex justify-center gap-2">
                    {Object.values(TYPE_CONFIG).map(c => {
                      const Icon = c.icon;
                      return (
                        <div key={c.label} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${c.color}`}>
                          <Icon className="w-3 h-3" />
                          {c.plural}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground/60">
                    Søg på tværs af bookinger, sager, leads, gæster og udlejere
                  </p>
                </div>
              )}
            </CommandList>

            {/* Footer */}
            <div className="border-t border-border/30 px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground/50">
              <span className="flex items-center gap-1"><kbd className="bg-muted/40 px-1 rounded">↑↓</kbd> navigér</span>
              <span className="flex items-center gap-1"><kbd className="bg-muted/40 px-1 rounded">↵</kbd> åbn</span>
              <span className="flex items-center gap-1"><kbd className="bg-muted/40 px-1 rounded">esc</kbd> luk</span>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
