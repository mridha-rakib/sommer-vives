import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Mail, Save } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface EmailTemplate {
  id?: string; listing_id: string | null; email_type: string;
  subject: string; heading: string; body_text: string;
  cta_label: string; cta_url: string; is_active: boolean;
}

interface ListingOption { id: string; name: string; }

const EMAIL_TYPES = [
  { value: 'booking_confirmation', label: 'Bookingbekræftelse', description: 'Sendes lige efter betaling' },
];

export function AdminEmails() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [selectedListing, setSelectedListing] = useState<string>('');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('listings').select('id, name').order('sort_order');
      if (data) { setListings(data); if (data.length > 0) setSelectedListing(data[0].id); }
    })();
  }, []);

  useEffect(() => {
    if (!selectedListing) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('email_templates').select('*').eq('listing_id', selectedListing);
      const existingTemplates = (data || []) as unknown as EmailTemplate[];
      const allTemplates = EMAIL_TYPES.map(type => {
        const existing = existingTemplates.find(t => t.email_type === type.value);
        return existing || {
          listing_id: selectedListing, email_type: type.value,
          subject: 'Booking bekræftet — {{listing_name}} 🌊',
          heading: 'Booking bekræftet',
          body_text: 'Tak, {{guest_name}}! Din booking er bekræftet og betalt.',
          cta_label: 'Se dit ophold', cta_url: '', is_active: true,
        };
      });
      setTemplates(allTemplates);
      setLoading(false);
    })();
  }, [selectedListing]);

  const saveTemplates = async () => {
    setSaving(true);
    for (const tmpl of templates) {
      if (tmpl.id) {
        await supabase.from('email_templates').update({
          subject: tmpl.subject, heading: tmpl.heading, body_text: tmpl.body_text,
          cta_label: tmpl.cta_label || null, cta_url: tmpl.cta_url || null, is_active: tmpl.is_active,
        } as Record<string, unknown>).eq('id', tmpl.id);
      } else {
        const { data } = await supabase.from('email_templates').insert({
          listing_id: selectedListing, owner_id: user?.id, email_type: tmpl.email_type,
          subject: tmpl.subject, heading: tmpl.heading, body_text: tmpl.body_text,
          cta_label: tmpl.cta_label || null, cta_url: tmpl.cta_url || null, is_active: tmpl.is_active,
        } as Record<string, unknown>).select().single();
        if (data) tmpl.id = (data as { id?: string }).id;
      }
    }
    setSaving(false);
    toast({ title: 'Email-skabeloner gemt' });
  };

  const updateTemplate = (index: number, field: keyof EmailTemplate, value: EmailTemplate[keyof EmailTemplate]) => {
    setTemplates(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  if (loading && !listings.length) return <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Henter...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2"><Mail className="h-5 w-5" /> E-mails</h1>
        <p className="text-sm text-muted-foreground mt-1">Administrer bookingmails per listing</p>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium">Listing:</Label>
        <Select value={selectedListing} onValueChange={setSelectedListing}>
          <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
          <SelectContent>{listings.map(l => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}</SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Henter indstillinger...</div>
      ) : (
        <div className="space-y-6">
          {templates.map((tmpl, idx) => {
            const typeDef = EMAIL_TYPES.find(t => t.value === tmpl.email_type);
            return (
              <div key={tmpl.email_type} className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      {typeDef?.label}
                      <Badge variant={tmpl.is_active ? 'default' : 'secondary'} className="text-[10px]">{tmpl.is_active ? 'Aktiv' : 'Inaktiv'}</Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground">{typeDef?.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Aktiv</Label>
                    <Switch checked={tmpl.is_active} onCheckedChange={v => updateTemplate(idx, 'is_active', v)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Emne</Label><Input value={tmpl.subject} onChange={e => updateTemplate(idx, 'subject', e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Overskrift i mail</Label><Input value={tmpl.heading} onChange={e => updateTemplate(idx, 'heading', e.target.value)} /></div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Brødtekst</Label>
                  <Textarea value={tmpl.body_text} onChange={e => updateTemplate(idx, 'body_text', e.target.value)} rows={3} />
                  <p className="text-[10px] text-muted-foreground">Variabler: {'{{guest_name}}'} {'{{listing_name}}'} {'{{start_date}}'} {'{{end_date}}'} {'{{total_price}}'}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">CTA knap tekst</Label><Input value={tmpl.cta_label} onChange={e => updateTemplate(idx, 'cta_label', e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">CTA knap URL</Label><Input value={tmpl.cta_url} onChange={e => updateTemplate(idx, 'cta_url', e.target.value)} /></div>
                </div>
              </div>
            );
          })}
          <Button onClick={saveTemplates} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Gem skabeloner
          </Button>
        </div>
      )}
    </div>
  );
}
