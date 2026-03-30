// ─── Agreement Template Engine ────────────────────────────────
// Replaces {{placeholder}} variables in agreement templates with real data.

export interface AgreementVariables {
  owner_name: string;
  owner_address: string;
  owner_email: string;
  owner_phone: string;
  property_address: string;
  property_region: string;
  commission_rate: string;
  agreement_date: string;
  binding_period: string;
  signature_name: string;
  signature_date: string;
}

const PLACEHOLDER_REGEX = /\{\{(\w+)\}\}/g;

/** Extract all placeholder names from a template string */
export function extractPlaceholders(template: string): string[] {
  const matches = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = PLACEHOLDER_REGEX.exec(template)) !== null) {
    matches.add(m[1]);
  }
  PLACEHOLDER_REGEX.lastIndex = 0;
  return Array.from(matches);
}

/** Replace all {{key}} placeholders with values from the variables object */
export function renderTemplate(template: string, variables: AgreementVariables): string {
  return template.replace(PLACEHOLDER_REGEX, (match, key) => {
    const value = variables[key as keyof AgreementVariables];
    return value !== undefined && value !== '' ? value : match;
  });
}

/** Get a human-readable label for a placeholder key */
export function placeholderLabel(key: string): string {
  const labels: Record<string, string> = {
    owner_name: 'Ejerens navn',
    owner_address: 'Ejerens adresse',
    owner_email: 'Ejerens e-mail',
    owner_phone: 'Ejerens telefon',
    property_address: 'Boligens adresse',
    property_region: 'Region',
    commission_rate: 'Kommissionssats',
    agreement_date: 'Aftaledato',
    binding_period: 'Bindingsperiode',
    signature_name: 'Underskriftnavn',
    signature_date: 'Underskriftdato',
  };
  return labels[key] || key;
}

/** Build variables from agreement + profile + property data */
export function buildVariables(opts: {
  ownerName?: string;
  ownerAddress?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  propertyAddress?: string;
  propertyRegion?: string;
  commissionPercent?: number;
  bindingMonths?: number;
  signatureName?: string;
}): AgreementVariables {
  const now = new Date();
  return {
    owner_name: opts.ownerName || '',
    owner_address: opts.ownerAddress || '',
    owner_email: opts.ownerEmail || '',
    owner_phone: opts.ownerPhone || '',
    property_address: opts.propertyAddress || '',
    property_region: opts.propertyRegion || '',
    commission_rate: `${opts.commissionPercent || 15}%`,
    agreement_date: now.toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' }),
    binding_period: `${opts.bindingMonths || 6} måneder`,
    signature_name: opts.signatureName || '',
    signature_date: now.toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' }),
  };
}

/** Available statuses for agreement lifecycle */
export const AGREEMENT_STATUSES = [
  { value: 'draft', label: 'Kladde', color: 'bg-muted text-muted-foreground' },
  { value: 'generated', label: 'Genereret', color: 'bg-blue-100 text-blue-700' },
  { value: 'sent', label: 'Sendt', color: 'bg-amber-100 text-amber-700' },
  { value: 'viewed', label: 'Set', color: 'bg-purple-100 text-purple-700' },
  { value: 'signed', label: 'Signeret', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'archived', label: 'Arkiveret', color: 'bg-slate-100 text-slate-500' },
] as const;

export function getStatusMeta(status: string) {
  return AGREEMENT_STATUSES.find(s => s.value === status) || AGREEMENT_STATUSES[0];
}
