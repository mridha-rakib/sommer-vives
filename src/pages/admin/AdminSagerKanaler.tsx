import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Radio, Globe, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export default function AdminSagerKanaler() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('listings')
      .select('id, name, region, hero_image, channel_airbnb_ready, channel_booking_ready, channel_vrbo_ready, sync_status, internal_status, is_active')
      .order('name')
      .then(({ data }) => { setListings(data || []); setLoading(false); });
  }, []);

  const channelBadge = (ready: boolean | null, label: string) => (
    <Badge className={`text-[10px] border-0 ${ready ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
      {ready ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  );

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kanalstatus</h1>
          <p className="text-sm text-muted-foreground">Oversigt over distribution og kanal-klargøring</p>
        </div>
        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : (
          <div className="space-y-2">
            {listings.map(l => (
              <Card key={l.id} className="hover:bg-muted/20 transition-colors">
                <CardContent className="py-3 px-4 flex items-center gap-4">
                  {l.hero_image ? (
                    <img src={l.hero_image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.region || 'Ukendt region'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {channelBadge(l.channel_airbnb_ready, 'Airbnb')}
                    {channelBadge(l.channel_booking_ready, 'Booking')}
                    {channelBadge(l.channel_vrbo_ready, 'Vrbo')}
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{l.sync_status || 'Ikke tilkoblet'}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
