export const BrandDivider = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`flex items-center justify-center gap-6 py-10 ${className}`}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
        <span className="font-display text-lg font-bold text-foreground tracking-tight">
          S<span className="text-primary italic">ommer</span>Vibes
        </span>
        <span className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground/50 font-medium">
          Eksklusive Sommerhuse
        </span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-transparent" />
    </div>
  );
};
