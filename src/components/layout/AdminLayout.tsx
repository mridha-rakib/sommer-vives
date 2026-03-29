import { ReactNode, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, Users, Wallet, LogOut, Menu, X, Shield, Calendar, UserCheck, Activity, MessageCircle, Tag, Mail, List } from 'lucide-react';
import { GlobalSearch } from '@/components/admin/GlobalSearch';

interface AdminLayoutProps {
  children: ReactNode;
}

import { Calculator } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Bookinger', href: '/admin/bookings', icon: Calendar },
  { name: 'Listings', href: '/admin/listings', icon: List },
  { name: 'Priser & Sæsoner', href: '/admin/pricing', icon: Tag },
  { name: 'Kalender', href: '/admin/calendar', icon: Calendar },
  { name: 'Gæster', href: '/admin/guests', icon: Users },
  { name: 'Ejere', href: '/admin/owners', icon: UserCheck },
  { name: 'Afregning', href: '/admin/payouts', icon: Wallet },
  { name: 'Emails', href: '/admin/emails', icon: Mail },
  { name: 'Live Chat', href: '/admin/chat', icon: MessageCircle },
  { name: 'Optimeringer', href: '/admin/optimizations', icon: Calculator },
  { name: 'Aktivitetslog', href: '/admin/audit-log', icon: Activity },
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
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-transform flex flex-col shadow-2xl`}>
        <div className="p-6 flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-display text-lg font-bold block">
                  Admin Portal
                </span>
                <span className="text-xs text-slate-400">SommerVibes</span>
              </div>
            </div>
            <button className="md:hidden text-white p-1" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Staff badge */}
          <div className="mb-8 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-red-400 uppercase tracking-wider">Staff Only</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Administrer platformen</p>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-white/10 text-white shadow-lg border border-white/10'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-red-400' : ''}`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* User section */}
        <div className="p-6 border-t border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.email}</div>
              <div className="text-xs text-slate-400">Administrator</div>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-700/50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log ud
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <div className="hidden md:block">
                <GlobalSearch />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                ← Tilbage til website
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
