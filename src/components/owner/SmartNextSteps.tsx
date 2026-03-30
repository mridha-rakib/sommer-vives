import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ArrowRight, FileSignature, Camera, Key, Globe, CalendarDays, 
  CreditCard, Upload, Settings, Sparkles, Bell
} from 'lucide-react';

interface SmartAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  priority: 'high' | 'medium' | 'low';
  category: 'onboarding' | 'listing' | 'operations' | 'growth';
}

interface SmartNextStepsProps {
  property: any;
  onboarding: any;
  agreement: any;
  listings: any[];
  className?: string;
}

export function SmartNextSteps({ property, onboarding, agreement, listings, className }: SmartNextStepsProps) {
  const listing = listings?.[0];

  const allActions: SmartAction[] = [];

  // Onboarding actions
  if (!agreement || agreement.status !== 'signed') {
    allActions.push({
      id: 'sign-agreement',
      title: 'Underskriv din aftale',
      description: 'Aftalen er klar — signér digitalt, så vi kan gøre din bolig klar til udlejning.',
      href: '/owner/agreement',
      icon: FileSignature,
      priority: 'high',
      category: 'onboarding',
    });
  }

  if (!property?.images || property.images.length < 5) {
    allActions.push({
      id: 'upload-photos',
      title: 'Tilføj billeder af dit hus',
      description: `${property?.images?.length || 0} af 5 — gode billeder er det vigtigste for flere bookinger.`,
      href: '/owner/property',
      icon: Camera,
      priority: 'high',
      category: 'listing',
    });
  }

  if (onboarding && !onboarding.keybox_installed_at) {
    allActions.push({
      id: 'keybox',
      title: 'Aftal nøgleboks-installation',
      description: 'Vi klarer installationen — du vælger bare et tidspunkt, der passer dig.',
      href: '/owner/support',
      icon: Key,
      priority: 'medium',
      category: 'onboarding',
    });
  }

  if (!listing) {
    allActions.push({
      id: 'create-listing',
      title: 'Opret din listing',
      description: 'Listingen er det, gæsterne ser. Vi hjælper med tekst og billeder.',
      href: '/owner/property',
      icon: Globe,
      priority: 'high',
      category: 'listing',
    });
  } else if (!listing.is_active) {
    allActions.push({
      id: 'activate-listing',
      title: 'Aktivér din listing',
      description: 'Alt er klar — publicér din bolig og modtag bookinger.',
      href: '/owner/property',
      icon: Globe,
      priority: 'high',
      category: 'listing',
    });
  }

  if (listing && (!listing.base_price_per_night || listing.base_price_per_night === 0)) {
    allActions.push({
      id: 'set-prices',
      title: 'Konfigurér priser',
      description: 'Sæt din natpris og sæsonpriser for optimal indtjening.',
      href: '/owner/property',
      icon: CreditCard,
      priority: 'medium',
      category: 'listing',
    });
  }

  if (!property?.description || property.description.length < 100) {
    allActions.push({
      id: 'improve-desc',
      title: 'Forbedr din boligbeskrivelse',
      description: 'En god beskrivelse øger konvertering med op til 30%.',
      href: '/owner/property',
      icon: Sparkles,
      priority: 'low',
      category: 'growth',
    });
  }

  // Calendar setup
  allActions.push({
    id: 'setup-calendar',
    title: 'Bekræft din sæsonkalender',
    description: 'Markér perioder hvor boligen er tilgængelig for udlejning.',
    href: '/owner/calendar',
    icon: CalendarDays,
    priority: 'medium',
    category: 'operations',
  });

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedActions = allActions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  const visibleActions = sortedActions.slice(0, 4);

  if (visibleActions.length === 0) return null;

  const priorityStyles = {
    high: 'border-accent/30 bg-accent/5',
    medium: 'border-border/50',
    low: 'border-border/30 opacity-80',
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-accent" />
        <span className="text-sm font-semibold text-foreground">Næste skridt</span>
        <span className="text-xs text-muted-foreground ml-auto">{allActions.length} handlinger</span>
      </div>

      {visibleActions.map(action => (
        <Link key={action.id} to={action.href}>
          <Card className={cn(
            'hover:border-accent/30 transition-all cursor-pointer group',
            priorityStyles[action.priority]
          )}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                action.priority === 'high' ? 'bg-accent/15' : 'bg-muted'
              )}>
                <action.icon className={cn(
                  'w-5 h-5',
                  action.priority === 'high' ? 'text-accent' : 'text-muted-foreground'
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                  {action.title}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{action.description}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
