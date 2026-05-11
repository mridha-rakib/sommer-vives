import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type OwnerAgreementDocument = Database['public']['Tables']['agreements']['Row'];
export type OwnerUploadedDocument = Database['public']['Tables']['documents']['Row'];

export interface OwnerDocumentItem {
  type: 'agreement' | 'document';
  id: string;
  title: string;
  date: string;
  status: string;
  url: string | null;
  extra: string;
}

export interface OwnerDocumentsData {
  agreements: OwnerAgreementDocument[];
  documents: OwnerUploadedDocument[];
}

export async function getOwnerDocuments(ownerId: string): Promise<OwnerDocumentsData> {
  const [agreementsRes, documentsRes] = await Promise.all([
    supabase
      .from('agreements')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false }),
    supabase
      .from('documents')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false }),
  ]);

  if (agreementsRes.error) throw new Error(agreementsRes.error.message);
  if (documentsRes.error) throw new Error(documentsRes.error.message);

  return {
    agreements: agreementsRes.data || [],
    documents: documentsRes.data || [],
  };
}

export function normalizeOwnerDocuments(
  data: OwnerDocumentsData,
  agreementTitle: (version: string) => string,
): OwnerDocumentItem[] {
  return [
    ...data.agreements.map((agreement) => ({
      type: 'agreement' as const,
      id: agreement.id,
      title: agreementTitle(agreement.version),
      date: agreement.signed_at || agreement.created_at,
      status: agreement.status,
      url: agreement.pdf_url,
      extra: agreement.commission_percent ? `${agreement.commission_percent}%` : '',
    })),
    ...data.documents.map((document) => ({
      type: 'document' as const,
      id: document.id,
      title: document.title,
      date: document.created_at,
      status: document.status,
      url: document.file_url,
      extra: '',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

