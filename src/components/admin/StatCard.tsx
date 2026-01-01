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
  success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800',
  warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800',
  danger: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800',
  info: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
};

const iconStyles = {
  default: 'text-muted-foreground bg-muted',
  success: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/50',
  warning: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/50',
  danger: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/50',
  info: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/50'
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <Card className={cn('p-4 border transition-shadow hover:shadow-md', variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              'text-xs mt-1 font-medium',
              trend.isPositive ? 'text-emerald-600' : 'text-red-600'
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
