import { supabase } from '@/integrations/supabase/client';

export type AdminEventType =
  | 'meeting'
  | 'visit'
  | 'task'
  | 'reminder'
  | 'udlejningstjek'
  | 'lead_followup';

export interface AdminCalendarEvent {
  id: string;
  event_type: AdminEventType;
  title: string;
  event_date: string;
  event_time: string | null;
  contact_name: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CreateAdminEventInput {
  event_type: AdminEventType;
  title: string;
  event_date: string;
  event_time?: string;
  contact_name?: string;
  notes?: string;
}

export async function getAdminCalendarEvents(
  from: string,
  to: string,
): Promise<AdminCalendarEvent[]> {
  const { data, error } = await supabase
    .from('admin_calendar_events' as any)
    .select('*')
    .gte('event_date', from)
    .lte('event_date', to)
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true, nullsFirst: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AdminCalendarEvent[];
}

export async function createAdminCalendarEvent(
  input: CreateAdminEventInput,
): Promise<AdminCalendarEvent> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('admin_calendar_events' as any)
    .insert({
      event_type:   input.event_type,
      title:        input.title.trim(),
      event_date:   input.event_date,
      event_time:   input.event_time?.trim() || null,
      contact_name: input.contact_name?.trim() || null,
      notes:        input.notes?.trim() || null,
      created_by:   user?.id ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as AdminCalendarEvent;
}

export async function deleteAdminCalendarEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from('admin_calendar_events' as any)
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
