import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Wallet, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { name: 'Oversigt', href: '/owner', icon: LayoutDashboard },
  { name: 'Bookinger', href: '/owner/bookings', icon: CalendarDays },
  { name: 'Økonomi', href: '/owner/earnings', icon: Wallet },
  { name: 'Beskeder', href: '/owner/messages', icon: MessageCircle },
  { name: 'Konto', href: '/owner/account', icon: User },
];

export function OwnerBottomNav() {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/owner') return location.pathname === '/owner';
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/40 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1 pb-[env(safe-area-inset-bottom)]">
        {tabs.map(tab => (
          <Link
            key={tab.href}
            to={tab.href}
            className={cn(
              'flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors min-w-[52px]',
              isActive(tab.href)
                ? 'text-[hsl(var(--gold-light))]'
                : 'text-muted-foreground'
            )}
          >
            <tab.icon className={cn('w-5 h-5', isActive(tab.href) && 'text-[hsl(var(--gold-light))]')} />
            <span className="text-[10px] font-medium">{tab.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
