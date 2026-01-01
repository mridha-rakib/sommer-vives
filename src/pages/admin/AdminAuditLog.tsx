import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { 
  Search, Filter, Calendar, Home, User, DollarSign, 
  Settings, ChevronLeft, ChevronRight, Activity
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { AuditLog } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 50;

const entityIcons: Record<string, typeof Activity> = {
  booking: Calendar,
  property: Home,
  guest: User,
  owner: User,
  payout: DollarSign,
  settings: Settings,
};

const actionColors: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  update: 'bg-blue-100 text-blue-800 border-blue-200',
  delete: 'bg-red-100 text-red-800 border-red-200',
  status_change: 'bg-amber-100 text-amber-800 border-amber-200',
  approve: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  reject: 'bg-red-100 text-red-800 border-red-200',
};

const actionLabels: Record<string, string> = {
  create: 'Oprettet',
  update: 'Opdateret',
  delete: 'Slettet',
  status_change: 'Status ændret',
  approve: 'Godkendt',
  reject: 'Afvist',
};

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }
      if (searchQuery) {
        query = query.or(`actor_email.ilike.%${searchQuery}%,entity_case_number.ilike.%${searchQuery}%`);
      }

      const { data, count, error } = await query;
      
      if (error) throw error;
      
      setLogs((data as AuditLog[]) || []);
      setTotalCount(count || 0);
    } catch (error) {
      toast.error('Kunne ikke hente aktivitetslog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, entityFilter, actionFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1);
      loadLogs();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Aktivitetslog</h1>
            <p className="text-muted-foreground">
              {totalCount} handlinger registreret
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søg på email, sagsnr..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Entitet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle typer</SelectItem>
                  <SelectItem value="booking">Booking</SelectItem>
                  <SelectItem value="property">Bolig</SelectItem>
                  <SelectItem value="guest">Gæst</SelectItem>
                  <SelectItem value="owner">Ejer</SelectItem>
                  <SelectItem value="payout">Udbetaling</SelectItem>
                  <SelectItem value="settings">Indstillinger</SelectItem>
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Handling" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle handlinger</SelectItem>
                  <SelectItem value="create">Oprettet</SelectItem>
                  <SelectItem value="update">Opdateret</SelectItem>
                  <SelectItem value="delete">Slettet</SelectItem>
                  <SelectItem value="status_change">Status ændret</SelectItem>
                  <SelectItem value="approve">Godkendt</SelectItem>
                  <SelectItem value="reject">Afvist</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(15)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Tidspunkt</TableHead>
                    <TableHead className="font-semibold">Bruger</TableHead>
                    <TableHead className="font-semibold">Handling</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Sagsnr.</TableHead>
                    <TableHead className="font-semibold">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        Ingen aktivitet fundet
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => {
                      const Icon = entityIcons[log.entity_type] || Activity;
                      return (
                        <TableRow key={log.id} className="hover:bg-muted/30">
                          <TableCell className="text-muted-foreground">
                            {format(new Date(log.created_at), "d. MMM yyyy 'kl.' HH:mm", { locale: da })}
                          </TableCell>
                          <TableCell>{log.actor_email || 'System'}</TableCell>
                          <TableCell>
                            <Badge className={actionColors[log.action] || 'bg-gray-100'} variant="outline">
                              {actionLabels[log.action] || log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              {log.entity_type}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.entity_case_number || '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {log.ip_address || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Viser {((page - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(page * ITEMS_PER_PAGE, totalCount)} af {totalCount}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Forrige
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Næste
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
