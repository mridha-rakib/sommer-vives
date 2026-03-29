import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { MapPin, CalendarDays, Users, SlidersHorizontal, Search } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface SearchBarProps {
  variant?: 'hero' | 'compact';
  className?: string;
}

export function SearchBar({ variant = 'hero', className = '' }: SearchBarProps) {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [guests, setGuests] = useState(2);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (dateRange.from) params.set('checkin', format(dateRange.from, 'yyyy-MM-dd'));
    if (dateRange.to) params.set('checkout', format(dateRange.to, 'yyyy-MM-dd'));
    if (guests) params.set('guests', guests.toString());
    navigate(`/listings?${params.toString()}`);
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 bg-card rounded-full border shadow-soft p-2 ${className}`}>
        <div className="flex items-center gap-2 px-4 border-r">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Hvor?"
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="border-0 bg-transparent p-0 h-8 w-24 focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-2 px-4 border-r">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Datoer</span>
        </div>
        <div className="flex items-center gap-2 px-4">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{guests} gæster</span>
        </div>
        <Button onClick={handleSearch} size="icon" className="rounded-full bg-primary">
          <Search className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`bg-card/95 backdrop-blur-sm rounded-2xl shadow-elevated p-2 ${className}`}>
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
        {/* Location */}
        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
          <MapPin className="w-5 h-5 text-accent shrink-0" />
          <div className="flex-1">
            <div className="text-xs font-medium text-muted-foreground">Destination</div>
            <Input
              placeholder="Hvor går turen hen?"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="border-0 bg-transparent p-0 h-7 text-base font-medium focus-visible:ring-0 placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        <div className="hidden md:block w-px h-10 bg-border" />

        {/* Dates */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
              <CalendarDays className="w-5 h-5 text-accent shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-medium text-muted-foreground">Datoer</div>
                <div className="text-base font-medium">
                  {dateRange.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, 'd. MMM', { locale: da })} - ${format(dateRange.to, 'd. MMM', { locale: da })}`
                    ) : (
                      format(dateRange.from, 'd. MMM yyyy', { locale: da })
                    )
                  ) : (
                    <span className="text-muted-foreground/60">Tilføj datoer</span>
                  )}
                </div>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
              numberOfMonths={2}
              locale={da}
            />
          </PopoverContent>
        </Popover>

        <div className="hidden md:block w-px h-10 bg-border" />

        {/* Guests */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
              <Users className="w-5 h-5 text-accent shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-medium text-muted-foreground">Gæster</div>
                <div className="text-base font-medium">
                  {guests > 0 ? `${guests} gæster` : <span className="text-muted-foreground/60">Tilføj gæster</span>}
                </div>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="flex items-center justify-between">
              <span className="font-medium">Antal gæster</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                >
                  -
                </Button>
                <span className="w-8 text-center font-semibold">{guests}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setGuests(Math.min(20, guests + 1))}
                >
                  +
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Filters Button */}
        <Button
          variant="outline"
          className="hidden md:flex items-center gap-2 rounded-xl px-4"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtre
        </Button>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 py-6 text-base font-semibold"
        >
          <Search className="w-5 h-5 mr-2" />
          Søg
        </Button>
      </div>
    </div>
  );
}
