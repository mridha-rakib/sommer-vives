// Unified status badge styles for the admin panel
// Uses semantic Tailwind classes for consistent status representation

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' | 'orange';

const VARIANT_CLASSES: Record<StatusVariant, string> = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  purple: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export function getStatusClasses(variant: StatusVariant): string {
  return VARIANT_CLASSES[variant] || VARIANT_CLASSES.neutral;
}

// ─── Booking status ───
const BOOKING_STATUS: Record<string, { label: string; variant: StatusVariant }> = {
  inquiry: { label: 'Forespørgsel', variant: 'neutral' },
  pending: { label: 'Afventer', variant: 'warning' },
  confirmed: { label: 'Bekræftet', variant: 'success' },
  checked_in: { label: 'Checked-in', variant: 'info' },
  checked_out: { label: 'Checked-out', variant: 'purple' },
  completed: { label: 'Afsluttet', variant: 'neutral' },
  cancelled: { label: 'Annulleret', variant: 'danger' },
};

export function bookingStatusBadge(status: string) {
  const s = BOOKING_STATUS[status] || { label: status, variant: 'neutral' as StatusVariant };
  return { label: s.label, classes: getStatusClasses(s.variant) };
}

// ─── Payment status ───
const PAYMENT_STATUS: Record<string, { label: string; variant: StatusVariant }> = {
  pending: { label: 'Afventer', variant: 'warning' },
  paid: { label: 'Betalt', variant: 'success' },
  failed: { label: 'Fejlet', variant: 'danger' },
  refunded: { label: 'Refunderet', variant: 'purple' },
  partially_paid: { label: 'Delvist betalt', variant: 'orange' },
};

export function paymentStatusBadge(status: string) {
  const s = PAYMENT_STATUS[status] || { label: status, variant: 'neutral' as StatusVariant };
  return { label: s.label, classes: getStatusClasses(s.variant) };
}

// ─── Agreement status ───
const AGREEMENT_STATUS: Record<string, { label: string; variant: StatusVariant }> = {
  draft: { label: 'Kladde', variant: 'neutral' },
  generated: { label: 'Genereret', variant: 'info' },
  sent: { label: 'Sendt', variant: 'info' },
  viewed: { label: 'Set', variant: 'warning' },
  signed: { label: 'Underskrevet', variant: 'success' },
  archived: { label: 'Arkiveret', variant: 'neutral' },
};

export function agreementStatusBadge(status: string) {
  const s = AGREEMENT_STATUS[status] || { label: status, variant: 'neutral' as StatusVariant };
  return { label: s.label, classes: getStatusClasses(s.variant) };
}

// ─── Task / job status ───
const TASK_STATUS: Record<string, { label: string; variant: StatusVariant }> = {
  pending: { label: 'Afventer', variant: 'warning' },
  in_progress: { label: 'I gang', variant: 'info' },
  completed: { label: 'Fuldført', variant: 'success' },
  reported: { label: 'Rapporteret', variant: 'danger' },
  scheduled: { label: 'Planlagt', variant: 'info' },
  installed: { label: 'Installeret', variant: 'success' },
};

export function taskStatusBadge(status: string) {
  const s = TASK_STATUS[status] || { label: status, variant: 'neutral' as StatusVariant };
  return { label: s.label, classes: getStatusClasses(s.variant) };
}

// ─── Support ticket status ───
const TICKET_STATUS: Record<string, { label: string; variant: StatusVariant }> = {
  open: { label: 'Åben', variant: 'danger' },
  in_progress: { label: 'I gang', variant: 'warning' },
  resolved: { label: 'Løst', variant: 'success' },
  closed: { label: 'Lukket', variant: 'neutral' },
};

export function ticketStatusBadge(status: string) {
  const s = TICKET_STATUS[status] || { label: status, variant: 'neutral' as StatusVariant };
  return { label: s.label, classes: getStatusClasses(s.variant) };
}

// ─── Priority ───
const PRIORITY: Record<string, { label: string; variant: StatusVariant }> = {
  urgent: { label: 'Akut', variant: 'danger' },
  high: { label: 'Høj', variant: 'orange' },
  normal: { label: 'Normal', variant: 'neutral' },
  low: { label: 'Lav', variant: 'neutral' },
};

export function priorityBadge(priority: string) {
  const p = PRIORITY[priority] || { label: priority, variant: 'neutral' as StatusVariant };
  return { label: p.label, classes: getStatusClasses(p.variant) };
}

// ─── Currency formatter ───
export function formatDKK(value: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(value);
}
