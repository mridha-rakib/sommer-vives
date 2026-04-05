import { useState } from 'react';
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
import { da } from 'date-fns/locale';

interface Block {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  block_type: string | null;
  notes: string | null;
}

export default function OwnerCalendar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState<{ from?: Date; to?: Date }>({});
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [blockType, setBlockType] = useState<'blocked' | 'personal'>('blocked');
  const [blockNotes, setBlockNotes] = useState('');

  const { data: properties = [] } = useQuery({
    queryKey: ['owner-properties', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('properties').select('id, title').eq('owner_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ['availability-blocks', selectedProperty],
    queryFn: async () => {
      if (!selectedProperty) return [];
      const { data, error } = await supabase.from('availability_blocks').select('*').eq('property_id', selectedProperty);
      if (error) throw error;
      return data as Block[];
    },
    enabled: !!selectedProperty,
  });

  const { data: inquiries = [] } = useQuery({
    queryKey: ['property-inquiries', selectedProperty],
    queryFn: async () => {
      if (!selectedProperty) return [];
      const { data, error } = await supabase.from('inquiries').select('*').eq('property_id', selectedProperty).in('status', ['confirmed', 'new']);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProperty,
  });

  const createBlock = useMutation({
    mutationFn: async () => {
      if (!selectedDates.from || !selectedDates.to || !selectedProperty) throw new Error('Vælg datoer og ejendom');
      const { error } = await supabase.from('availability_blocks').insert({
        property_id: selectedProperty,
        start_date: format(selectedDates.from, 'yyyy-MM-dd'),
        end_date: format(selectedDates.to, 'yyyy-MM-dd'),
        block_type: blockType,
        notes: blockNotes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-blocks', selectedProperty] });
      toast.success('Datoer blokeret');
      setIsBlockDialogOpen(false);
      setSelectedDates({});
      setBlockNotes('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteBlock = useMutation({
    mutationFn: async (blockId: string) => {
      const { error } = await supabase.from('availability_blocks').delete().eq('id', blockId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-blocks', selectedProperty] });
      toast.success('Blokering fjernet');
    },
  });

  if (properties.length > 0 && !selectedProperty) setSelectedProperty(properties[0].id);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDay = startOfMonth(currentMonth).getDay();
  const paddingDays = firstDay === 0 ? 6 : firstDay - 1;

  const getBlockForDay = (day: Date) => blocks.find(b => isWithinInterval(day, { start: parseISO(b.start_date), end: parseISO(b.end_date) }));
  const getInquiryForDay = (day: Date) => inquiries.find(inq => isWithinInterval(day, { start: parseISO(inq.check_in), end: parseISO(inq.check_out) }));

  return (
    <OwnerLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Kalender</h1>
            <p className="text-sm text-muted-foreground mt-1">Vælg hvornår dit hus er tilgængeligt</p>
          </div>
          <div className="flex items-center gap-3">
            {properties.length > 1 && (
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="w-[200px] rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" className="rounded-xl gap-2">
                  <Plus className="w-4 h-4" /> Bloker datoer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Bloker datoer</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Vælg datoer</Label>
                    <Calendar mode="range" selected={{ from: selectedDates.from, to: selectedDates.to }} onSelect={range => setSelectedDates({ from: range?.from, to: range?.to })} locale={da} className="rounded-xl border mt-2" />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={blockType} onValueChange={(v: 'blocked' | 'personal') => setBlockType(v)}>
                      <SelectTrigger className="mt-2 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blocked"><div className="flex items-center gap-2"><Lock className="w-4 h-4" /> Blokeret</div></SelectItem>
                        <SelectItem value="personal"><div className="flex items-center gap-2"><Home className="w-4 h-4" /> Eget brug</div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Note (valgfrit)</Label>
                    <Textarea value={blockNotes} onChange={e => setBlockNotes(e.target.value)} placeholder="F.eks. 'Familie besøg'" className="mt-2 rounded-xl" />
                  </div>
                  <Button onClick={() => createBlock.mutate()} className="w-full rounded-xl" disabled={!selectedDates.from || !selectedDates.to || createBlock.isPending}>
                    {createBlock.isPending ? 'Gemmer...' : 'Gem blokering'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          {[
            { color: 'bg-emerald-400/20 border-emerald-400/40', label: 'Booking' },
            { color: 'bg-[hsl(var(--gold)/0.2)] border-[hsl(var(--gold)/0.4)]', label: 'Eget brug' },
            { color: 'bg-destructive/10 border-destructive/30', label: 'Blokeret' },
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
                {format(currentMonth, 'MMMM yyyy', { locale: da })}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="rounded-xl">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-0 mb-2">
              {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map(d => (
                <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-2">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0">
              {Array.from({ length: paddingDays }).map((_, i) => (
                <div key={`pad-${i}`} className="h-20 bg-muted/10 border border-border/30 rounded-none first:rounded-tl-lg" />
              ))}
              {days.map(day => {
                const block = getBlockForDay(day);
                const inquiry = getInquiryForDay(day);
                let bg = 'bg-card hover:bg-muted/30';
                if (block) bg = block.block_type === 'personal' ? 'bg-[hsl(var(--gold)/0.12)] hover:bg-[hsl(var(--gold)/0.18)]' : 'bg-destructive/8 hover:bg-destructive/15';
                else if (inquiry) bg = 'bg-emerald-400/10 hover:bg-emerald-400/15';

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
                        <span className="text-[9px] text-muted-foreground">{block.block_type === 'personal' ? 'Eget brug' : 'Blokeret'}</span>
                      </div>
                    )}
                    {inquiry && (
                      <div className="mt-0.5 flex items-center gap-0.5">
                        <Users className="w-2.5 h-2.5 text-emerald-500" />
                        <span className="text-[9px] text-emerald-500">{inquiry.guests}</span>
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
              <h3 className="text-sm font-semibold text-foreground mb-3">Aktive blokeringer</h3>
              <div className="space-y-2">
                {blocks.map(block => (
                  <div key={block.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {format(parseISO(block.start_date), 'd. MMM', { locale: da })} – {format(parseISO(block.end_date), 'd. MMM yyyy', { locale: da })}
                      </div>
                      {block.notes && <div className="text-xs text-muted-foreground">{block.notes}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${block.block_type === 'personal' ? 'bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-light))] border-[hsl(var(--gold)/0.2)]' : 'bg-destructive/15 text-destructive border-destructive/20'}`}>
                        {block.block_type === 'personal' ? 'Eget brug' : 'Blokeret'}
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
