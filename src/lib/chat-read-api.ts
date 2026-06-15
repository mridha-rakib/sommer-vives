import { supabase } from '@/integrations/supabase/client';

export async function markSupportRepliesRead(participantId: string | null | undefined) {
  if (!participantId) return 0;

  const { data, error } = await (supabase.rpc as any)('mark_support_thread_read', {
    p_participant_id: participantId,
  });

  if (error) throw new Error(error.message);
  return typeof data === 'number' ? data : 0;
}
