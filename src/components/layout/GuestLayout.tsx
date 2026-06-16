import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Link, useLocation } from 'react-router-dom';
import { Home, Building2, MessageCircle, ShoppingBag, LogOut, Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GuestBottomNav } from '@/components/app/GuestBottomNav';
import { useUserUnreadMessages } from '@/hooks/useUserUnreadMessages';
import { useChatNotifications } from '@/lib/chatNotifications';
import { toast } from 'sonner';

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
  { name: 'Beskeder', href: '/guest/messages', icon: MessageCircle, badgeKey: 'messages' as const },
  { name: 'Tilkøb', href: '/guest/addons', icon: ShoppingBag },
];

export function GuestLayout({ children, onLogout, guestEmail }: GuestLayoutProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { notify, muted, setMuted } = useChatNotifications(user?.id);

  const unread = useUserUnreadMessages(user?.id, {
    onIncoming: (m) => {
      const onMessagesPage = location.pathname.startsWith('/guest/messages');
      notify({
        fromRole: 'admin',
        fromName: m.sender_name || 'SommerVibes',
        body: m.message,
        url: '/guest/messages',
        alwaysPlay: !onMessagesPage,
      });
      if (!onMessagesPage) {
        toast.message('Ny besked fra SommerVibes', {
          description: m.message.length > 80 ? m.message.slice(0, 80) + '…' : m.message,
          action: { label: 'Åbn', onClick: () => { window.location.href = '/guest/messages'; } },
          duration: 5000,
        });
      }
    },
  });

  const isActive = (href: string) => {
    if (href === '/guest') return location.pathname === '/guest';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Premium header with refined navigation */}
      <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border/40 shadow-[0_1px_20px_-12px_rgba(0,0,0,0.4)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-16 px-4 md:px-6">
          <BrandLogo to="/" tone="light" tagline="Gæsteportal" />
          <div className="flex items-center gap-2 md:gap-3">
            {guestEmail && (
              <span className="text-[11px] text-muted-foreground hidden md:block px-2 py-1 rounded-full bg-muted/30 border border-border/40">
                {guestEmail}
              </span>
            )}
            <button
              onClick={() => setMuted(!muted)}
              title={muted ? 'Slå besked-lyd til' : 'Slå besked-lyd fra'}
              className="w-9 h-9 rounded-full hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-[hsl(var(--gold))] transition-all"
            >
              {muted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </button>
            {onLogout && (
              <Button variant="ghost" size="sm" onClick={onLogout} className="text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-full">
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log ud</span>
              </Button>
            )}
          </div>
        </div>

        {/* Desktop nav – elegant pill tabs with gold underline */}
        <div className="hidden md:block border-t border-border/30">
          <div className="max-w-5xl mx-auto px-4 md:px-6">
            <nav className="flex items-center gap-1 py-2">
              {desktopNavItems.map(item => {
                const showBadge = item.badgeKey === 'messages' && unread > 0;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'relative flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all whitespace-nowrap group',
                      active
                        ? 'bg-[hsl(var(--gold))]/12 text-[hsl(var(--gold))] shadow-[inset_0_0_0_1px_hsl(var(--gold)/0.25)]'
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    )}
                  >
                    <item.icon className={cn('w-4 h-4 transition-transform', active && 'scale-110')} />
                    {item.name}
                    {showBadge && (
                      <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[hsl(var(--gold))] text-background text-[10px] font-bold">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </Link>
                );
              })}
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
