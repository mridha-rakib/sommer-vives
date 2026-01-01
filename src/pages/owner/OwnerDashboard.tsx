import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Home, Plus, MessageSquare, Wallet, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

export default function OwnerDashboard() {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-primary text-primary-foreground transition-transform`}>
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <Home className="h-6 w-6 text-accent" />
            <span className="font-display text-xl font-semibold">
              Sommerhus<span className="text-accent">Bureau</span>
            </span>
          </Link>

          <nav className="space-y-2">
            <Link to="/owner" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
              <Home className="w-5 h-5" /> Overblik
            </Link>
            <Link to="/owner/properties" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
              <Plus className="w-5 h-5" /> Mine sommerhuse
            </Link>
            <Link to="/owner/inquiries" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
              <MessageSquare className="w-5 h-5" /> Forespørgsler
            </Link>
            <Link to="/owner/payouts" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
              <Wallet className="w-5 h-5" /> Udbetalinger
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
          <h1 className="font-display text-3xl font-bold text-primary">Velkommen tilbage!</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="text-muted-foreground text-sm mb-1">Sommerhuse</div>
            <div className="font-display text-3xl font-bold text-primary">0</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="text-muted-foreground text-sm mb-1">Aktive forespørgsler</div>
            <div className="font-display text-3xl font-bold text-primary">0</div>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="text-muted-foreground text-sm mb-1">Udbetalinger i alt</div>
            <div className="font-display text-3xl font-bold text-accent">0 kr</div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <h2 className="font-display text-xl font-semibold text-primary mb-2">Kom i gang</h2>
          <p className="text-muted-foreground mb-4">Opret dit første sommerhus for at begynde udlejningen.</p>
          <Link to="/owner/properties/new">
            <Button variant="gold">
              <Plus className="w-4 h-4 mr-2" /> Opret sommerhus
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
