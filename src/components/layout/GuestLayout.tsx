import { ReactNode } from 'react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Link, useLocation } from 'react-router-dom';
import { Home, Building2, MessageCircle, ShoppingBag, LogOut } from 'lucide-react';
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

const desktopNavItems = [
  { name: 'Mit ophold', href: '/guest', icon: Home },
  { name: 'Boligen', href: '/guest/property', icon: Building2 },
  { name: 'Beskeder', href: '/guest/messages', icon: MessageCircle },
  { name: 'Tilkøb', href: '/guest/addons', icon: ShoppingBag },
];

export function GuestLayout({ children, onLogout, guestEmail }: GuestLayoutProps) {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/guest') return location.pathname === '/guest';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Clean premium header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-4xl mx-auto flex items-center justify-between h-14 px-4">
          <BrandLogo to="/guest" tagline="Gæsteportal" />
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

        {/* Desktop nav – minimal pill tabs */}
        <div className="hidden md:block border-t border-border/30">
          <div className="max-w-4xl mx-auto px-4">
            <nav className="flex items-center gap-1 py-1.5">
              {desktopNavItems.map(item => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                    isActive(item.href)
                      ? 'bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]'
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

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8 pb-24 md:pb-8">
        {children}
      </main>

      <GuestBottomNav />
    </div>
  );
}
