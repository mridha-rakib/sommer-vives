import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format, parseISO, startOfMonth } from 'date-fns';
import { da } from 'date-fns/locale';

interface EarningsChartProps {
  bookings: Array<{
    check_in: string;
    owner_payout: number | null;
    total_amount: number;
    status: string | null;
  }>;
}

export function EarningsChart({ bookings }: EarningsChartProps) {
  const chartData = useMemo(() => {
    const months: Record<string, { gross: number; net: number }> = {};

    bookings
      .filter(b => b.status !== 'cancelled')
      .forEach(b => {
        const key = format(startOfMonth(parseISO(b.check_in)), 'yyyy-MM');
        if (!months[key]) months[key] = { gross: 0, net: 0 };
        months[key].gross += Number(b.total_amount || 0);
        months[key].net += Number(b.owner_payout || 0);
      });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({
        month: format(parseISO(key + '-01'), 'MMM yy', { locale: da }),
        gross: Math.round(val.gross),
        net: Math.round(val.net),
      }));
  }, [bookings]);

  if (chartData.length < 2) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          <CardTitle className="text-base">Indtjening over tid</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-3">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [
                `${value.toLocaleString('da-DK')} kr`,
                name === 'net' ? 'Din andel' : 'Brutto',
              ]}
            />
            <Area type="monotone" dataKey="net" stroke="hsl(var(--accent))" fill="url(#colorNet)" strokeWidth={2} />
            <Area type="monotone" dataKey="gross" stroke="hsl(var(--muted-foreground))" fill="none" strokeWidth={1} strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
