import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MessageCircle, Phone, AlertTriangle, HelpCircle, Crown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { createOwnerSupportTicket, type OwnerSupportAction } from '@/lib/owner-support-api';
import { useTranslation } from '@/lib/i18n';

export default function OwnerSupport() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [submittingAction, setSubmittingAction] = useState<OwnerSupportAction | null>(null);
  const faqItems = [
    { q: t('owner.support.faq.payout.q'), a: t('owner.support.faq.payout.a') },
    { q: t('owner.support.faq.prices.q'), a: t('owner.support.faq.prices.a') },
    { q: t('owner.support.faq.damage.q'), a: t('owner.support.faq.damage.a') },
    { q: t('owner.support.faq.block.q'), a: t('owner.support.faq.block.a') },
  ];

  const handleAction = async (action: OwnerSupportAction) => {
    if (!user) return;
    setSubmittingAction(action);
    try {
      await createOwnerSupportTicket({ ownerId: user.id, ownerEmail: user.email, action });
      toast.success(action === 'call' ? t('owner.support.toast.callBooked') : t('owner.support.toast.urgentSent'));
    } catch (err: any) {
      toast.error(err.message || t('owner.support.toast.error'));
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <OwnerLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--gold)/0.1)] flex items-center justify-center mx-auto mb-4">
            <Crown className="w-6 h-6 text-[hsl(var(--gold-light))]" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('owner.support.title')}</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            {t('owner.support.subtitle')}
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid gap-3">
          <Link to="/owner/messages">
            <Card className="group hover:border-[hsl(var(--gold)/0.3)] transition-all cursor-pointer border-[hsl(var(--gold)/0.15)] bg-gradient-to-r from-[hsl(var(--gold)/0.05)] to-transparent">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-[hsl(var(--gold)/0.12)] flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-[hsl(var(--gold-light))]" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">{t('owner.support.messageTeam')}</div>
                  <p className="text-xs text-muted-foreground">{t('owner.support.messageTeamDesc')}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-[hsl(var(--gold-light))] transition-colors" />
              </CardContent>
            </Card>
          </Link>

          <Card className="hover:border-[hsl(var(--gold)/0.2)] transition-all cursor-pointer" onClick={() => handleAction('call')}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">{t('owner.support.bookCall')}</div>
                <p className="text-xs text-muted-foreground">{submittingAction === 'call' ? t('owner.support.sending') : t('owner.support.bookCallDesc')}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
            </CardContent>
          </Card>

          <Card className="hover:border-destructive/30 transition-all cursor-pointer" onClick={() => handleAction('urgent')}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">{t('owner.support.urgent')}</div>
                <p className="text-xs text-muted-foreground">{submittingAction === 'urgent' ? t('owner.support.sending') : t('owner.support.urgentDesc')}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-4 h-4 text-[hsl(var(--gold-light))]" />
              <span className="text-sm font-semibold text-foreground">{t('owner.support.faqTitle')}</span>
            </div>
            <div className="space-y-3">
              {faqItems.map((faq, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-muted/30">
                  <div className="text-sm font-medium text-foreground mb-1">{faq.q}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
