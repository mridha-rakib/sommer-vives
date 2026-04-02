import { ReactNode, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard, Settings, Users, Wallet, LogOut, Menu, X, Shield, Calendar,
  UserCheck, Activity, MessageCircle, Mail, List, Wrench, FileText, Bell,
  LifeBuoy, ClipboardList, ChevronDown, ChevronRight,
  Target, Building, BookOpen, Key, Sparkles, CreditCard, ShoppingBag,
  Handshake, Globe, Zap, Eye, FileSignature
} from 'lucide-react';
import { GlobalSearch } from '@/components/admin/GlobalSearch';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavSection {
  label: string;
  items: { name: string; href: string; icon: any; badge?: string }[];
}

const navSections: NavSection[] = [
  {
    label: 'Overblik',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { name: 'Leads', href: '/admin/leads', icon: Target },
      { name: 'Pipeline', href: '/admin/pipeline', icon: Eye },
      { name: 'Aktivitetslog', href: '/admin/audit-log', icon: Activity },
    ],
  },
  {
    label: 'Ejere & Ejendomme',
    items: [
      { name: 'Ejere', href: '/admin/owners', icon: UserCheck },
      { name: 'Boliger', href: '/admin/properties-mgmt', icon: Building },
      { name: 'Aftaler', href: '/admin/agreements', icon: FileSignature },
      { name: 'Aftaleskabeloner', href: '/admin/templates', icon: FileSignature },
      { name: 'Nøglebokse', href: '/admin/keyboxes', icon: Key },
    ],
  },
  {
    label: 'Listings & Indhold',
    items: [
      { name: 'Listings', href: '/admin/listings', icon: List },
      { name: 'Priser & Sæsoner', href: '/admin/pricing', icon: Wallet },
      { name: 'Kalender', href: '/admin/calendar', icon: Calendar },
      { name: 'Stay-indhold', href: '/admin/stay-content', icon: BookOpen },
      { name: 'Tilkøb', href: '/admin/addons', icon: ShoppingBag },
    ],
  },
  {
    label: 'Bookinger & Gæster',
    items: [
      { name: 'Bookinger', href: '/admin/bookings', icon: Calendar },
      { name: 'Gæster', href: '/admin/guests', icon: Users },
      { name: 'Opgaver', href: '/admin/tasks', icon: ClipboardList },
    ],
  },
  {
    label: 'Drift & Service',
    items: [
      { name: 'Rengøring', href: '/admin/cleaning', icon: Sparkles },
      { name: 'Vedligeholdelse', href: '/admin/maintenance', icon: Wrench },
      { name: 'Servicepartnere', href: '/admin/service-partners', icon: Handshake },
      { name: 'Support-sager', href: '/admin/support', icon: LifeBuoy },
    ],
  },
  {
    label: 'Økonomi',
    items: [
      { name: 'Betalinger', href: '/admin/payments', icon: CreditCard },
      { name: 'Udbetalinger', href: '/admin/payouts', icon: Wallet },
      { name: 'Dokumenter', href: '/admin/documents', icon: FileText },
    ],
  },
  {
    label: 'Kommunikation',
    items: [
      { name: 'Beskeder', href: '/admin/chat', icon: MessageCircle },
      { name: 'Emails', href: '/admin/emails', icon: Mail },
      { name: 'Notifikationer', href: '/admin/notifications', icon: Bell },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'CMS / Webindhold', href: '/admin/cms', icon: Globe },
      { name: 'Automations', href: '/admin/automations', icon: Zap },
      { name: 'Optimeringer', href: '/admin/optimizations', icon: Sparkles },
      { name: 'Indstillinger', href: '/admin/settings', icon: Settings },
    ],
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(href);
  };

  const toggleSection = (label: string) => {
    setCollapsedSections(prev =>
      prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]
    );
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
        'fixed md:static inset-y-0 left-0 z-50 w-64 bg-secondary text-foreground transition-transform flex flex-col',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="font-display text-sm font-bold block leading-tight">Admin Portal</span>
                <span className="text-[10px] text-muted-foreground">SommerVibes</span>
              </div>
            </div>
            <button className="md:hidden text-foreground p-1" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 space-y-0.5">
            {navSections.map(section => {
              const isCollapsed = collapsedSections.includes(section.label);
              return (
                <div key={section.label}>
                  <button
                    onClick={() => toggleSection(section.label)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {section.label}
                    {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-0.5 mb-2">
                      {section.items.map(item => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all',
                            isActive(item.href)
                              ? 'bg-primary/15 text-foreground font-medium'
                              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                          )}
                        >
                          <item.icon className={cn('w-4 h-4', isActive(item.href) && 'text-primary')} />
                          <span className="flex-1">{item.name}</span>
                          {item.badge && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary bg-primary/10">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground truncate">{user?.email}</div>
              <div className="text-[10px] text-muted-foreground">Administrator</div>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground hover:bg-muted/50 p-1.5 h-auto">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-card border-b border-border sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 md:px-6 h-12">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 hover:bg-muted rounded-lg">
                <Menu className="w-5 h-5 text-muted-foreground" />
              </button>
              <div className="hidden md:block">
                <GlobalSearch />
              </div>
            </div>
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Website</Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
