import { useEffect, useState } from 'react';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus, X, Home, Lock, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import type { Locale } from 'date-fns';
import { da, de, enUS, nl } from 'date-fns/locale';
import { useTranslation, type Language } from '@/lib/i18n';
import {
  createOwnerCalendarBlock,
  deleteOwnerCalendarBlock,
  getOwnerCalendarBlocks,
  getOwnerCalendarBookings,
  getOwnerCalendarProperties,
  type OwnerCalendarBlockType,
} from '@/lib/owner-calendar-api';

const dateLocales: Record<Language, Locale> = {
  da,
  en: enUS,
  de,
  nl,
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

export default function OwnerCalendar() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState<{ from?: Date; to?: Date }>({});
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [blockType, setBlockType] = useState<OwnerCalendarBlockType>('blocked');
  const [blockNotes, setBlockNotes] = useState('');

  const { data: properties = [] } = useQuery({
    queryKey: ['owner-properties', user?.id],
    queryFn: () => getOwnerCalendarProperties(user!.id),
    enabled: !!user?.id,
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ['availability-blocks', selectedProperty],
    queryFn: () => getOwnerCalendarBlocks(selectedProperty),
    enabled: !!selectedProperty,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['property-calendar-bookings', selectedProperty],
    queryFn: () => getOwnerCalendarBookings(selectedProperty),
    enabled: !!selectedProperty,
  });

  const createBlock = useMutation({
    mutationFn: async () => {
      if (!selectedDates.from || !selectedDates.to || !selectedProperty) throw new Error(t('owner.calendar.error.selectDatesProperty'));
      await createOwnerCalendarBlock({
        propertyId: selectedProperty,
        from: selectedDates.from,
        to: selectedDates.to,
        blockType,
        notes: blockNotes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-blocks', selectedProperty] });
      toast.success(t('owner.calendar.toast.blocked'));
      setIsBlockDialogOpen(false);
      setSelectedDates({});
      setBlockNotes('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteBlock = useMutation({
    mutationFn: deleteOwnerCalendarBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-blocks', selectedProperty] });
      toast.success(t('owner.calendar.toast.removed'));
    },
  });

  useEffect(() => {
    if (properties.length > 0 && !selectedProperty) {
      setSelectedProperty(properties[0].id);
    }
  }, [properties, selectedProperty]);

  useEffect(() => {
    if (!selectedProperty) return undefined;

    const channel = supabase
      .channel(`owner-calendar-${selectedProperty}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'availability_blocks', filter: `property_id=eq.${selectedProperty}` },
        () => queryClient.invalidateQueries({ queryKey: ['availability-blocks', selectedProperty] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `property_id=eq.${selectedProperty}` },
        () => queryClient.invalidateQueries({ queryKey: ['property-calendar-bookings', selectedProperty] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, selectedProperty]);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDay = startOfMonth(currentMonth).getDay();
  const paddingDays = firstDay === 0 ? 6 : firstDay - 1;

  const getBlockForDay = (day: Date) => blocks.find(b => isWithinInterval(day, { start: parseISO(b.start_date), end: parseISO(b.end_date) }));
  const getBookingForDay = (day: Date) => bookings.find(booking => isWithinInterval(day, { start: parseISO(booking.check_in), end: parseISO(booking.check_out) }));
  const dateLocale = dateLocales[language];
  const monthFormat = language === 'en' ? 'MMMM yyyy' : 'MMMM yyyy';
  const rangeStartFormat = language === 'en' ? 'MMM d' : 'd. MMM';
  const rangeEndFormat = language === 'en' ? 'MMM d, yyyy' : 'd. MMM yyyy';
  const weekdays = [
    t('owner.calendar.weekday.mon'),
    t('owner.calendar.weekday.tue'),
    t('owner.calendar.weekday.wed'),
    t('owner.calendar.weekday.thu'),
    t('owner.calendar.weekday.fri'),
    t('owner.calendar.weekday.sat'),
    t('owner.calendar.weekday.sun'),
  ];
  const blockTypeLabel = (type: OwnerCalendarBlockType | null) => {
    if (type === 'personal') return t('owner.calendar.personalUse');
    if (type === 'maintenance') return t('owner.calendar.maintenance');
    return t('owner.calendar.blocked');
  };
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

  return (
    <OwnerLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('owner.nav.calendar')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('owner.calendar.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            {properties.length > 1 && (
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="w-[200px] rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => <SelectItem key={p.id} value={p.id}>{translateGeneratedTitle(p.title)}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" className="rounded-xl gap-2">
                  <Plus className="w-4 h-4" /> {t('owner.calendar.blockDates')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{t('owner.calendar.blockDates')}</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>{t('owner.calendar.selectDates')}</Label>
                    <Calendar mode="range" selected={{ from: selectedDates.from, to: selectedDates.to }} onSelect={range => setSelectedDates({ from: range?.from, to: range?.to })} locale={dateLocale} className="rounded-xl border mt-2" />
                  </div>
                  <div>
                    <Label>{t('owner.calendar.type')}</Label>
                    <Select value={blockType} onValueChange={(v) => setBlockType(v as OwnerCalendarBlockType)}>
                      <SelectTrigger className="mt-2 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blocked"><div className="flex items-center gap-2"><Lock className="w-4 h-4" /> {t('owner.calendar.blocked')}</div></SelectItem>
                        <SelectItem value="personal"><div className="flex items-center gap-2"><Home className="w-4 h-4" /> {t('owner.calendar.personalUse')}</div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('owner.calendar.noteOptional')}</Label>
                    <Textarea value={blockNotes} onChange={e => setBlockNotes(e.target.value)} placeholder={t('owner.calendar.notePlaceholder')} className="mt-2 rounded-xl" />
                  </div>
                  <Button onClick={() => createBlock.mutate()} className="w-full rounded-xl" disabled={!selectedDates.from || !selectedDates.to || createBlock.isPending}>
                    {createBlock.isPending ? t('owner.calendar.saving') : t('owner.calendar.saveBlock')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          {[
            { color: 'bg-emerald-400/20 border-emerald-400/40', label: t('owner.calendar.booking') },
            { color: 'bg-[hsl(var(--gold)/0.2)] border-[hsl(var(--gold)/0.4)]', label: t('owner.calendar.personalUse') },
            { color: 'bg-destructive/10 border-destructive/30', label: t('owner.calendar.blocked') },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <div className={`w-3.5 h-3.5 rounded border ${l.color}`} />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="rounded-xl">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="font-display text-lg font-semibold text-foreground capitalize">
                {format(currentMonth, monthFormat, { locale: dateLocale })}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="rounded-xl">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-0 mb-2">
              {weekdays.map(d => (
                <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-2">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0">
              {Array.from({ length: paddingDays }).map((_, i) => (
                <div key={`pad-${i}`} className="h-20 bg-muted/10 border border-border/30 rounded-none first:rounded-tl-lg" />
              ))}
              {days.map(day => {
                const block = getBlockForDay(day);
                const booking = getBookingForDay(day);
                let bg = 'bg-card hover:bg-muted/30';
                if (block) bg = block.block_type === 'personal' ? 'bg-[hsl(var(--gold)/0.12)] hover:bg-[hsl(var(--gold)/0.18)]' : 'bg-destructive/8 hover:bg-destructive/15';
                else if (booking) bg = 'bg-emerald-400/10 hover:bg-emerald-400/15';

                return (
                  <div key={day.toISOString()} className={`h-20 p-1.5 border border-border/30 transition-colors cursor-pointer ${bg} ${!isSameMonth(day, currentMonth) ? 'opacity-30' : ''}`}>
                    <div className="flex items-start justify-between">
                      <span className={`text-xs font-medium ${isSameDay(day, new Date()) ? 'bg-[hsl(var(--gold))] text-background w-5 h-5 rounded-full flex items-center justify-center text-[10px]' : 'text-foreground'}`}>
                        {format(day, 'd')}
                      </span>
                      {block && (
                        <button onClick={e => { e.stopPropagation(); deleteBlock.mutate(block.id); }} className="p-0.5 rounded hover:bg-card">
                          <X className="w-2.5 h-2.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    {block && (
                      <div className="mt-0.5">
                        <span className="text-[9px] text-muted-foreground">{blockTypeLabel(block.block_type)}</span>
                      </div>
                    )}
                    {booking && (
                      <div className="mt-0.5 flex items-center gap-0.5">
                        <Users className="w-2.5 h-2.5 text-emerald-500" />
                        <span className="text-[9px] text-emerald-500">{booking.guests_count || 1}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Active blocks */}
        {blocks.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">{t('owner.calendar.activeBlocks')}</h3>
              <div className="space-y-2">
                {blocks.map(block => (
                  <div key={block.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {format(parseISO(block.start_date), rangeStartFormat, { locale: dateLocale })} – {format(parseISO(block.end_date), rangeEndFormat, { locale: dateLocale })}
                      </div>
                      {block.notes && <div className="text-xs text-muted-foreground">{block.notes}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${block.block_type === 'personal' ? 'bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-light))] border-[hsl(var(--gold)/0.2)]' : 'bg-destructive/15 text-destructive border-destructive/20'}`}>
                        {blockTypeLabel(block.block_type)}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => deleteBlock.mutate(block.id)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </OwnerLayout>
  );
}
