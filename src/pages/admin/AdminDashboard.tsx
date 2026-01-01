import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Home, Users, Building, MessageSquare, Settings, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-primary text-primary-foreground transition-transform`}>
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <Home className="h-6 w-6 text-accent" />
            <span className="font-display text-xl font-semibold">
              Sommerhus<span className="text-accent">Bureau</span>
            </span>
          </Link>
          <div className="text-xs text-accent uppercase tracking-wider mb-8">Admin</div>

          <nav className="space-y-2">
            <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
              <Home className="w-5 h-5" /> Dashboard
            </Link>
            <Link to="/admin/owners" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
              <Users className="w-5 h-5" /> Ejere
            </Link>
            <Link to="/admin/properties" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
              <Building className="w-5 h-5" /> Ejendomme
            </Link>
            <Link to="/admin/inquiries" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
              <MessageSquare className="w-5 h-5" /> Forespørgsler
            </Link>
            <Link to="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
              <Settings className="w-5 h-5" /> Indstillinger
            </Link>
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Button variant="ghost" onClick={signOut} className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-sidebar-accent/50">
            <LogOut className="w-5 h-5 mr-2" /> Log ud
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8">
        <div className="md:hidden mb-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-primary">Admin Dashboard</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="text-muted-foreground text-sm mb-1">Ejere</div>
            <div className="font-display text-3xl font-bold text-primary">0</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="text-muted-foreground text-sm mb-1">Sommerhuse</div>
            <div className="font-display text-3xl font-bold text-primary">0</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="text-muted-foreground text-sm mb-1">Aktive annoncer</div>
            <div className="font-display text-3xl font-bold text-accent">0</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="text-muted-foreground text-sm mb-1">Forespørgsler</div>
            <div className="font-display text-3xl font-bold text-primary">0</div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-8">
          <h2 className="font-display text-xl font-semibold text-primary mb-4">Seneste aktivitet</h2>
          <p className="text-muted-foreground">Ingen aktivitet endnu.</p>
        </div>
      </main>
    </div>
  );
}
