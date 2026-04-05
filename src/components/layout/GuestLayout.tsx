import { ReactNode, useState } from 'react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, DoorOpen, Info, ShoppingBag, MessageCircle, 
  LifeBuoy, LogOut, Menu, X
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
  { name: 'Ankomst', href: '/guest/checkin', icon: DoorOpen },
  { name: 'Huset', href: '/guest/house-info', icon: Info },
  { name: 'Tilkøb', href: '/guest/addons', icon: ShoppingBag },
  { name: 'Beskeder', href: '/guest/messages', icon: MessageCircle },
  { name: 'Support', href: '/guest/support', icon: LifeBuoy },
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
      {/* Premium header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-4xl mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="md:hidden p-1.5 hover:bg-muted rounded-lg transition-colors">
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <BrandLogo to="/guest" tagline="Gæsteportal" />
          </div>
          <div className="flex items-center gap-3">
            {guestEmail && (
              <span className="text-[11px] text-muted-foreground hidden md:block">{guestEmail}</span>
            )}
            {onLogout && (
              <Button variant="ghost" size="sm" onClick={onLogout} className="text-xs text-muted-foreground gap-1.5">
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Log ud</span>
              </Button>
            )}
          </div>
        </div>

        {/* Desktop nav - clean pill tabs */}
        <div className="hidden md:block border-t border-border/30">
          <div className="max-w-4xl mx-auto px-4">
            <nav className="flex items-center gap-0.5 py-1.5">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                    isActive(item.href)
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
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

      {/* Mobile slide-out nav */}
      {mobileNavOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileNavOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border/40 z-50 md:hidden p-5 space-y-1 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <span className="font-display text-lg font-semibold text-foreground">Menu</span>
              <button onClick={() => setMobileNavOpen(false)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            {navItems.map(item => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all',
                  isActive(item.href)
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                )}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.name}
              </Link>
            ))}
          </div>
        </>
      )}

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8 pb-24 md:pb-8">
        {children}
      </main>

      <GuestBottomNav />
    </div>
  );
}
