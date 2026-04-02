import { ReactNode, useState } from 'react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, CalendarDays, DoorOpen, Info, ShoppingBag, MessageCircle, 
  LifeBuoy, LogOut, Menu, X, CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GuestBottomNav } from '@/components/app/GuestBottomNav';

interface GuestLayoutProps {
  children: ReactNode;
  bookingData?: {
    propertyName?: string;
    heroImage?: string;
    checkIn?: string;
    checkOut?: string;
  };
  onLogout?: () => void;
  guestEmail?: string;
}

const navItems = [
  { name: 'Mit ophold', href: '/guest', icon: Home },
  { name: 'Reservation', href: '/guest/reservation', icon: CalendarDays },
  { name: 'Check-in', href: '/guest/checkin', icon: DoorOpen },
  { name: 'Husinformation', href: '/guest/house-info', icon: Info },
  { name: 'Tilkøb', href: '/guest/addons', icon: ShoppingBag },
  { name: 'Betaling', href: '/guest/payment', icon: CreditCard },
  { name: 'Beskeder', href: '/guest/messages', icon: MessageCircle },
  { name: 'Support', href: '/guest/support', icon: LifeBuoy },
  { name: 'Check-out', href: '/guest/checkout', icon: LogOut },
];

export function GuestLayout({ children, bookingData, onLogout, guestEmail }: GuestLayoutProps) {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/guest') return location.pathname === '/guest';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="md:hidden p-1.5 hover:bg-muted rounded-lg">
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <BrandLogo to="/guest" tagline="Gæsteportal" />
          </div>
          <div className="flex items-center gap-3">
            {guestEmail && (
              <span className="text-xs text-muted-foreground hidden md:block">{guestEmail}</span>
            )}
            {onLogout && (
              <Button variant="ghost" size="sm" onClick={onLogout} className="text-xs text-muted-foreground">
                Log ud
              </Button>
            )}
          </div>
        </div>

        <div className="hidden md:block border-t border-border/50">
          <div className="max-w-5xl mx-auto px-4">
            <nav className="flex items-center gap-1 overflow-x-auto py-1">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                    isActive(item.href)
                      ? 'bg-accent/15 text-accent'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {mobileNavOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileNavOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 md:hidden p-4 space-y-1">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display text-lg font-semibold text-foreground">Menu</span>
              <button onClick={() => setMobileNavOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            {navItems.map(item => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive(item.href)
                    ? 'bg-accent/15 text-accent font-medium'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
          </div>
        </>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 pb-24 md:pb-8">
        {children}
      </main>

      <GuestBottomNav />
    </div>
  );
}
