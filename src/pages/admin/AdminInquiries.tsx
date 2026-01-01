import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Users, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Inquiry {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  check_in: string;
  check_out: string;
  guests: number;
  message: string | null;
  status: string;
  created_at: string;
  property_id: string;
}

interface Property {
  id: string;
  title: string;
}

export default function AdminInquiries() {
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load inquiries
    const { data: inqs } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    setInquiries(inqs || []);

    // Load properties for titles
    const propertyIds = [...new Set(inqs?.map(i => i.property_id) || [])];
    if (propertyIds.length > 0) {
      const { data: props } = await supabase
        .from('properties')
        .select('id, title')
        .in('id', propertyIds);

      const propsMap: Record<string, Property> = {};
      props?.forEach(p => { propsMap[p.id] = p; });
      setProperties(propsMap);
    }

    setLoading(false);
  };

  const updateStatus = async (inquiryId: string, newStatus: string) => {
    const { error } = await supabase
      .from('inquiries')
      .update({ status: newStatus })
      .eq('id', inquiryId);

    if (error) {
      toast({ title: 'Fejl', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Opdateret', description: `Status ændret.` });
      loadData();
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: 'bg-accent/20 text-accent',
      contacted: 'bg-blue-100 text-blue-700',
      confirmed: 'bg-green-100 text-green-700',
      cancelled: 'bg-destructive/10 text-destructive',
    };
    const labels: Record<string, string> = {
      new: 'Ny',
      contacted: 'Kontaktet',
      confirmed: 'Bekræftet',
      cancelled: 'Annulleret',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.new}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredInquiries = filter === 'all'
    ? inquiries
    : inquiries.filter(i => i.status === filter);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Forespørgsler</h1>
          <p className="text-muted-foreground">Administrer alle henvendelser fra lejere</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="new">Nye</SelectItem>
            <SelectItem value="contacted">Kontaktet</SelectItem>
            <SelectItem value="confirmed">Bekræftet</SelectItem>
            <SelectItem value="cancelled">Annulleret</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Indlæser...</div>
      ) : filteredInquiries.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground">Ingen forespørgsler fundet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map(inquiry => (
            <div key={inquiry.id} className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-display text-lg font-semibold text-primary">{inquiry.guest_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {properties[inquiry.property_id]?.title || 'Ukendt ejendom'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(inquiry.status)}
                  <Select value={inquiry.status} onValueChange={(v) => updateStatus(inquiry.id, v)}>
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Ny</SelectItem>
                      <SelectItem value="contacted">Kontaktet</SelectItem>
                      <SelectItem value="confirmed">Bekræftet</SelectItem>
                      <SelectItem value="cancelled">Annulleret</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span>
                    {format(new Date(inquiry.check_in), 'd. MMM', { locale: da })} - {format(new Date(inquiry.check_out), 'd. MMM yyyy', { locale: da })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-accent" />
                  <span>{inquiry.guests} gæster</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-accent" />
                  <a href={`mailto:${inquiry.guest_email}`} className="text-accent hover:underline">
                    {inquiry.guest_email}
                  </a>
                </div>
                {inquiry.guest_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-accent" />
                    <a href={`tel:${inquiry.guest_phone}`} className="text-accent hover:underline">
                      {inquiry.guest_phone}
                    </a>
                  </div>
                )}
              </div>

              {inquiry.message && (
                <div className="bg-muted rounded-lg p-4 text-sm">
                  "{inquiry.message}"
                </div>
              )}

              <div className="mt-4 text-xs text-muted-foreground">
                Modtaget {format(new Date(inquiry.created_at), 'd. MMMM yyyy, HH:mm', { locale: da })}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
