import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type OwnerProfile = Database['public']['Tables']['profiles']['Row'];
export type OwnerBankSettings = Database['public']['Tables']['owner_bank_settings']['Row'];
export type OwnerNotificationPreferences = Database['public']['Tables']['notification_preferences']['Row'];

export interface OwnerAccountData {
  profile: OwnerProfile | null;
  bank: OwnerBankSettings | null;
  notifications: OwnerNotificationPreferences | null;
}

export interface OwnerProfileInput {
  fullName: string;
  phone: string;
  companyName: string;
}

export interface OwnerBankInput {
  bankId?: string | null;
  ownerId: string;
  bankName: string;
  regNumber: string;
  accountNumber: string;
  accountHolder: string;
  taxId: string;
}

export type OwnerNotificationInput = Pick<
  OwnerNotificationPreferences,
  'email_bookings' | 'email_payouts' | 'email_messages' | 'email_marketing'
> & {
  id?: string;
  user_id: string;
};

const clean = (value: string) => value.trim() || null;

export async function getOwnerAccount(ownerId: string): Promise<OwnerAccountData> {
  const [profileRes, bankRes, notificationRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', ownerId).maybeSingle(),
    supabase.from('owner_bank_settings').select('*').eq('owner_id', ownerId).maybeSingle(),
    supabase.from('notification_preferences').select('*').eq('user_id', ownerId).maybeSingle(),
  ]);

  if (profileRes.error) throw new Error(profileRes.error.message);
  if (bankRes.error) throw new Error(bankRes.error.message);
  if (notificationRes.error) throw new Error(notificationRes.error.message);

  return {
    profile: profileRes.data,
    bank: bankRes.data,
    notifications: notificationRes.data,
  };
}

export async function saveOwnerProfile(ownerId: string, input: OwnerProfileInput) {
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: clean(input.fullName),
      phone: clean(input.phone),
      company_name: clean(input.companyName),
    })
    .eq('id', ownerId);

  if (error) throw new Error(error.message);
}

export async function saveOwnerBankSettings(input: OwnerBankInput) {
  const payload = {
    owner_id: input.ownerId,
    bank_name: clean(input.bankName),
    reg_number: clean(input.regNumber),
    account_number: clean(input.accountNumber),
    account_holder: clean(input.accountHolder),
    tax_id: clean(input.taxId),
  };

  const result = input.bankId
    ? await supabase.from('owner_bank_settings').update(payload).eq('id', input.bankId)
    : await supabase.from('owner_bank_settings').insert(payload);

  if (result.error) throw new Error(result.error.message);
}

export async function saveOwnerNotificationPreferences(input: OwnerNotificationInput) {
  const payload = {
    user_id: input.user_id,
    email_bookings: input.email_bookings,
    email_payouts: input.email_payouts,
    email_messages: input.email_messages,
    email_marketing: input.email_marketing,
  };

  const result = input.id
    ? await supabase.from('notification_preferences').update(payload).eq('id', input.id)
    : await supabase.from('notification_preferences').insert(payload);

  if (result.error) throw new Error(result.error.message);
}

