import { useState, useEffect } from 'react';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Smartphone, Star, Bell, BarChart3, DoorOpen, ShoppingBag, LifeBuoy, CreditCard, CalendarDays, CheckCircle2, Share, Plus, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

interface AppPromptSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: 'onboarding-complete' | 'agreement-signed' | 'booking-confirmed' | 'pre-arrival' | 'payout-update' | 'owner-dashboard' | 'checkin';
}

const contextContent: Record<string, {
  title: string;
  subtitle: string;
  features: { icon: any; label: string }[];
}> = {
  'onboarding-complete': {
    title: 'Du er godt i gang 🎉',
    subtitle: 'Følg dit sommerhus direkte fra lommen — bookinger, beskeder og indtjening.',
    features: [
      { icon: Bell, label: 'Besked med det samme ved nye bookinger' },
      { icon: BarChart3, label: 'Hold øje med din indtjening i realtid' },
      { icon: Star, label: 'Se gæsternes vurderinger først' },
    ],
  },
  'agreement-signed': {
    title: 'Aftale underskrevet ✍️',
    subtitle: 'Fantastisk! Installér appen og følg hele din klargøringsproces.',
    features: [
      { icon: CheckCircle2, label: 'Se din onboarding-status i realtid' },
      { icon: Bell, label: 'Få besked når din listing er klar' },
      { icon: CalendarDays, label: 'Hold øje med dit besøgsplan' },
    ],
  },
  'booking-confirmed': {
    title: 'Booking bekræftet ✅',
    subtitle: 'Hent appen for den bedste oplevelse under dit ophold.',
    features: [
      { icon: DoorOpen, label: 'Ankomstguide og adgangskode samlet ét sted' },
      { icon: ShoppingBag, label: 'Tilkøb ekstra services med ét tryk' },
      { icon: LifeBuoy, label: 'Direkte kontakt til os, hvis du har brug for hjælp' },
    ],
  },
  'pre-arrival': {
    title: 'Snart tid til ferie 🏖️',
    subtitle: 'Alt du behøver under opholdet — samlet og klar i appen.',
    features: [
      { icon: DoorOpen, label: 'Ankomstguide og nøglekode' },
      { icon: ShoppingBag, label: 'Bestil ekstra til dit ophold' },
      { icon: LifeBuoy, label: 'Hjælp og support hele døgnet' },
    ],
  },
  'payout-update': {
    title: 'Udbetaling opdateret 💰',
    subtitle: 'Installér appen for altid at have overblik over dine udbetalinger.',
    features: [
      { icon: CreditCard, label: 'Se kommende og gennemførte udbetalinger' },
      { icon: BarChart3, label: 'Følg din indtjening over tid' },
      { icon: Bell, label: 'Få besked ved nye udbetalinger' },
    ],
  },
  'owner-dashboard': {
    title: 'Styr dit sommerhus 🏡',
    subtitle: 'Alt du behøver som ejer — samlet i én app.',
    features: [
      { icon: CalendarDays, label: 'Kalender og bookinger i lommen' },
      { icon: BarChart3, label: 'Indtjening og statistik' },
      { icon: Bell, label: 'Push-notifikationer for alt vigtigt' },
    ],
  },
  'checkin': {
    title: 'Velkommen! 🔑',
    subtitle: 'Installér appen for den nemmeste check-in oplevelse.',
    features: [
      { icon: DoorOpen, label: 'Adgangskode altid ved hånden' },
      { icon: LifeBuoy, label: 'Hurtig support under opholdet' },
      { icon: ShoppingBag, label: 'Tilkøb med ét tryk' },
    ],
  },
};

export function AppPromptSheet({ open, onOpenChange, context = 'onboarding-complete' }: AppPromptSheetProps) {
  const content = contextContent[context] || contextContent['onboarding-complete'];
  const { canInstall, install, isIOS, isInstalled } = useInstallPrompt();

  if (isInstalled) return null;

  const handleInstall = async () => {
    if (canInstall) {
      await install();
      onOpenChange(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="max-w-md mx-auto w-full">
          <DrawerHeader className="text-center pt-6">
            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-8 h-8 text-accent" />
            </div>
            <DrawerTitle className="font-display text-xl">{content.title}</DrawerTitle>
            <DrawerDescription className="text-sm">{content.subtitle}</DrawerDescription>
          </DrawerHeader>

          <div className="px-6 space-y-3">
            {content.features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm text-foreground">{f.label}</span>
              </div>
            ))}
          </div>

          {/* iOS instructions */}
          {isIOS && (
            <div className="px-6 mt-4">
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                <p className="text-xs font-semibold text-foreground mb-2">Sådan installerer du på iPhone:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Share className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>Tryk på <strong>Del</strong>-knappen i Safari</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Plus className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>Vælg <strong>"Føj til hjemmeskærm"</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>Appen er klar på din hjemmeskærm!</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DrawerFooter className="pt-6">
            {canInstall ? (
              <Button 
                onClick={handleInstall}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 rounded-xl text-base font-semibold gap-2"
              >
                <ArrowDown className="w-4 h-4" />
                Installér app
              </Button>
            ) : (
              <Link to="/app" className="w-full">
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 rounded-xl text-base font-semibold">
                  {isIOS ? 'Se installationsguide' : 'Download appen'}
                </Button>
              </Link>
            )}
            <DrawerClose asChild>
              <Button variant="ghost" className="text-muted-foreground text-sm">
                Måske senere
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
