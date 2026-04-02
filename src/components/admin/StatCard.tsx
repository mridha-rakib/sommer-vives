import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const variantStyles = {
  default: 'bg-card border-border',
  success: 'bg-card border-border',
  warning: 'bg-card border-border',
  danger: 'bg-card border-border',
  info: 'bg-card border-border',
};

const iconStyles = {
  default: 'text-muted-foreground bg-muted',
  success: 'text-emerald-400 bg-emerald-400/10',
  warning: 'text-amber-400 bg-amber-400/10',
  danger: 'text-red-400 bg-red-400/10',
  info: 'text-primary bg-primary/10',
};

const valueStyles = {
  default: 'text-foreground',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  danger: 'text-red-400',
  info: 'text-primary',
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <Card className={cn('p-4 border transition-shadow hover:shadow-md', variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn('text-2xl font-bold mt-1', valueStyles[variant])}>{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              'text-xs mt-1 font-medium',
              trend.isPositive ? 'text-emerald-400' : 'text-red-400'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={cn('p-2.5 rounded-lg', iconStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
