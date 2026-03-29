import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { Home, List, MessageSquare, Wallet, LogOut, Menu, X, Calendar } from 'lucide-react';
import { useState } from 'react';

interface OwnerLayoutProps {
  children: ReactNode;
}

import { ShoppingBag } from 'lucide-react';

const navItems = [
  { name: 'Overblik', href: '/owner', icon: Home },
  { name: 'Mine listings', href: '/owner/listings', icon: List },
  { name: 'Kalender', href: '/owner/calendar', icon: Calendar },
  { name: 'Forespørgsler', href: '/owner/inquiries', icon: MessageSquare },
  { name: 'Udbetalinger', href: '/owner/payouts', icon: Wallet },
  { name: 'Tilkøb', href: '/owner/packages', icon: ShoppingBag },
];

export function OwnerLayout({ children }: OwnerLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/owner') return location.pathname === '/owner';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-primary/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-primary text-background transition-transform flex flex-col`}>
        <div className="p-6 flex-1">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-6 w-6 text-accent" />
              <span className="font-display text-xl font-semibold">
                Sommerhus<span className="text-accent">Bureau</span>
              </span>
            </Link>
            <button className="md:hidden text-background" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'hover:bg-sidebar-accent/50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-6 border-t border-sidebar-border">
          <div className="text-sm text-background/60 mb-2 truncate">{user?.email}</div>
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start text-background/70 hover:text-background hover:bg-sidebar-accent/50"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Log ud
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="md:hidden p-4 border-b border-border bg-background sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-muted rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
