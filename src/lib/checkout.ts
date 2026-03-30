import { supabase } from '@/integrations/supabase/client';

export async function initiateCheckout(bookingId: string): Promise<string | null> {
  const baseUrl = window.location.origin;

  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: {
      bookingId,
      successUrl: `${baseUrl}/guest?payment=success&booking=${bookingId}`,
      cancelUrl: `${baseUrl}/guest?payment=cancelled&booking=${bookingId}`,
    },
  });

  if (error || !data?.url) {
    console.error('Checkout error:', error || data);
    return null;
  }

  return data.url;
}
