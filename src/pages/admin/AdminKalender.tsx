import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DAYS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
const MONTHS = ['Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'December'];

export default function AdminKalender() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<any[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const start = new Date(year, month, 1).toISOString().split('T')[0];
    const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
    supabase.from('tasks').select('*').gte('scheduled_date', start).lte('scheduled_date', end)
      .then(({ data }) => setTasks(data || []));
  }, [year, month]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay + 6) % 7;
  const today = new Date().toISOString().split('T')[0];

  const getTasksForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.scheduled_date === dateStr);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader title="Kalender" subtitle="Din operationelle kalender — møder, besøg, deadlines og opgaver" />

        <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentDate(new Date(year, month - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-base font-semibold">{MONTHS[month]} {year}</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentDate(new Date(year, month + 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => setCurrentDate(new Date())}>I dag</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-border/30 rounded-xl overflow-hidden">
              {DAYS.map(d => (
                <div key={d} className="bg-muted/20 p-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{d}</div>
              ))}
              {[...Array(offset)].map((_, i) => <div key={`empty-${i}`} className="bg-card/40 p-2.5 min-h-[90px]" />)}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayTasks = getTasksForDay(day);
                const isToday = dateStr === today;
                return (
                  <div key={day} className={`bg-card/40 p-2.5 min-h-[90px] transition-colors hover:bg-muted/15 ${isToday ? 'ring-1 ring-primary/40 ring-inset bg-primary/5' : ''}`}>
                    <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday ? 'bg-primary text-primary-foreground font-bold' : 'text-foreground'}`}>
                      {day}
                    </span>
                    <div className="mt-1.5 space-y-1">
                      {dayTasks.slice(0, 3).map(t => (
                        <div key={t.id} className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary truncate font-medium">
                          {t.task_type}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <span className="text-[10px] text-muted-foreground pl-1">+{dayTasks.length - 3} mere</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
