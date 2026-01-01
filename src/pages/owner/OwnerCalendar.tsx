import { useState } from 'react';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Home, Lock, Users } from 'lucide-react';
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

  // Fetch owner's properties
  const { data: properties = [] } = useQuery({
    queryKey: ['owner-properties', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('id, title')
        .eq('owner_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch availability blocks for selected property
  const { data: blocks = [] } = useQuery({
    queryKey: ['availability-blocks', selectedProperty],
    queryFn: async () => {
      if (!selectedProperty) return [];
      const { data, error } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('property_id', selectedProperty);
      if (error) throw error;
      return data as Block[];
    },
    enabled: !!selectedProperty,
  });

  // Fetch inquiries for selected property
  const { data: inquiries = [] } = useQuery({
    queryKey: ['property-inquiries', selectedProperty],
    queryFn: async () => {
      if (!selectedProperty) return [];
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .eq('property_id', selectedProperty)
        .in('status', ['confirmed', 'new']);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProperty,
  });

  // Create block mutation
  const createBlock = useMutation({
    mutationFn: async () => {
      if (!selectedDates.from || !selectedDates.to || !selectedProperty) {
        throw new Error('Vælg venligst datoer og ejendom');
      }
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
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete block mutation
  const deleteBlock = useMutation({
    mutationFn: async (blockId: string) => {
      const { error } = await supabase
        .from('availability_blocks')
        .delete()
        .eq('id', blockId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-blocks', selectedProperty] });
      toast.success('Blokering fjernet');
    },
  });

  // Set first property as default
  if (properties.length > 0 && !selectedProperty) {
    setSelectedProperty(properties[0].id);
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => addMonths(prev, direction === 'next' ? 1 : -1));
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getBlockForDay = (day: Date) => {
    return blocks.find(block => {
      const start = parseISO(block.start_date);
      const end = parseISO(block.end_date);
      return isWithinInterval(day, { start, end });
    });
  };

  const getInquiryForDay = (day: Date) => {
    return inquiries.find(inquiry => {
      const start = parseISO(inquiry.check_in);
      const end = parseISO(inquiry.check_out);
      return isWithinInterval(day, { start, end });
    });
  };

  const getDayClasses = (day: Date) => {
    const block = getBlockForDay(day);
    const inquiry = getInquiryForDay(day);
    
    let classes = 'h-24 p-2 border border-border/50 transition-colors cursor-pointer ';
    
    if (block) {
      classes += block.block_type === 'personal' 
        ? 'bg-accent/20 hover:bg-accent/30 ' 
        : 'bg-destructive/10 hover:bg-destructive/20 ';
    } else if (inquiry) {
      classes += 'bg-green-100 hover:bg-green-200 ';
    } else {
      classes += 'bg-card hover:bg-muted/50 ';
    }
    
    if (!isSameMonth(day, currentMonth)) {
      classes += 'opacity-40 ';
    }
    
    return classes;
  };

  const days = getDaysInMonth();
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();
  const paddingDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Monday start

  return (
    <OwnerLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Kalender</h1>
          <p className="text-muted-foreground">
            Administrer tilgængelighed og se bookinger
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Vælg ejendom" />
            </SelectTrigger>
            <SelectContent>
              {properties.map(property => (
                <SelectItem key={property.id} value={property.id}>
                  {property.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold">
                <Plus className="w-4 h-4 mr-2" />
                Bloker datoer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bloker datoer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Vælg datoer</Label>
                  <Calendar
                    mode="range"
                    selected={{ from: selectedDates.from, to: selectedDates.to }}
                    onSelect={(range) => setSelectedDates({ from: range?.from, to: range?.to })}
                    locale={da}
                    className="rounded-md border mt-2"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={blockType} onValueChange={(v: 'blocked' | 'personal') => setBlockType(v)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blocked">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Blokeret
                        </div>
                      </SelectItem>
                      <SelectItem value="personal">
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          Eget brug
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Note (valgfrit)</Label>
                  <Textarea
                    value={blockNotes}
                    onChange={(e) => setBlockNotes(e.target.value)}
                    placeholder="F.eks. 'Familie besøg'"
                    className="mt-2"
                  />
                </div>
                <Button 
                  onClick={() => createBlock.mutate()} 
                  className="w-full"
                  disabled={!selectedDates.from || !selectedDates.to || createBlock.isPending}
                >
                  {createBlock.isPending ? 'Gemmer...' : 'Gem blokering'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
          <span className="text-sm text-muted-foreground">Booking</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-accent/20 border border-accent/50" />
          <span className="text-sm text-muted-foreground">Eget brug</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-destructive/10 border border-destructive/30" />
          <span className="text-sm text-muted-foreground">Blokeret</span>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <CardTitle className="font-display text-xl">
            {format(currentMonth, 'MMMM yyyy', { locale: da })}
          </CardTitle>
          <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-0 mb-2">
            {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0">
            {/* Padding days */}
            {Array.from({ length: paddingDays }).map((_, idx) => (
              <div key={`pad-${idx}`} className="h-24 bg-muted/20 border border-border/50" />
            ))}

            {/* Actual days */}
            {days.map(day => {
              const block = getBlockForDay(day);
              const inquiry = getInquiryForDay(day);
              
              return (
                <div
                  key={day.toISOString()}
                  className={getDayClasses(day)}
                >
                  <div className="flex items-start justify-between">
                    <span className={`text-sm font-medium ${
                      isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center' : ''
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {block && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBlock.mutate(block.id);
                        }}
                        className="p-0.5 rounded hover:bg-card"
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  {block && (
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs">
                        {block.block_type === 'personal' ? 'Eget brug' : 'Blokeret'}
                      </Badge>
                    </div>
                  )}
                  {inquiry && (
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-700">
                        <Users className="w-3 h-3 mr-1" />
                        {inquiry.guests}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Blocks List */}
      {blocks.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Aktive blokeringer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {blocks.map(block => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {format(parseISO(block.start_date), 'd. MMM', { locale: da })} - {format(parseISO(block.end_date), 'd. MMM yyyy', { locale: da })}
                      </div>
                      {block.notes && (
                        <div className="text-sm text-muted-foreground">{block.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={block.block_type === 'personal' ? 'secondary' : 'destructive'}>
                      {block.block_type === 'personal' ? 'Eget brug' : 'Blokeret'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteBlock.mutate(block.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </OwnerLayout>
  );
}
