import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Users, Mail, Calendar, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface Owner {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  company_name: string | null;
  created_at: string;
}

export default function AdminOwners() {
  const { toast } = useToast();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOwners();
  }, []);

  const loadOwners = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Fejl', description: 'Kunne ikke indlæse ejere', variant: 'destructive' });
    } else {
      setOwners(data || []);
    }
    setLoading(false);
  };

  const makeAdmin = async (userId: string) => {
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: 'admin' });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Info', description: 'Brugeren er allerede admin.' });
      } else {
        toast({ title: 'Fejl', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: 'Succes', description: 'Brugeren er nu admin.' });
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-primary">Ejere</h1>
        <p className="text-muted-foreground">Administrer sommerhusejere på platformen</p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Navn</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Telefon</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Firma</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Oprettet</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">Indlæser...</td>
                </tr>
              ) : owners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">Ingen ejere fundet.</td>
                </tr>
              ) : (
                owners.map(owner => (
                  <tr key={owner.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium text-primary">
                      {owner.full_name || '-'}
                    </td>
                    <td className="p-4">
                      <a href={`mailto:${owner.email}`} className="text-accent hover:underline">
                        {owner.email}
                      </a>
                    </td>
                    <td className="p-4 text-muted-foreground">{owner.phone || '-'}</td>
                    <td className="p-4 text-muted-foreground">{owner.company_name || '-'}</td>
                    <td className="p-4 text-muted-foreground">
                      {format(new Date(owner.created_at), 'd. MMM yyyy', { locale: da })}
                    </td>
                    <td className="p-4">
                      <Button variant="outline" size="sm" onClick={() => makeAdmin(owner.id)}>
                        <Shield className="w-4 h-4 mr-1" />
                        Gør til admin
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
