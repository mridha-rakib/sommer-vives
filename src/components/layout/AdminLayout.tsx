import { ReactNode, useState, useEffect } from 'react';
import emilAvatar from '@/assets/emil-klockmann.jpg';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Settings, LogOut, Menu, X, Calendar,
  MessageSquare, ListChecks, Target, Users, FolderOpen, Inbox,
  FileText, Wallet, ChevronDown, ChevronLeft,
  UserCheck, User, ExternalLink, Bell, BellOff
} from 'lucide-react';
import { QuickCreateButtons } from '@/components/admin/QuickCreateButtons';
import { GlobalSearch } from '@/components/admin/GlobalSearch';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useChatNotifications } from '@/lib/chatNotifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminLayoutProps { children: ReactNode; }

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  children?: { name: string; href: string; icon: React.ElementType }[];
}

const navSections: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      { name: 'Overblik', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Daglig drift',
    items: [
      { name: 'Kalender', href: '/admin/kalender', icon: Calendar },
      { name: 'Alle opgaver', href: '/admin/opgaver', icon: ListChecks },
      { name: 'Beskeder', href: '/admin/beskeder', icon: MessageSquare },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      { name: 'Leads', href: '/admin/leads', icon: Target },
      { name: 'Sager', href: '/admin/sager', icon: FolderOpen },
      {
        name: 'CRM', href: '/admin/crm', icon: Users,
        children: [
          { name: 'Udlejere', href: '/admin/crm/udlejere', icon: UserCheck },
          { name: 'Gæster', href: '/admin/crm/gaester', icon: User },
        ],
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      { name: 'Modtagelse', href: '/admin/modtagelse', icon: Inbox },
      { name: 'Dokumenter', href: '/admin/dokumenter', icon: FileText },
      { name: 'Økonomi', href: '/admin/oekonomi', icon: Wallet },
      { name: 'Team', href: '/admin/team', icon: Users },
    ],
  },
  {
    items: [
      { name: 'Indstillinger', href: '/admin/indstillinger', icon: Settings },
    ],
  },
];

