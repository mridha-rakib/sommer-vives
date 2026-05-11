import { supabase } from '@/integrations/supabase/client';

export type OwnerSupportAction = 'call' | 'urgent';

interface CreateOwnerSupportTicketInput {
  ownerId: string;
  ownerEmail?: string | null;
  action: OwnerSupportAction;
}

const ticketMeta: Record<OwnerSupportAction, {
  subject: string;
  description: string;
  category: string;
  priority: string;
}> = {
  call: {
    subject: 'Owner requested a call',
    description: 'The owner requested that the SommerVibes team calls them back.',
    category: 'callback',
    priority: 'normal',
  },
  urgent: {
    subject: 'Urgent owner issue',
    description: 'The owner reported an urgent issue from the owner support page.',
    category: 'urgent',
    priority: 'high',
  },
};

export async function createOwnerSupportTicket(input: CreateOwnerSupportTicketInput) {
  const meta = ticketMeta[input.action];
  const { error } = await supabase.from('support_tickets').insert({
    requester_id: input.ownerId,
    requester_email: input.ownerEmail || null,
    requester_type: 'owner',
    subject: meta.subject,
    description: meta.description,
    category: meta.category,
    priority: meta.priority,
    status: 'open',
  });

  if (error) throw new Error(error.message);
}

