import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, CreditCard, Building, TrendingUp, CalendarDays, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

export default function OwnerPayouts() {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [bank, setBank] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [pRes, bRes] = await Promise.all([
      supabase.from('payouts').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
      supabase.from('owner_bank_settings').select('*').eq('owner_id', user.id).maybeSingle(),
    ]);
    setPayouts(pRes.data || []);
    setBank(bRes.data);
    setLoading(false);
  };

  const completed = payouts.filter(p => p.status === 'completed');
  const pending = payouts.filter(p => p.status === 'pending');
  const totalPaid = completed.reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = pending.reduce((s, p) => s + Number(p.amount), 0);

  const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
    pending: { label: 'Afventer', icon: Clock, className: 'bg-amber-400/15 text-amber-400 border-amber-400/20' },
    processing: { label: 'Behandles', icon: TrendingUp, className: 'bg-blue-400/15 text-blue-400 border-blue-400/20' },
    completed: { label: 'Udbetalt', icon: CheckCircle2, className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
    failed: { label: 'Fejlet', icon: AlertCircle, className: 'bg-destructive/15 text-destructive border-destructive/20' },
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Udbetalinger</h1>
          <p className="text-sm text-muted-foreground mt-1">Overblik over dine udbetalinger og betalingsoplysninger</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="w-9 h-9 rounded-lg bg-emerald-400/10 flex items-center justify-center mb-3">
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xs text-muted-foreground mb-0.5">Total udbetalt</div>
              <div className="font-display text-xl font-bold text-foreground">
                {loading ? '—' : `${totalPaid.toLocaleString('da-DK')} kr`}
              </div>
            </CardContent>
          </Card>
          <Card className="border-accent/20">
            <CardContent className="p-4">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                <Building className="w-4 h-4 text-accent" />
              </div>
              <div className="text-xs text-muted-foreground mb-0.5">Afventer udbetaling</div>
              <div className="font-display text-xl font-bold text-accent">
                {loading ? '—' : `${totalPending.toLocaleString('da-DK')} kr`}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-3">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-xs text-muted-foreground mb-0.5">Betalingsmetode</div>
              {bank ? (
                <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {bank.bank_name || 'Bank'} ····{bank.account_number?.slice(-4) || ''}
                </div>
              ) : (
                <Link to="/owner/settings">
                  <Button variant="outline" size="sm" className="text-xs mt-1">Tilføj bankkonto</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending payouts highlight */}
        {pending.length > 0 && (
          <Card className="border-accent/20 bg-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                Kommende udbetalinger
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pending.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-background/80">
                  <div>
                    <div className="text-sm font-medium text-foreground">{p.description || 'Udbetaling'}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.payout_date ? `Forventet ${format(new Date(p.payout_date), 'd. MMM yyyy', { locale: da })}` : 'Dato afventes'}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-accent">{Number(p.amount).toLocaleString('da-DK')} kr</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Payout history */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Udbetalingshistorik</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground text-center py-8">Indlæser...</div>
            ) : payouts.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Ingen udbetalinger endnu</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Udbetalinger foretages 5 hverdage efter gæstens afrejse</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {payouts.map(p => {
                  const status = statusConfig[p.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  return (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-muted flex flex-col items-center justify-center shrink-0">
                          <CalendarDays className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{p.description || 'Udbetaling'}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(p.created_at), 'd. MMM yyyy', { locale: da })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant="outline" className={`text-[10px] ${status.className}`}>
                          {status.label}
                        </Badge>
                        <span className="text-sm font-semibold text-foreground min-w-[80px] text-right">
                          {Number(p.amount).toLocaleString('da-DK')} {p.currency}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment info */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Building className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">Udbetalingsrytme</div>
                <div className="text-xs text-muted-foreground">
                  Udbetalinger foretages automatisk 5 hverdage efter gæstens afrejse til din registrerede bankkonto.
                </div>
              </div>
              <Link to="/owner/settings">
                <Button variant="outline" size="sm" className="text-xs shrink-0">
                  {bank ? 'Se bankoplysninger' : 'Tilføj bankkonto'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