const allItems = navSections.flatMap(s => s.items);

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('admin-sidebar-collapsed') === 'true');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const unreadMessages = useUnreadMessages();
  const { notify, muted, setMuted } = useChatNotifications();

  // Global admin chat notification listener: ping + toast on any new
  // owner/guest support message, regardless of which admin page we are on.
  useEffect(() => {
    const channel = supabase
      .channel('admin-global-chat-notify')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const m = payload.new as any;
          if (m.thread_type !== 'support') return;
          if (m.sender_type === 'admin') return;
          const onBeskederPage = location.pathname.startsWith('/admin/beskeder');
          notify({
            fromRole: m.sender_type === 'owner' ? 'owner' : 'guest',
            fromName: m.sender_name,
            body: m.message,
            url: '/admin/beskeder',
            alwaysPlay: !onBeskederPage,
          });
          if (!onBeskederPage) {
            toast.message(
              m.sender_type === 'owner' ? 'Ny besked fra ejer' : 'Ny besked fra gæst',
              {
                description: (m.sender_name ? `${m.sender_name}: ` : '') +
                  (m.message.length > 80 ? m.message.slice(0, 80) + '…' : m.message),
                action: { label: 'Åbn', onClick: () => { window.location.href = '/admin/beskeder'; } },
                duration: 5000,
              }
            );
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [location.pathname, notify]);

  // Inject live badges onto specific nav items
  const sectionsWithBadges = navSections.map(section => ({
    ...section,
    items: section.items.map(it =>
      it.href === '/admin/beskeder' ? { ...it, badge: unreadMessages } : it
    ),
  }));

  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin';
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const isGroupActive = (item: NavItem) => {
    if (isActive(item.href)) return true;
    return item.children?.some(c => isActive(c.href)) ?? false;
  };

  const toggleGroup = (name: string) =>
    setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));

  const isExpanded = (item: NavItem) =>
    expandedGroups[item.name] ?? isGroupActive(item);

  // Find current page title
  const findCurrent = (): string => {
    for (const item of allItems) {
      if (item.children) {
        const child = item.children.find(c => isActive(c.href));
        if (child) return child.name;
      }
      if (isActive(item.href)) return item.name;
    }
    return 'Admin';
  };

  const renderNavItem = (item: NavItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const active = isActive(item.href);
    const groupActive = isGroupActive(item);
    const expanded = hasChildren && isExpanded(item);

    if (collapsed) {
      // Collapsed: icon-only with tooltip
      if (hasChildren) {
        // Show first child link or parent
        const firstChild = item.children?.[0];
        const target = firstChild || item;
        const targetActive = firstChild ? isActive(firstChild.href) : active;
        return (
          <div key={item.name}>
            <Link
              to={target.href}
              onClick={() => setSidebarOpen(false)}
              title={item.name}
              className={cn(
                'flex items-center justify-center w-9 h-9 mx-auto rounded-xl transition-all duration-200',
                (groupActive || targetActive)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
              )}
            >
              <item.icon className="w-4 h-4" />
            </Link>
          </div>
        );
      }
      return (
        <div key={item.name}>
          <Link
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            title={item.badge && item.badge > 0 ? `${item.name} (${item.badge} ulæste)` : item.name}
            className={cn(
              'relative flex items-center justify-center w-9 h-9 mx-auto rounded-xl transition-all duration-200',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.badge && item.badge > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 text-[9px] font-bold bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-sm">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </Link>
        </div>
      );
    }

    return (
      <div key={item.name}>
        {hasChildren ? (
          <button
            onClick={() => toggleGroup(item.name)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all duration-200',
              groupActive
                ? 'bg-primary/8 text-foreground'
                : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
            )}
          >
            <item.icon className={cn('w-4 h-4 shrink-0 transition-colors', groupActive ? 'text-primary' : '')} />
            <span className="flex-1 text-left font-medium">{item.name}</span>
            <ChevronDown className={cn(
              'w-3.5 h-3.5 text-muted-foreground transition-transform duration-200',
              expanded ? '' : '-rotate-90'
            )} />
          </button>
        ) : (
          <Link
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all duration-200',
              active
                ? 'bg-primary/10 text-foreground font-semibold shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.15)]'
                : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
            )}
          >
            <item.icon className={cn('w-4 h-4 shrink-0 transition-colors', active ? 'text-primary' : '')} />
            <span className="font-medium">{item.name}</span>
            {item.badge && item.badge > 0 && (
              <span className="ml-auto text-[10px] font-bold bg-primary text-primary-foreground rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </Link>
        )}

        {hasChildren && expanded && (
          <div className="ml-[26px] pl-3 border-l border-border/40 mt-1 mb-1 space-y-0.5">
            {item.children!.map(child => {
              const childActive = isActive(child.href);
              return (
                <Link
                  key={child.href}
                  to={child.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-all duration-200',
                    childActive
                      ? 'bg-primary/10 text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'
                  )}
                >
                  <child.icon className={cn('w-3.5 h-3.5 shrink-0', childActive ? 'text-primary' : '')} />
                  <span>{child.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/70 backdrop-blur-md z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed md:static inset-y-0 left-0 z-50 bg-card/50 backdrop-blur-xl border-r border-border/50 transition-all duration-300 flex flex-col',
        collapsed ? 'w-[60px]' : 'w-[260px]',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        {/* Logo header */}
        <div className="h-14 px-3 flex items-center justify-between border-b border-border/30">
          {!collapsed && <BrandLogo to="/admin" tagline="Operations" />}
          {collapsed && (
            <Link to="/admin" className="mx-auto">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-primary" />
              </div>
            </Link>
          )}
          <button className="md:hidden text-muted-foreground hover:text-foreground p-1 rounded-lg" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 px-2 py-4 space-y-5 overflow-y-auto scrollbar-hide">
          {sectionsWithBadges.map((section, idx) => (
            <div key={idx}>
              {section.label && !collapsed && (
                <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em]">
                  {section.label}
                </p>
              )}
              {section.label && collapsed && (
                <div className="mx-auto w-6 border-t border-border/30 mb-2" />
              )}
              <div className="space-y-0.5">
                {section.items.map(renderNavItem)}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden md:flex justify-center py-2 border-t border-border/30">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
            title={collapsed ? 'Udvid menu' : 'Minimer menu'}
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform duration-300', collapsed && 'rotate-180')} />
          </button>
        </div>

        {/* User */}
        <div className={cn('p-3 border-t border-border/30', collapsed && 'px-2')}>
          <div className="flex items-center gap-3">
            <img src={emilAvatar} alt="Emil W. Klockmann" className={cn(
              'rounded-full object-cover border-2 border-primary/30 shadow-lg shadow-primary/10 shrink-0',
              collapsed ? 'w-8 h-8' : 'w-11 h-11'
            )} />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground leading-tight">Emil W. Klockmann</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">Udlejningschef</p>
              </div>
            )}
            {!collapsed && (
              <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground p-1.5 h-auto rounded-lg shrink-0">
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="h-14 bg-card/30 backdrop-blur-xl border-b border-border/30 sticky top-0 z-30 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 hover:bg-muted/30 rounded-xl transition-colors">
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
            <h2 className="text-sm font-semibold text-foreground hidden sm:block">{findCurrent()}</h2>
          </div>

          <div className="flex items-center gap-2">
            <QuickCreateButtons />
            <div className="hidden md:block">
              <GlobalSearch />
            </div>
            <button
              onClick={() => setMuted(!muted)}
              title={muted ? 'Slå besked-lyd til' : 'Slå besked-lyd fra'}
              className="w-9 h-9 rounded-xl hover:bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {muted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </button>
            <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-9 rounded-xl">
              <Link to="/"><ExternalLink className="w-3 h-3" />Website</Link>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
