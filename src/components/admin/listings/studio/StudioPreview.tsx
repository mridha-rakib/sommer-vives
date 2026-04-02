import { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, Maximize2, Star, MapPin, Users, BedDouble, Bath, Check, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewProps {
  listing: {
    name: string;
    tagline?: string | null;
    description?: string | null;
    long_description?: string | null;
    about_property?: string | null;
    about_area?: string | null;
    hero_image?: string | null;
    images?: string[] | null;
    highlights?: string[] | null;
    amenities?: string[] | null;
    max_guests: number;
    bedrooms?: number | null;
    bathrooms?: number | null;
    region?: string | null;
    city?: string | null;
    base_price_per_night: number;
    cleaning_fee?: number | null;
    check_in_time?: string | null;
    check_out_time?: string | null;
    house_rules?: string | null;
    practical_info?: string | null;
  };
  open: boolean;
  onClose: () => void;
}

export function StudioPreview({ listing, open, onClose }: PreviewProps) {
  if (!open) return null;

  const heroUrl = listing.hero_image || listing.images?.[0];
  const location = [listing.city, listing.region].filter(Boolean).join(', ');
  const priceFormatted = listing.base_price_per_night > 100
    ? `${Math.round(listing.base_price_per_night / 100).toLocaleString('da-DK')} kr`
    : `${listing.base_price_per_night} kr`;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-hidden flex flex-col">
      {/* Preview toolbar */}
      <div className="h-12 border-b border-border/30 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">Live Preview — SommerVibes Listing</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-lg">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            {heroUrl ? (
              <img src={heroUrl} alt={listing.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Intet hero-billede endnu</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              {location && (
                <div className="flex items-center gap-1.5 text-cream/70 text-xs mb-2">
                  <MapPin className="h-3 w-3" /> {location}
                </div>
              )}
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight">
                {listing.name}
              </h1>
              {listing.tagline && (
                <p className="text-sm text-muted-foreground mt-2 font-display italic">{listing.tagline}</p>
              )}
            </div>
          </div>

          {/* Quick facts */}
          <div className="flex items-center gap-6 px-8 py-5 border-b border-border/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-primary" /> <span>{listing.max_guests} gæster</span>
            </div>
            {listing.bedrooms && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BedDouble className="h-4 w-4 text-primary" /> <span>{listing.bedrooms} soveværelser</span>
              </div>
            )}
            {listing.bathrooms && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bath className="h-4 w-4 text-primary" /> <span>{listing.bathrooms} badeværelser</span>
              </div>
            )}
            <div className="ml-auto">
              <span className="text-xl font-display font-bold text-primary">{priceFormatted}</span>
              <span className="text-xs text-muted-foreground ml-1">/ nat</span>
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="px-8 py-8 border-b border-border/30">
              <p className="text-sm leading-relaxed text-foreground/90">{listing.description}</p>
            </div>
          )}

          {/* Highlights */}
          {listing.highlights && listing.highlights.length > 0 && (
            <div className="px-8 py-8 border-b border-border/30">
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">Højdepunkter</h2>
              <div className="grid grid-cols-2 gap-3">
                {listing.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-foreground/80">
                    <Star className="h-3.5 w-3.5 text-primary shrink-0" /> {h}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About */}
          {listing.long_description && (
            <div className="px-8 py-8 border-b border-border/30">
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">Om boligen</h2>
              <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">{listing.long_description}</p>
            </div>
          )}

          {/* About area */}
          {listing.about_area && (
            <div className="px-8 py-8 border-b border-border/30">
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">Om området</h2>
              <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">{listing.about_area}</p>
            </div>
          )}

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div className="px-8 py-8 border-b border-border/30">
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">Faciliteter</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {listing.amenities.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-foreground/80 py-1.5">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" /> {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery */}
          {listing.images && listing.images.length > 1 && (
            <div className="px-8 py-8 border-b border-border/30">
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">Galleri</h2>
              <div className="grid grid-cols-3 gap-2">
                {listing.images.slice(0, 9).map((img, i) => (
                  <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Practical */}
          <div className="px-8 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {listing.house_rules && (
              <div>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">Husregler</h3>
                <p className="text-sm text-foreground/70 whitespace-pre-line">{listing.house_rules}</p>
              </div>
            )}
            {listing.practical_info && (
              <div>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">Praktisk info</h3>
                <p className="text-sm text-foreground/70 whitespace-pre-line">{listing.practical_info}</p>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="px-8 py-12 text-center">
            <div className="inline-flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-8 py-5">
              <div>
                <p className="font-display text-lg font-bold text-foreground">Book {listing.name}</p>
                <p className="text-sm text-muted-foreground mt-0.5">Fra {priceFormatted} / nat</p>
              </div>
            </div>
          </div>

          <div className="h-16" />
        </div>
      </div>
    </div>
  );
}
