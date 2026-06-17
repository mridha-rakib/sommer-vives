import { Link } from 'react-router-dom';
import { Users, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface ListingCardProps {
  id: string;
  title: string;
  location: string;
  image: string;
  capacity: number;
  bedrooms?: number;
  bathrooms?: number;
  pricePerNight: number;
  teaser?: string;
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  onBook?: () => void;
}

export const ListingCard = ({
  id,
  title,
  location,
  image,
  capacity,
  bedrooms,
  bathrooms,
  pricePerNight,
  teaser,
  tags = [],
  rating,
  reviewCount,
  onBook,
}: ListingCardProps) => {
  const { t, language } = useTranslation();
  const locale = language === 'da' ? 'da-DK' : language === 'de' ? 'de-DE' : language === 'nl' ? 'nl-NL' : 'en-US';
  const bedroomLabel = bedrooms === 1 ? t('listingCard.bedroom') : t('listingCard.bedrooms');
  const bathroomLabel = bathrooms === 1 ? t('listingCard.bathroom') : t('listingCard.bathrooms');

  return (
    <Link
      to={`/listing/${id}/`}
      className="rounded-2xl overflow-hidden group flex flex-col h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/30 border border-border bg-card"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image || '/placeholder.svg'}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

        {/* Rating Badge */}
        {rating && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-border/50">
            <Star className="h-3 w-3 text-primary fill-primary" />
            <span className="text-xs font-semibold text-foreground">{rating}</span>
            {reviewCount !== undefined && (
              <span className="text-[10px] text-muted-foreground">({reviewCount})</span>
            )}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="absolute top-3 left-3 flex gap-1.5">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-primary/80 text-primary-foreground font-medium backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          {teaser && (
            <p className="text-xs sm:text-sm text-muted-foreground mb-1 leading-relaxed line-clamp-2">{teaser}</p>
          )}
          <p className="text-[10px] sm:text-xs text-muted-foreground/60 mb-3 sm:mb-4">{location}</p>

          <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-5">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-primary/70" />
              <span>{t('listingCard.upTo').replace('{count}', String(capacity))}</span>
            </div>
            {bedrooms && <span>· {bedrooms} {bedroomLabel}</span>}
            {bathrooms && <span>· {bathrooms} {bathroomLabel}</span>}
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-primary/20 via-primary/10 to-transparent mb-4 sm:mb-5" />

        <div className="flex flex-col gap-3">
          <div>
            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">{t('listingCard.from')}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-display font-bold text-primary">
                {pricePerNight?.toLocaleString(locale) || '—'}
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground">{t('listingCard.priceSuffix')}</span>
            </div>
          </div>
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" className="border-border hover:border-primary flex-1 text-xs sm:text-sm h-9">
              {t('listingCard.details')}
            </Button>
            <Button
              size="sm"
              className="gap-1 flex-1 text-xs sm:text-sm h-9"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBook?.(); }}
            >
              {t('listingCard.book')}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Link>

  );
};
