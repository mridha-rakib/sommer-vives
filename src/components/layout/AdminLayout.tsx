import { ReactNode, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Settings, LogOut, Menu, X, Shield, Calendar,
  MessageSquare, ListChecks, Target, Users, Inbox, FolderOpen,
  FileText, Wallet, ChevronDown, ChevronRight,
  UserCheck, User, Archive, CalendarDays, ShoppingBag, Radio
} from 'lucide-react';
import { GlobalSearch } from '@/components/admin/GlobalSearch';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: { name: string; href: string; icon: React.ElementType }[];
}

const navItems: NavItem[] = [
  { name: 'Overblik', href: '/admin', icon: LayoutDashboard },
  { name: 'Beskeder', href: '/admin/beskeder', icon: MessageSquare },
  { name: 'Kalender', href: '/admin/kalender', icon: Calendar },
  { name: 'Opgaver', href: '/admin/opgaver', icon: ListChecks },
  { name: 'Leads', href: '/admin/leads', icon: Target },
  {
    name: 'CRM', href: '/admin/crm', icon: Users,
    children: [
      { name: 'Udlejere', href: '/admin/crm/udlejere', icon: UserCheck },
      { name: 'Gæster', href: '/admin/crm/gaester', icon: User },
      { name: 'Arkiv', href: '/admin/crm/arkiv', icon: Archive },
    ],
  },
  { name: 'Modtagelsescenter', href: '/admin/modtagelse', icon: Inbox },
  {
    name: 'Sager', href: '/admin/sager', icon: FolderOpen,
    children: [
      { name: 'Alle sager', href: '/admin/sager', icon: FolderOpen },
      { name: 'Sager kalender', href: '/admin/sager/kalender', icon: CalendarDays },
      { name: 'Tilkøb', href: '/admin/sager/tilkoeb', icon: ShoppingBag },
      { name: 'Kanalstatus', href: '/admin/sager/kanaler', icon: Radio },
    ],
  },
  { name: 'Dokumenter', href: '/admin/dokumenter', icon: FileText },
  { name: 'Økonomi', href: '/admin/oekonomi', icon: Wallet },
  { name: 'Indstillinger', href: '/admin/indstillinger', icon: Settings },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin';
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const isGroupActive = (item: NavItem) => {
    if (isActive(item.href)) return true;
    return item.children?.some(c => isActive(c.href)) ?? false;
  };

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const isExpanded = (item: NavItem) => {
    return expandedGroups[item.name] ?? isGroupActive(item);
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
        'fixed md:static inset-y-0 left-0 z-50 w-60 bg-card border-r border-border transition-transform flex flex-col',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-border">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="font-display text-sm font-bold block leading-tight text-foreground">SommerVibes</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Operations</span>
            </div>
          </Link>
          <button className="md:hidden text-muted-foreground p-1" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const hasChildren = item.children && item.children.length > 0;
            const active = isActive(item.href);
            const groupActive = isGroupActive(item);
            const expanded = hasChildren && isExpanded(item);

            return (
              <div key={item.name}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleGroup(item.name)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all',
                      groupActive
                        ? 'bg-primary/8 text-foreground font-semibold'
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    )}
                  >
                    <item.icon className={cn('w-4 h-4 shrink-0', groupActive ? 'text-primary' : '')} />
                    <span className="flex-1 text-left">{item.name}</span>
                    {expanded
                      ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    }
                  </button>
                ) : (
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all',
                      active
                        ? 'bg-primary/10 text-foreground font-semibold'
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    )}
                  >
                    <item.icon className={cn('w-4 h-4 shrink-0', active ? 'text-primary' : '')} />
                    <span>{item.name}</span>
                  </Link>
                )}

                {/* Sub-items */}
                {hasChildren && expanded && (
                  <div className="ml-4 pl-3 border-l border-border/50 mt-0.5 space-y-0.5">
                    {item.children!.map(child => {
                      const childActive = isActive(child.href);
                      return (
                        <Link
                          key={child.href}
                          to={child.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[12px] transition-all',
                            childActive
                              ? 'bg-primary/10 text-foreground font-medium'
                              : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
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
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-border">
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
