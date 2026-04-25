import { ReactNode, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, CalendarDays, Wallet, MessageCircle, 
  FileText, LifeBuoy, LogOut, Menu, X, ChevronLeft, Crown, User,
  Bell, BellOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OwnerBottomNav } from '@/components/app/OwnerBottomNav';
import { useUserUnreadMessages } from '@/hooks/useUserUnreadMessages';
import { useChatNotifications } from '@/lib/chatNotifications';
import { toast } from 'sonner';

interface OwnerLayoutProps {
  children: ReactNode;
}

const navItems = [
  { name: 'Oversigt', href: '/owner', icon: LayoutDashboard },
  { name: 'Min bolig', href: '/owner/property', icon: Building2 },
  { name: 'Bookinger', href: '/owner/bookings', icon: CalendarDays },
  { name: 'Økonomi', href: '/owner/earnings', icon: Wallet },
  { name: 'Beskeder', href: '/owner/messages', icon: MessageCircle },
  { name: 'Dokumenter', href: '/owner/documents', icon: FileText },
  { name: 'Support', href: '/owner/support', icon: LifeBuoy },
];

export function OwnerLayout({ children }: OwnerLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const { notify, muted, setMuted } = useChatNotifications();
  const unreadMessages = useUserUnreadMessages(user?.id, {
    onIncoming: (m) => {
      // Toast even when on /owner/messages — small, non-intrusive
      const onMessagesPage = location.pathname.startsWith('/owner/messages');
      notify({
        fromRole: 'admin',
        fromName: m.sender_name || 'SommerVibes',
        body: m.message,
        url: '/owner/messages',
        alwaysPlay: !onMessagesPage,
      });
      if (!onMessagesPage) {
        toast.message('Ny besked fra SommerVibes', {
          description: m.message.length > 80 ? m.message.slice(0, 80) + '…' : m.message,
          action: { label: 'Åbn', onClick: () => { window.location.href = '/owner/messages'; } },
          duration: 5000,
        });
      }
    },
  });

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
        'fixed md:sticky inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border/60 transition-all duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        collapsed ? 'w-[68px]' : 'w-60'
      )} style={{ top: 0, height: '100vh' }}>
        {/* Header */}
        <div className={cn('flex items-center justify-between p-4 border-b border-border/40', collapsed && 'justify-center')}>
          {!collapsed && <BrandLogo to="/owner" tagline="Ejerportal" />}
          {collapsed && <BrandLogo to="/owner" tagline="" className="[&>span:first-child]:text-xs" />}
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

        {/* Member badge */}
        {!collapsed && (
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[hsl(var(--gold)/0.08)] border border-[hsl(var(--gold)/0.15)]">
              <Crown className="w-3.5 h-3.5 text-[hsl(var(--gold-light))]" />
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[hsl(var(--gold-light))]">
                Premium Medlem
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="space-y-1">
            {navItems.map(item => {
              const showBadge = item.href === '/owner/messages' && unreadMessages > 0;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                    isActive(item.href)
                      ? 'bg-[hsl(var(--gold)/0.12)] text-[hsl(var(--gold-light))] font-medium border border-[hsl(var(--gold)/0.15)]'
                      : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <div className="relative shrink-0">
                    <item.icon className={cn('w-[18px] h-[18px]', isActive(item.href) && 'text-[hsl(var(--gold-light))]')} />
                    {showBadge && collapsed && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[hsl(var(--gold))] ring-2 ring-card" />
                    )}
                  </div>
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1">{item.name}</span>
                      {showBadge && (
                        <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[hsl(var(--gold))] text-background text-[10px] font-semibold">
                          {unreadMessages > 9 ? '9+' : unreadMessages}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className={cn('border-t border-border/40 p-3 space-y-2', collapsed && 'px-2')}>
          <Link
            to="/owner/account"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200',
              isActive('/owner/account')
                ? 'bg-[hsl(var(--gold)/0.12)] text-[hsl(var(--gold-light))] font-medium'
                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
              collapsed && 'justify-center px-2'
            )}
          >
            <User className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>Min konto</span>}
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className={cn(
              'w-full text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-xl',
              collapsed ? 'justify-center px-2' : 'justify-start'
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="ml-2">Log ud</span>}
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40">
          <div className="flex items-center justify-between h-14 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 hover:bg-muted rounded-lg">
                <Menu className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/owner/account" className="flex items-center gap-2 pl-2">
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--gold)/0.15)] border border-[hsl(var(--gold)/0.2)] flex items-center justify-center text-xs font-semibold text-[hsl(var(--gold-light))]">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              </Link>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          {children}
        </div>

        <OwnerBottomNav />
      </main>
    </div>
  );
}
