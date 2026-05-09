import { BrandLogo } from '@/components/ui/BrandLogo';

export const BrandDivider = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`flex items-center justify-center gap-6 py-10 ${className}`}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        <BrandLogo variant="full" tone="light" size="sm" to="" />
        <span className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground/50 font-medium">
          Eksklusive Sommerhuse
        </span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-transparent" />
    </div>
  );
};
