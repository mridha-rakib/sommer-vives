import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  Mail, Phone, MapPin, Target, Calendar, ChevronRight,
  PhoneCall, Send, ExternalLink, User, Home, FileText,
  Clock, StickyNote
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type ProfileType = 'lead' | 'guest' | 'owner';

interface ProfilePopoverProps {
  type: ProfileType;
  id?: string;
  /** Pre-loaded data to avoid extra fetch */
  data?: Record<string, any>;
  children: React.ReactNode;
  /** Navigate to full detail page */
  onOpenDetail?: () => void;
}

const TYPE_META: Record<ProfileType, { label: string; color: string; icon: typeof User }> = {
  lead: { label: 'Lead', color: 'bg-blue-500/10 text-blue-600', icon: Target },
  guest: { label: 'Gæst', color: 'bg-emerald-500/10 text-emerald-600', icon: User },
  owner: { label: 'Ejer', color: 'bg-amber-500/10 text-amber-600', icon: Home },
};

const LEAD_STATUS_MAP: Record<string, string> = {
  new: 'Modtaget', contacted: 'Under behandling', waiting: 'Afventer svar', won: 'Vundet', lost: 'Tabt',
};
const LEAD_SOURCE_MAP: Record<string, string> = {
  beregn_lejeindtaegt: 'Beregn lejeindtægt', udlejningstjek: 'Book udlejningstjek', vil_udleje: 'Vil udleje',
  contact: 'Kontaktformular', website: 'Hjemmeside', referral: 'Anbefaling', social: 'SoMe',
  phone: 'Telefon', partner: 'Partner', other: 'Andet',
};

export function ProfilePopover({ type, id, data: preloaded, children, onOpenDetail }: ProfilePopoverProps) {
  const [profile, setProfile] = useState<Record<string, any> | null>(preloaded || null);
  const [loading, setLoading] = useState(false);
  const [extraInfo, setExtraInfo] = useState<string | null>(null);
  const meta = TYPE_META[type];

  const fetchData = async () => {
    if (profile || !id) return;
    setLoading(true);
    try {
      let q;
      if (type === 'lead') q = supabase.from('leads').select('*').eq('id', id).single();
      else if (type === 'guest') q = supabase.from('guests').select('*').eq('id', id).single();
      else q = supabase.from('profiles').select('*').eq('id', id).single();
      const { data } = await q;
      setProfile(data);
      // Fetch extra context
      if (type === 'guest' && data) {
        const { count } = await supabase.from('bookings').select('id', { count: 'exact', head: true }).or(`guest_id.eq.${data.id},guest_email.eq.${data.email}`);
        setExtraInfo(`${count || 0} bookings`);
      } else if (type === 'owner' && data) {
        const { count } = await supabase.from('properties').select('id', { count: 'exact', head: true }).eq('owner_id', data.id);
        setExtraInfo(`${count || 0} ejendomme`);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  // If preloaded data, try to get extra info on hover
  const handleOpen = () => {
    if (preloaded && !profile) setProfile(preloaded);
    if (!profile && id) fetchData();
    else if (profile && !extraInfo) {
      // Fetch extra context for preloaded
      if (type === 'guest' && profile.email) {
        supabase.from('bookings').select('id', { count: 'exact', head: true }).or(`guest_id.eq.${profile.id},guest_email.eq.${profile.email}`).then(({ count }) => setExtraInfo(`${count || 0} bookings`));
      } else if (type === 'owner' && profile.id) {
        supabase.from('properties').select('id', { count: 'exact', head: true }).eq('owner_id', profile.id).then(({ count }) => setExtraInfo(`${count || 0} ejendomme`));
      }
    }
  };

  const name = profile?.name || profile?.full_name || '—';
  const email = profile?.email || '';
  const phone = profile?.phone || '';
  const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const Icon = meta.icon;

  return (
    <HoverCard openDelay={200} closeDelay={100} onOpenChange={open => open && handleOpen()}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-0 border-border/40 shadow-xl rounded-2xl overflow-hidden" align="start" sideOffset={8}>
        {loading || !profile ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Indlæser…</div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-start gap-3">
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0', meta.color)}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground truncate">{name}</h4>
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4 shrink-0 border-0 font-medium', meta.color)}>
                      {meta.label}
                    </Badge>
                  </div>
                  {(profile.case_number || profile.region) && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {profile.case_number && <span className="font-mono">{profile.case_number}</span>}
                      {profile.case_number && profile.region && ' · '}
                      {profile.region}
                    </p>
                  )}
                  {extraInfo && (
                    <p className="text-[11px] text-primary font-medium mt-0.5">{extraInfo}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator className="opacity-40" />

            {/* Contact details */}
            <div className="px-5 py-3 space-y-2">
              {email && (
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  <span className="truncate">{email}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  <span>{phone}</span>
                </div>
              )}
              {type === 'lead' && profile.source && (
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Target className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  <span>{LEAD_SOURCE_MAP[profile.source] || profile.source}</span>
                </div>
              )}
              {type === 'lead' && profile.status && (
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  <span>Status: <span className="font-medium text-foreground">{LEAD_STATUS_MAP[profile.status] || profile.status}</span></span>
                </div>
              )}
              {type === 'owner' && profile.company_name && (
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Home className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  <span>{profile.company_name}</span>
                </div>
              )}
              {profile.created_at && (
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  <span>Oprettet {format(new Date(profile.created_at), 'd. MMM yyyy', { locale: da })}</span>
                </div>
              )}
              {type === 'lead' && profile.next_step && (
                <div className="mt-1 flex items-start gap-2.5 text-xs">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                  <span className="text-primary font-medium">{profile.next_step}</span>
                </div>
              )}
              {profile.notes && (
                <div className="mt-1 flex items-start gap-2.5 text-xs">
                  <StickyNote className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 mt-0.5" />
                  <span className="text-muted-foreground line-clamp-2">{profile.notes}</span>
                </div>
              )}
            </div>

            <Separator className="opacity-40" />

            {/* Quick actions */}
            <div className="px-3 py-2 flex items-center gap-1">
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted/50 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                  <PhoneCall className="h-3 w-3 text-primary" />Ring
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted/50 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                  <Send className="h-3 w-3 text-primary" />Email
                </a>
              )}
              <div className="flex-1" />
              {onOpenDetail && (
                <button onClick={onOpenDetail} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted/50 text-[11px] font-medium text-primary transition-colors">
                  <ExternalLink className="h-3 w-3" />Åbn profil
                </button>
              )}
            </div>
          </>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
