import { ReactNode, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, LayoutDashboard, Building2, CalendarDays, Wallet, Users, MessageCircle, 
  Wrench, FileText, FileSignature, CheckSquare, LifeBuoy, Settings, LogOut, 
  Menu, X, ChevronLeft, Bell, BookOpen, ShoppingBag, CreditCard, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface OwnerLayoutProps {
  children: ReactNode;
}

const navSections = [
  {
    label: 'Overblik',
    items: [
      { name: 'Oversigt', href: '/owner', icon: LayoutDashboard },
      { name: 'Min bolig', href: '/owner/property', icon: Building2 },
    ]
  },
  {
    label: 'Booking & gæster',
    items: [
      { name: 'Bookinger', href: '/owner/bookings', icon: BookOpen },
      { name: 'Kalender', href: '/owner/calendar', icon: CalendarDays },
      { name: 'Gæster', href: '/owner/guests', icon: Users },
    ]
  },
  {
    label: 'Økonomi',
    items: [
      { name: 'Indtjening', href: '/owner/earnings', icon: Wallet },
      { name: 'Udbetalinger', href: '/owner/payouts', icon: CreditCard },
      { name: 'Tilkøb & services', href: '/owner/packages', icon: ShoppingBag },
    ]
  },
  {
    label: 'Kommunikation',
    items: [
      { name: 'Beskeder', href: '/owner/messages', icon: MessageCircle, badge: 0 },
    ]
  },
  {
    label: 'Drift',
    items: [
      { name: 'Drift & services', href: '/owner/operations', icon: Wrench },
      { name: 'Opgaver', href: '/owner/tasks', icon: CheckSquare },
    ]
  },
  {
    label: 'Dokumenter & aftale',
    items: [
      { name: 'Dokumenter', href: '/owner/documents', icon: FileText },
      { name: 'Formidlingsaftale', href: '/owner/agreement', icon: FileSignature },
    ]
  },
  {
    label: 'Konto & hjælp',
    items: [
      { name: 'Support', href: '/owner/support', icon: LifeBuoy },
      { name: 'Konto', href: '/owner/account', icon: User },
      { name: 'Indstillinger', href: '/owner/settings', icon: Settings },
    ]
  },
];

export function OwnerLayout({ children }: OwnerLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === '/owner') return location.pathname === '/owner';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        'fixed md:sticky inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        collapsed ? 'w-[68px]' : 'w-64'
      )} style={{ top: 0, height: '100vh' }}>
        <div className={cn('flex items-center justify-between p-4 border-b border-border', collapsed && 'justify-center')}>
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <Home className="h-4 w-4 text-accent" />
              </div>
              <span className="font-display text-lg font-semibold text-foreground">
                Sommer<span className="text-accent">Vibes</span>
              </span>
            </Link>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Home className="h-4 w-4 text-accent" />
            </div>
          )}
          <button 
            className="hidden md:flex text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
          </button>
          <button className="md:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  {section.label}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                      isActive(item.href)
                        ? 'bg-accent/15 text-accent font-medium'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <item.icon className={cn('w-[18px] h-[18px] shrink-0', isActive(item.href) && 'text-accent')} />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                    {!collapsed && 'badge' in item && (item as any).badge > 0 && (
                      <Badge variant="secondary" className="ml-auto text-[10px] h-5 min-w-5 px-1.5 bg-accent/20 text-accent border-0">
                        {(item as any).badge}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className={cn('border-t border-border p-3', collapsed && 'px-2')}>
          {!collapsed && (
            <div className="text-xs text-muted-foreground truncate mb-2 px-1">{user?.email}</div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className={cn(
              'w-full text-muted-foreground hover:text-foreground hover:bg-muted/50',
              collapsed ? 'justify-center px-2' : 'justify-start'
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="ml-2">Log ud</span>}
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between h-14 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 hover:bg-muted rounded-lg">
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="font-display text-lg font-semibold text-foreground hidden md:block">
                Ejerportal
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
                <Bell className="w-4 h-4" />
              </Button>
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border">
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
