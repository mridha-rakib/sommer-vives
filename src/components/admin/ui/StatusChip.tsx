import { cn } from '@/lib/utils';

export type StatusVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

export interface StatusChipProps {
  label: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const variants = {
  default: 'bg-secondary text-secondary-foreground',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-primary/10 text-primary border-primary/20',
  muted: 'bg-muted text-muted-foreground',
};

const dotColors = {
  default: 'bg-secondary-foreground',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
  info: 'bg-primary',
  muted: 'bg-muted-foreground',
};

export function StatusChip({ label, variant = 'default', size = 'sm', dot, className }: StatusChipProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border font-medium',
      variants[variant],
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
      className
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {label}
    </span>
  );
}
