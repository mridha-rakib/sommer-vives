import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bed, Bath, MapPin, Users, Eye, MessageCircle, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, Clock, Home, ImageIcon,
  CalendarDays, DollarSign, Info, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import { getOwnerListings, type OwnerListing } from '@/lib/owner-listings-api';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { labelKey: string; icon: typeof CheckCircle2; className: string }> = {
  live: { labelKey: 'owner.listings.status.live', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ready: { labelKey: 'owner.listings.status.ready', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  review: { labelKey: 'owner.listings.status.review', icon: Clock, className: 'bg-amber-50 text-amber-700 border-amber-200' },
  preparing: { labelKey: 'owner.listings.status.preparing', icon: Clock, className: 'bg-amber-50 text-amber-700 border-amber-200' },
  draft: { labelKey: 'owner.listings.status.draft', icon: AlertCircle, className: 'bg-slate-100 text-slate-600 border-slate-200' },
  paused: { labelKey: 'owner.listings.status.paused', icon: AlertCircle, className: 'bg-orange-50 text-orange-600 border-orange-200' },
};

function ChannelPill({ name, ready }: { name: string; ready: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
      ready ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground border-border'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ready ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
      {name}
    </span>
  );
}

function ReadinessRing({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? 'stroke-emerald-500' : score >= 50 ? 'stroke-amber-400' : 'stroke-red-400';

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="4" className="stroke-muted" />
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="4" className={color}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-sm font-bold text-foreground">{score}%</span>
    </div>
  );
}

function ListingCard({ listing }: { listing: OwnerListing }) {
  const { t, language } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[listing.internal_status || 'draft'] || STATUS_CONFIG.draft;
  const StatusIcon = status.icon;
  const coverImg = listing.hero_image || listing.images?.[0];
  const score = listing.readiness_score || 0;
  const galleryImages = (listing.images || []).slice(0, 4);
  const localeCode = language === 'da' ? 'da-DK' : language === 'de' ? 'de-DE' : language === 'nl' ? 'nl-NL' : 'en-US';
  const formatMoney = (oere: number) => {
    const formatted = (oere / 100).toLocaleString(localeCode);
    return language === 'da' ? `${formatted} kr` : `DKK ${formatted}`;
  };
  const unit = (count: number, singularKey: string, pluralKey: string) => `${count} ${t(count === 1 ? singularKey : pluralKey)}`;
  const readinessLabel = score >= 80
    ? t('owner.listings.readiness.readyToPublish')
    : score >= 50
      ? t('owner.listings.readiness.almostReady')
      : t('owner.listings.readiness.missingData');

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Hero */}
      <div className="relative h-48 sm:h-56 bg-muted">
        {coverImg ? (
          <img src={coverImg} alt={listing.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home className="h-12 w-12 text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="font-display text-xl font-bold text-white drop-shadow-sm">{listing.name}</h2>
          {listing.address && (
            <p className="text-white/80 text-xs flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" /> {listing.address}
            </p>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant="outline" className={`text-[10px] font-medium backdrop-blur-sm ${status.className}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {t(status.labelKey)}
          </Badge>
        </div>
      </div>

      {/* Quick stats */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          {/* Readiness */}
          <div className="flex items-center gap-3">
            <ReadinessRing score={score} />
            <div>
              <div className="text-xs font-medium text-foreground">{t('owner.listings.readiness')}</div>
              <div className="text-[11px] text-muted-foreground">
                {readinessLabel}
              </div>
            </div>
          </div>

          {/* Channels */}
          <div className="flex flex-col gap-1 items-end">
            <ChannelPill name="Airbnb" ready={listing.channel_airbnb_ready || false} />
            <ChannelPill name="Booking.com" ready={listing.channel_booking_ready || false} />
            <ChannelPill name="Vrbo" ready={listing.channel_vrbo_ready || false} />
          </div>
        </div>

        <Separator />

        {/* Property specs */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {unit(listing.max_guests, 'owner.listings.unit.guest.one', 'owner.listings.unit.guest.other')}</span>
          <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> {unit(listing.bedrooms || 0, 'owner.listings.unit.bedroom.one', 'owner.listings.unit.bedroom.other')}</span>
          <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {unit(listing.bathrooms || 0, 'owner.listings.unit.bath.one', 'owner.listings.unit.bath.other')}</span>
          {listing.min_nights && (
            <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {t('owner.listings.minNights').replace('{count}', String(listing.min_nights))}</span>
          )}
        </div>

        {/* Pricing overview */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <DollarSign className="h-3.5 w-3.5 text-primary" /> {t('owner.listings.pricingOverview')}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">{t('owner.listings.basePrice')}</div>
              <div className="font-medium text-foreground">{formatMoney(listing.base_price_per_night)} / {t('owner.listings.night')}</div>
            </div>
            {listing.weekend_price_per_night && (
              <div>
                <div className="text-muted-foreground">{t('owner.listings.weekend')}</div>
                <div className="font-medium text-foreground">{formatMoney(listing.weekend_price_per_night)} / {t('owner.listings.night')}</div>
              </div>
            )}
            <div>
              <div className="text-muted-foreground">{t('owner.listings.cleaning')}</div>
              <div className="font-medium text-foreground">{formatMoney(listing.cleaning_fee || 0)}</div>
            </div>
          </div>
        </div>

        {/* Expandable details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          {expanded ? t('owner.listings.hideDetails') : t('owner.listings.seeMore')}
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {expanded && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* Description */}
            {listing.description && (
              <div>
                <div className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" /> {t('owner.listings.description')}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">{listing.description}</p>
              </div>
            )}

            {/* Gallery */}
            {galleryImages.length > 0 && (
              <div>
                <div className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5" /> {t('owner.listings.photos')} ({listing.images?.length || 0})
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {galleryImages.map((img, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-muted overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div>
                <div className="text-xs font-medium text-foreground mb-2">{t('owner.listings.amenities')}</div>
                <div className="flex flex-wrap gap-1.5">
                  {listing.amenities.slice(0, 12).map((a, i) => (
                    <span key={i} className="px-2 py-0.5 bg-muted rounded-full text-[10px] text-muted-foreground">{a}</span>
                  ))}
                  {listing.amenities.length > 12 && (
                    <span className="px-2 py-0.5 text-[10px] text-muted-foreground">{t('owner.listings.more').replace('{count}', String(listing.amenities.length - 12))}</span>
                  )}
                </div>
              </div>
            )}

            {/* Check-in/out times */}
            {(listing.check_in_time || listing.check_out_time) && (
              <div className="flex gap-4 text-xs">
                {listing.check_in_time && (
                  <div>
                    <span className="text-muted-foreground">{t('owner.listings.checkin')}: </span>
                    <span className="font-medium text-foreground">{listing.check_in_time}</span>
                  </div>
                )}
                {listing.check_out_time && (
                  <div>
                    <span className="text-muted-foreground">{t('owner.listings.checkout')}: </span>
                    <span className="font-medium text-foreground">{listing.check_out_time}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Owner actions */}
        <div className="flex flex-wrap gap-2">
          <Link to={`/listing/${listing.slug}`} target="_blank" className="flex-1 min-w-[120px]">
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
              <Eye className="h-3.5 w-3.5" /> {t('owner.listings.viewListing')}
            </Button>
          </Link>
          <Link to="/owner/support" className="flex-1 min-w-[120px]">
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
              <MessageCircle className="h-3.5 w-3.5" /> {t('owner.listings.contact')}
            </Button>
          </Link>
          <Link to="/owner/property" className="flex-1 min-w-[120px]">
            <Button variant="default" size="sm" className="w-full gap-1.5 text-xs">
              <Info className="h-3.5 w-3.5" /> {t('owner.listings.reviewInfo')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OwnerListings() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: listings = [], isLoading: loading, error } = useQuery({
    queryKey: ['owner-listings', user?.id],
    queryFn: () => getOwnerListings(user!.id),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (error) toast.error(t('owner.listings.toast.loadError'));
  }, [error, t]);

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{t('owner.listings.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('owner.listings.subtitle')}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> {t('owner.listings.loading')}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">{t('owner.listings.emptyTitle')}</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              {t('owner.listings.emptyDescription')}
            </p>
            <Link to="/owner/support">
              <Button className="gap-2">
                <MessageCircle className="h-4 w-4" /> {t('owner.listings.contact')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
