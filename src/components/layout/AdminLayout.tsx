import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, Users, Building, MessageSquare, Wallet, LogOut, Menu, X, Globe } from 'lucide-react';
import { useState } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Ejere', href: '/admin/owners', icon: Users },
  { name: 'Ejendomme', href: '/admin/properties', icon: Building },
  { name: 'Annoncer', href: '/admin/listings', icon: Globe },
  { name: 'Forespørgsler', href: '/admin/inquiries', icon: MessageSquare },
  { name: 'Udbetalinger', href: '/admin/payouts', icon: Wallet },
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
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-primary/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform flex flex-col`}>
        <div className="p-6 flex-1">
          <div className="flex items-center justify-between mb-2">
            <Link to="/" className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-red-500" />
              <span className="font-display text-xl font-semibold">
                Sommer<span className="text-red-500">drøm</span>
              </span>
            </Link>
            <button className="md:hidden text-white" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full uppercase tracking-wider mb-8">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Staff Only
          </div>

          <nav className="space-y-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-red-500/20 text-red-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-6 border-t border-slate-700">
          <div className="text-sm text-slate-400 mb-2 truncate">{user?.email}</div>
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
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
