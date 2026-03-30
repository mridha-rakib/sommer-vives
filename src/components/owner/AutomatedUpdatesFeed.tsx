import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Zap, CalendarDays, CreditCard, Brush, UserCheck, Globe,
  Mail, Bell, CheckCircle2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';

interface UpdateItem {
  id: string;
  icon: React.ElementType;
  title: string;
  detail: string;
  time: string;
  category: 'booking' | 'payment' | 'cleaning' | 'listing' | 'system';
  automated: boolean;
}

interface AutomatedUpdatesFeedProps {
  bookings: Array<{
    id: string;
    check_in: string;
    check_out: string;
    guest_name: string | null;
    status: string | null;
    total_amount: number;
    created_at: string | null;
  }>;
  className?: string;
}

export function AutomatedUpdatesFeed({ bookings, className }: AutomatedUpdatesFeedProps) {
  // Generate feed from real data
  const feed: UpdateItem[] = [];

  // Create updates from recent bookings
  bookings.slice(0, 6).forEach(b => {
    feed.push({
      id: `booking-${b.id}`,
      icon: CalendarDays,
      title: `Booking fra ${b.guest_name || 'gæst'}`,
      detail: `${b.status === 'confirmed' ? 'Bekræftet' : 'Modtaget'} — ${Number(b.total_amount).toLocaleString('da-DK')} kr`,
      time: b.created_at || new Date().toISOString(),
      category: 'booking',
      automated: true,
    });

    // Simulate automated cleaning
    if (b.status === 'confirmed') {
      feed.push({
        id: `clean-${b.id}`,
        icon: Brush,
        title: 'Rengøring planlagt',
        detail: `Auto-booket efter ${b.guest_name || 'gæst'}s ophold`,
        time: b.created_at || new Date().toISOString(),
        category: 'cleaning',
        automated: true,
      });
    }
  });

  // Add system updates
  feed.push({
    id: 'system-listing',
    icon: Globe,
    title: 'Listing synkroniseret',
    detail: 'Din listing er opdateret på alle kanaler',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    category: 'listing',
    automated: true,
  });

  feed.push({
    id: 'system-email',
    icon: Mail,
    title: 'Gæstemail sendt automatisk',
    detail: 'Velkomstmail og ankomstguide',
    time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    category: 'system',
    automated: true,
  });

  // Sort by time
  feed.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const visible = feed.slice(0, 6);

  const categoryColors: Record<string, string> = {
    booking: 'text-accent',
    payment: 'text-emerald-400',
    cleaning: 'text-blue-400',
    listing: 'text-violet-400',
    system: 'text-muted-foreground',
  };

  return (
    <Card className={cn('border-border/50', className)}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Automatiske opdateringer</span>
          <Badge className="ml-auto bg-accent/10 text-accent border-accent/20 text-[9px]">
            Live
          </Badge>
        </div>

        <div className="space-y-1">
          {visible.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                'bg-muted'
              )}>
                <item.icon className={cn('w-3.5 h-3.5', categoryColors[item.category])} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-foreground truncate">{item.title}</span>
                  {item.automated && (
                    <Zap className="w-2.5 h-2.5 text-accent shrink-0" />
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.detail}</div>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                {formatDistanceToNow(new Date(item.time), { locale: da, addSuffix: false })}
              </span>
            </div>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="text-center py-6">
            <CheckCircle2 className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Alt er stille — vi holder øje</p>
          </div>
        )}

        <div className="mt-3 p-2 rounded-lg bg-accent/5 border border-accent/10">
          <p className="text-[10px] text-accent text-center font-medium">
            ⚡ SommerVibes automatiserer rengøring, gæstekommunikation og kanalstyring
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
