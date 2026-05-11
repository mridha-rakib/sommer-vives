import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export interface RentalCheckRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  region: string;
  propertyType?: string;
  message?: string;
  desiredDate?: Date;
}

const clean = (value: string | undefined) => value?.trim() || null;

const buildNotes = (request: RentalCheckRequest) => {
  const lines = [
    'Book gratis udlejningstjek',
    `Adresse: ${request.address.trim()}`,
    request.desiredDate ? `Ønsket dato: ${format(request.desiredDate, 'yyyy-MM-dd')}` : null,
    request.propertyType ? `Boligtype: ${request.propertyType}` : null,
    request.message?.trim() ? `Besked: ${request.message.trim()}` : null,
  ];

  return lines.filter(Boolean).join('\n');
};

export async function createRentalCheckLead(request: RentalCheckRequest) {
  const { error } = await supabase
    .from('leads')
    .insert({
      name: request.name.trim(),
      email: clean(request.email),
      phone: clean(request.phone),
      source: 'udlejningstjek',
      status: 'new',
      region: request.region.trim(),
      property_type: clean(request.propertyType),
      notes: buildNotes(request),
      next_step: 'Ring og aftal gratis udlejningstjek',
      next_step_date: request.desiredDate ? format(request.desiredDate, 'yyyy-MM-dd') : null,
    });

  if (error) throw new Error(error.message);
}
