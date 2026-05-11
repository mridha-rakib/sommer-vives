import { useAuth } from '@/lib/auth';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Users, BedDouble, Bath, Globe, Image } from 'lucide-react';
import { useTranslation, type Language } from '@/lib/i18n';
import { useQuery } from '@tanstack/react-query';
import { getOwnerPropertyOverview } from '@/lib/owner-property-api';

const localeCodes: Record<Language, string> = {
  da: 'da-DK',
  en: 'en-US',
  de: 'de-DE',
  nl: 'nl-NL',
};

const propertyTypeKeys: Record<string, string> = {
  Sommerhus: 'summerHouse',
  Feriehus: 'holidayHome',
  Lejlighed: 'apartment',
  Villa: 'villa',
  Poolhus: 'poolHouse',
  Luksushus: 'luxuryHouse',
};

const regionKeys: Record<string, string> = {
  Nordjylland: 'northJutland',
  Midtjylland: 'midJutland',
  Syddanmark: 'southernDenmark',
  Sjælland: 'zealand',
  Hovedstaden: 'capital',
  Bornholm: 'bornholm',
};

const amenityKeys: Record<string, string> = {
  Pool: 'pool',
  'Spa / Jacuzzi': 'spa',
  Sauna: 'sauna',
  Havudsigt: 'seaView',
  'Pejs / Brændeovn': 'fireplace',
  Aktivitetsrum: 'activityRoom',
  'Stor have': 'largeGarden',
  'Grill / Udekøkken': 'grillOutdoorKitchen',
  'Carport / Garage': 'carportGarage',
  'Husdyr tilladt': 'petsAllowed',
};

export default function OwnerProperty() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['owner-property-overview', user?.id],
    queryFn: () => getOwnerPropertyOverview(user!.id),
    enabled: !!user?.id,
  });
  const property = data?.property || null;
  const listings = data?.listings || [];
  const loading = !!user?.id && isLoading;

  if (loading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[hsl(var(--gold))] border-t-transparent rounded-full animate-spin" />
        </div>
      </OwnerLayout>
    );
  }

  if (!property) {
    return (
      <OwnerLayout>
        <div className="text-center py-20 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-muted-foreground/30" />
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">{t('owner.property.noPropertyTitle')}</h2>
          <p className="text-muted-foreground text-sm mb-6">{t('owner.property.noPropertyDescription')}</p>
          <Button variant="gold" asChild>
            <a href="/kom-i-gang">{t('owner.property.noPropertyCta')}</a>
          </Button>
        </div>
      </OwnerLayout>
    );
  }

  const statusMap: Record<string, { labelKey: string; className: string }> = {
    draft: { labelKey: 'owner.property.status.draft', className: 'bg-amber-400/15 text-amber-400 border-amber-400/20' },
    published: { labelKey: 'owner.property.status.active', className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
    active: { labelKey: 'owner.property.status.active', className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
    inactive: { labelKey: 'owner.property.status.inactive', className: 'bg-muted text-muted-foreground border-border' },
  };
  const status = statusMap[property.status] || statusMap.draft;
  const translateRegion = (value?: string | null) => {
    if (!value) return '';
    const key = regionKeys[value];
    return key ? t(`owner.property.region.${key}`) : value;
  };
  const translatePropertyType = (value: string) => {
    const key = propertyTypeKeys[value];
    return key ? t(`owner.property.type.${key}`) : value;
  };
  const translateGeneratedTitle = (title?: string | null) => {
    if (!title) return '';
    const generatedTitleMatch = title.match(/^(.+) i (.+)$/);
    if (!generatedTitleMatch) return title;

    const [, type, region] = generatedTitleMatch;
    const translatedType = translatePropertyType(type);
    const translatedRegion = translateRegion(region);
    if (translatedType === type && translatedRegion === region) return title;

    return t('owner.property.generatedTitle')
      .replace('{type}', translatedType)
      .replace('{region}', translatedRegion);
  };
  const translateAmenity = (value: string) => {
    const key = amenityKeys[value];
    return key ? t(`owner.property.amenity.${key}`) : value;
  };
  const formatCount = (value: number | null | undefined, singularKey: string, pluralKey: string) => {
    const displayValue = value || '—';
    const label = value === 1 ? t(singularKey) : t(pluralKey);
    return `${displayValue} ${label}`;
  };
  const formatMoney = (value: number | null | undefined) => {
    if (!value) return '—';
    const formatted = Number(value).toLocaleString(localeCodes[language]);
    return language === 'da' ? `${formatted} kr` : `DKK ${formatted}`;
  };

  const propertyAddress = [property.address, translateRegion(property.region)].filter(Boolean).join(', ');

  return (
    <OwnerLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(var(--gold-dark)/0.1)] via-card to-card border border-border/60 p-6">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="outline" className={`text-[10px] mb-3 ${status.className}`}>{t(status.labelKey)}</Badge>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{translateGeneratedTitle(property.title)}</h1>
              {propertyAddress && (
                <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {propertyAddress}
                </div>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-border/40">
            {[
              {
                icon: Users,
                value: formatCount(property.capacity, 'owner.property.unit.guest.one', 'owner.property.unit.guest.other'),
              },
              {
                icon: BedDouble,
                value: formatCount(property.bedrooms, 'owner.property.unit.bedroom.one', 'owner.property.unit.bedroom.other'),
              },
              {
                icon: Bath,
                value: formatCount(property.bathrooms, 'owner.property.unit.bathroom.one', 'owner.property.unit.bathroom.other'),
              },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <stat.icon className="w-4 h-4" />
                <span>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Photos */}
        {property.images && property.images.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">{t('owner.property.photos')}</h3>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Image className="w-3 h-3" /> {property.images.length}
                </span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {property.images.slice(0, 10).map((img: string, i: number) => (
                  <div key={i} className="aspect-[4/3] rounded-xl bg-muted overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Description & Amenities */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">{t('owner.property.description')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {property.description || t('owner.property.emptyDescription')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">{t('owner.property.amenities')}</h3>
              {property.amenities && property.amenities.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {property.amenities.map((a: string) => (
                    <Badge key={a} variant="secondary" className="text-xs rounded-lg">{translateAmenity(a)}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('owner.property.emptyAmenities')}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Listings */}
        {listings.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-[hsl(var(--gold-light))]" />
                <h3 className="text-sm font-semibold text-foreground">{t('owner.property.listings')}</h3>
              </div>
              <div className="space-y-2">
                {listings.map(listing => (
                  <div key={listing.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div>
                      <div className="text-sm font-medium text-foreground">{listing.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {[translateRegion(listing.region), formatCount(listing.max_guests, 'owner.property.unit.guest.one', 'owner.property.unit.guest.other')].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${listing.is_active ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' : ''}`}>
                      {listing.is_active ? t('owner.property.status.active') : t('owner.property.status.inactive')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing */}
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">{t('owner.property.pricing')}</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: t('owner.property.pricePerNight'), value: property.price_per_night },
                { label: t('owner.property.weeklyPrice'), value: property.price_per_week },
                { label: t('owner.property.cleaning'), value: property.cleaning_fee },
              ].map(item => (
                <div key={item.label} className="text-center p-3 rounded-xl bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                  <div className="text-base font-bold text-foreground">
                    {formatMoney(item.value)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
