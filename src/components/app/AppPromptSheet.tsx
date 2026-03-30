import { useState, useEffect } from 'react';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Smartphone, Star, Bell, BarChart3, DoorOpen, ShoppingBag, LifeBuoy, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AppPromptSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: 'onboarding-complete' | 'booking-confirmed' | 'pre-arrival';
}

const contextContent = {
  'onboarding-complete': {
    title: 'Du er godt i gang 🎉',
    subtitle: 'Følg dit sommerhus direkte fra lommen — bookinger, beskeder og indtjening.',
    features: [
      { icon: Bell, label: 'Besked med det samme ved nye bookinger' },
      { icon: BarChart3, label: 'Hold øje med din indtjening i realtid' },
      { icon: Star, label: 'Se gæsternes vurderinger først' },
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
};

export function AppPromptSheet({ open, onOpenChange, context = 'onboarding-complete' }: AppPromptSheetProps) {
  const content = contextContent[context];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
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

          <DrawerFooter className="pt-6">
            <Link to="/app" className="w-full">
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 rounded-xl text-base font-semibold">
                Download appen
              </Button>
            </Link>
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
