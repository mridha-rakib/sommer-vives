import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { MessageSquare, Calendar, Users, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

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

export default function OwnerInquiries() {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // First get user's properties
    const { data: props } = await supabase
      .from('properties')
      .select('id, title')
      .eq('owner_id', user.id);

    if (props) {
      const propsMap: Record<string, Property> = {};
      props.forEach(p => { propsMap[p.id] = p; });
      setProperties(propsMap);

      // Then get inquiries for those properties
      const propertyIds = props.map(p => p.id);
      if (propertyIds.length > 0) {
        const { data: inqs } = await supabase
          .from('inquiries')
          .select('*')
          .in('property_id', propertyIds)
          .order('created_at', { ascending: false });

        setInquiries(inqs || []);
      }
    }
    setLoading(false);
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

  return (
    <OwnerLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-primary">Forespørgsler</h1>
        <p className="text-muted-foreground">Se henvendelser fra potentielle lejere</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Indlæser...</div>
      ) : inquiries.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold text-primary mb-2">Ingen forespørgsler endnu</h2>
          <p className="text-muted-foreground">Når potentielle lejere kontakter dig, vil de dukke op her.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map(inquiry => (
            <div key={inquiry.id} className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-display text-lg font-semibold text-primary">{inquiry.guest_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {properties[inquiry.property_id]?.title || 'Ukendt ejendom'}
                  </p>
                </div>
                {getStatusBadge(inquiry.status)}
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
                <div className="text-sm text-muted-foreground">
                  {format(new Date(inquiry.created_at), 'd. MMM yyyy', { locale: da })}
                </div>
              </div>

              {inquiry.message && (
                <div className="bg-muted rounded-lg p-4 text-sm">
                  "{inquiry.message}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </OwnerLayout>
  );
}
