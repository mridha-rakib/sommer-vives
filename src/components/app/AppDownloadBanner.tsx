import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Smartphone, Apple, ArrowRight, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

interface AppDownloadBannerProps {
  variant?: 'compact' | 'full' | 'inline';
  context?: 'owner' | 'guest';
  dismissible?: boolean;
  className?: string;
}

export function AppDownloadBanner({ variant = 'compact', context = 'owner', dismissible = true, className }: AppDownloadBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { canInstall, install, isInstalled } = useInstallPrompt();

  if (dismissed || isInstalled) return null;

  const headline = context === 'owner' 
    ? 'Få SommerVibes i lommen' 
    : 'Download SommerVibes-appen';
  
  const subtitle = context === 'owner'
    ? 'Følg bookinger, indtjening og gæster — direkte fra din telefon.'
    : 'Alt om dit ophold samlet ét sted. Check-in, husinfo og support.';

  const handleAction = async () => {
    if (canInstall) {
      await install();
    }
  };

  const ActionButton = ({ size = 'sm', children, className: btnClass }: { size?: 'sm' | 'default'; children: React.ReactNode; className?: string }) => {
    if (canInstall) {
      return (
        <Button size={size} onClick={handleAction} className={cn('bg-accent text-accent-foreground hover:bg-accent/90', btnClass)}>
          {children}
        </Button>
      );
    }
    return (
      <Link to="/app">
        <Button size={size} className={cn('bg-accent text-accent-foreground hover:bg-accent/90', btnClass)}>
          {children}
        </Button>
      </Link>
    );
  };

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20', className)}>
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">{headline}</div>
          <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
        </div>
        <ActionButton size="sm" className="text-xs h-8 px-3 shrink-0">
          {canInstall ? <><ArrowDown className="w-3 h-3 mr-1" /> Installér</> : <>Hent app</>}
        </ActionButton>
        {dismissible && (
          <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={cn('border-accent/20 overflow-hidden', className)}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">{headline}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ActionButton size="sm" className="text-xs h-8">
              {canInstall ? <><ArrowDown className="w-3 h-3 mr-1" /> Installér</> : <>Hent <ArrowRight className="w-3 h-3 ml-1" /></>}
            </ActionButton>
            {dismissible && (
              <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full variant
  return (
    <Card className={cn('border-accent/20 overflow-hidden relative', className)}>
      {dismissible && (
        <button 
          onClick={() => setDismissed(true)} 
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground z-10"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <div className="bg-gradient-to-br from-accent/15 via-accent/5 to-transparent">
        <CardContent className="p-6 md:p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-accent" />
          </div>
          <h3 className="font-display text-xl font-bold text-foreground mb-2">{headline}</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">{subtitle}</p>
          
          {canInstall ? (
            <Button onClick={handleAction} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 h-12 px-8 rounded-xl text-base">
              <ArrowDown className="w-5 h-5" />
              Installér SommerVibes
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/app">
                <Button className="bg-foreground text-background hover:bg-foreground/90 gap-2 h-12 px-6 rounded-xl">
                  <Apple className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-[9px] leading-none opacity-70">Download i</div>
                    <div className="text-sm font-semibold leading-none">App Store</div>
                  </div>
                </Button>
              </Link>
              <Link to="/app">
                <Button className="bg-foreground text-background hover:bg-foreground/90 gap-2 h-12 px-6 rounded-xl">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302-2.302 2.302-2.698-2.302 2.698-2.302zM5.864 2.658L16.8 8.99l-2.302 2.302-8.635-8.635z"/></svg>
                  <div className="text-left">
                    <div className="text-[9px] leading-none opacity-70">Hent den i</div>
                    <div className="text-sm font-semibold leading-none">Google Play</div>
                  </div>
                </Button>
              </Link>
            </div>
          )}

          <p className="text-xs text-muted-foreground/60 mt-4">
            Gratis at downloade · Kræver iOS 15+ eller Android 10+
          </p>
        </CardContent>
      </div>
    </Card>
  );
}
