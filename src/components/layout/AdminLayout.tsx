import { ReactNode, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Settings, LogOut, Menu, X, Shield, Calendar,
  List, FileText, ShoppingBag, Users, BookOpen
} from 'lucide-react';
import { GlobalSearch } from '@/components/admin/GlobalSearch';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Listings', href: '/admin/listings', icon: List },
  { name: 'Ejere', href: '/admin/owners', icon: Users },
  { name: 'Bookinger', href: '/admin/bookings', icon: BookOpen },
  { name: 'Kalender', href: '/admin/calendar', icon: Calendar },
  { name: 'Tilkøb', href: '/admin/addons', icon: ShoppingBag },
  { name: 'Dokumenter', href: '/admin/documents', icon: FileText },
  { name: 'Indstillinger', href: '/admin/settings', icon: Settings },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        'fixed md:static inset-y-0 left-0 z-50 w-56 bg-card border-r border-border transition-transform flex flex-col',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="font-display text-sm font-bold block leading-tight text-foreground">SommerVibes</span>
              <span className="text-[10px] text-muted-foreground">Admin</span>
            </div>
          </div>
          <button className="md:hidden text-muted-foreground p-1" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map(item => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all',
                isActive(item.href)
                  ? 'bg-primary/10 text-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              )}
            >
              <item.icon className={cn('w-4 h-4 shrink-0', isActive(item.href) ? 'text-primary' : '')} />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-3 mt-auto border-t border-border">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground truncate">{user?.email}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground p-1 h-auto">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 md:px-6 h-12">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 hover:bg-muted rounded-lg">
                <Menu className="w-5 h-5 text-muted-foreground" />
              </button>
              <div className="hidden md:block">
                <GlobalSearch />
              </div>
            </div>
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Website</Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
