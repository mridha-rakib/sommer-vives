import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Home, Plus, MessageSquare, Wallet, Building, TrendingUp } from 'lucide-react';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    properties: 0,
    inquiries: 0,
    totalPayouts: 0,
    publishedProperties: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    // Get properties count
    const { data: props } = await supabase
      .from('properties')
      .select('id, status')
      .eq('owner_id', user.id);

    const propertyCount = props?.length || 0;
    const publishedCount = props?.filter(p => p.status === 'published').length || 0;
    const propertyIds = props?.map(p => p.id) || [];

    // Get inquiries count
    let inquiryCount = 0;
    if (propertyIds.length > 0) {
      const { count } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .in('property_id', propertyIds);
      inquiryCount = count || 0;
    }

    // Get payouts total
    const { data: payouts } = await supabase
      .from('payouts')
      .select('amount')
      .eq('owner_id', user.id)
      .eq('status', 'completed');

    const totalPayouts = payouts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    setStats({
      properties: propertyCount,
      inquiries: inquiryCount,
      totalPayouts,
      publishedProperties: publishedCount,
    });
    setLoading(false);
  };

  return (
    <OwnerLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-primary">Velkommen tilbage!</h1>
        <p className="text-muted-foreground">{user?.email}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Building className="w-5 h-5 text-accent" />
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
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-muted-foreground text-sm mb-1">Publiceret</div>
          <div className="font-display text-3xl font-bold text-primary">
            {loading ? '...' : stats.publishedProperties}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-muted-foreground text-sm mb-1">Forespørgsler</div>
          <div className="font-display text-3xl font-bold text-primary">
            {loading ? '...' : stats.inquiries}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-accent" />
            </div>
          </div>
          <div className="text-muted-foreground text-sm mb-1">Total indtjening</div>
          <div className="font-display text-3xl font-bold text-accent">
            {loading ? '...' : `${stats.totalPayouts.toLocaleString('da-DK')} kr`}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-8">
          <h2 className="font-display text-xl font-semibold text-primary mb-2">Tilføj sommerhus</h2>
          <p className="text-muted-foreground mb-4">Opret et nyt sommerhus og begynd at udleje.</p>
          <Link to="/owner/properties/new">
            <Button variant="gold">
              <Plus className="w-4 h-4 mr-2" />
              Opret sommerhus
            </Button>
          </Link>
        </div>

        <div className="bg-card rounded-xl border border-border p-8">
          <h2 className="font-display text-xl font-semibold text-primary mb-2">Se forespørgsler</h2>
          <p className="text-muted-foreground mb-4">Gennemgå og besvar henvendelser fra lejere.</p>
          <Link to="/owner/inquiries">
            <Button variant="outline">
              <MessageSquare className="w-4 h-4 mr-2" />
              Se forespørgsler
            </Button>
          </Link>
        </div>
      </div>
    </OwnerLayout>
  );
}
