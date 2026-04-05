import { Link, useLocation } from 'react-router-dom';
import { Home, DoorOpen, ShoppingBag, MessageCircle, LifeBuoy } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { name: 'Ophold', href: '/guest', icon: Home },
  { name: 'Ankomst', href: '/guest/checkin', icon: DoorOpen },
  { name: 'Tilkøb', href: '/guest/addons', icon: ShoppingBag },
  { name: 'Beskeder', href: '/guest/messages', icon: MessageCircle },
  { name: 'Support', href: '/guest/support', icon: LifeBuoy },
];

export function GuestBottomNav() {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/guest') return location.pathname === '/guest';
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
              'flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg transition-all min-w-[56px]',
              isActive(tab.href)
                ? 'text-accent'
                : 'text-muted-foreground'
            )}
          >
            <tab.icon className={cn('w-5 h-5', isActive(tab.href) && 'text-accent')} />
            <span className="text-[10px] font-medium">{tab.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
