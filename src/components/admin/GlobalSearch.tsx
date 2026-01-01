import { useState, useEffect, useRef } from 'react';
import { Search, X, Calendar, Home, User, Loader2 } from 'lucide-react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SearchResult {
  type: 'booking' | 'property' | 'guest';
  id: string;
  title: string;
  subtitle: string;
  caseNumber?: string;
}

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
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const search = async () => {
      if (!query || query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const searchResults: SearchResult[] = [];

        // Search bookings
        const { data: bookings } = await supabase
          .from('bookings')
          .select('id, case_number, guest_name, guest_email, status')
          .or(`case_number.ilike.%${query}%,guest_name.ilike.%${query}%,guest_email.ilike.%${query}%`)
          .limit(5);

        bookings?.forEach(b => {
          searchResults.push({
            type: 'booking',
            id: b.id,
            title: b.guest_name || b.guest_email || 'Ukendt gæst',
            subtitle: b.status,
            caseNumber: b.case_number,
          });
        });

        // Search properties
        const { data: properties } = await supabase
          .from('properties')
          .select('id, title, region, case_number')
          .or(`title.ilike.%${query}%,region.ilike.%${query}%,case_number.ilike.%${query}%`)
          .limit(5);

        properties?.forEach(p => {
          searchResults.push({
            type: 'property',
            id: p.id,
            title: p.title,
            subtitle: p.region,
            caseNumber: p.case_number,
          });
        });

        // Search guests
        const { data: guests } = await supabase
          .from('guests')
          .select('id, name, email, case_number')
          .or(`name.ilike.%${query}%,email.ilike.%${query}%,case_number.ilike.%${query}%`)
          .limit(5);

        guests?.forEach(g => {
          searchResults.push({
            type: 'guest',
            id: g.id,
            title: g.name,
            subtitle: g.email,
            caseNumber: g.case_number,
          });
        });

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking': return Calendar;
      case 'property': return Home;
      case 'guest': return User;
      default: return Search;
    }
  };

  const getLink = (result: SearchResult) => {
    switch (result.type) {
      case 'booking': return `/admin/bookings/${result.id}`;
      case 'property': return `/admin/properties/${result.id}/edit`;
      case 'guest': return `/admin/guests/${result.id}`;
      default: return '#';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'booking': return 'Booking';
      case 'property': return 'Bolig';
      case 'guest': return 'Gæst';
      default: return type;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-64 justify-start text-muted-foreground font-normal"
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4 mr-2" />
          <span>Søg...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={inputRef}
              placeholder="Søg på bookinger, boliger, gæster..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex h-11 w-full border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && query.length >= 2 && results.length === 0 && (
              <CommandEmpty>Ingen resultater fundet.</CommandEmpty>
            )}
            {!loading && results.length > 0 && (
              <>
                {['booking', 'property', 'guest'].map(type => {
                  const typeResults = results.filter(r => r.type === type);
                  if (typeResults.length === 0) return null;
                  
                  return (
                    <CommandGroup key={type} heading={getTypeLabel(type) + 'er'}>
                      {typeResults.map(result => {
                        const Icon = getIcon(result.type);
                        return (
                          <CommandItem
                            key={`${result.type}-${result.id}`}
                            asChild
                            className="cursor-pointer"
                          >
                            <Link 
                              to={getLink(result)} 
                              onClick={() => {
                                setOpen(false);
                                setQuery('');
                              }}
                              className="flex items-center gap-3 w-full"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium truncate">{result.title}</span>
                                  {result.caseNumber && (
                                    <Badge variant="outline" className="text-xs shrink-0">
                                      {result.caseNumber}
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground truncate block">
                                  {result.subtitle}
                                </span>
                              </div>
                            </Link>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  );
                })}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
