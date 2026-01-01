import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Building, Users, MessageSquare, TrendingUp, Globe } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    owners: 0,
    properties: 0,
    publishedListings: 0,
    inquiries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // Count owners
    const { count: ownerCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'owner');

    // Count properties
    const { count: propCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });

    // Count published
    const { count: publishedCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    // Count inquiries
    const { count: inquiryCount } = await supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true });

    setStats({
      owners: ownerCount || 0,
      properties: propCount || 0,
      publishedListings: publishedCount || 0,
      inquiries: inquiryCount || 0,
    });
    setLoading(false);
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-primary">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overblik over platformen</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-accent" />
            </div>
          </div>
          <div className="text-muted-foreground text-sm mb-1">Ejere</div>
          <div className="font-display text-3xl font-bold text-primary">
            {loading ? '...' : stats.owners}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-muted-foreground text-sm mb-1">Sommerhuse</div>
          <div className="font-display text-3xl font-bold text-primary">
            {loading ? '...' : stats.properties}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Globe className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-muted-foreground text-sm mb-1">Aktive annoncer</div>
          <div className="font-display text-3xl font-bold text-accent">
            {loading ? '...' : stats.publishedListings}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="text-muted-foreground text-sm mb-1">Forespørgsler</div>
          <div className="font-display text-3xl font-bold text-primary">
            {loading ? '...' : stats.inquiries}
          </div>
        </div>
      </div>

      {/* Recent Activity placeholder */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="font-display text-xl font-semibold text-primary">Seneste aktivitet</h2>
        </div>
        <div className="p-12 text-center text-muted-foreground">
          Aktivitetslog kommer snart...
        </div>
      </div>
    </AdminLayout>
  );
}
