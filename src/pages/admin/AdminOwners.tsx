import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { 
  Search, Plus, Mail, Phone, Building2, 
  MoreHorizontal, Eye, Edit, DollarSign, Settings2
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Owner {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  company_name: string | null;
  case_number: string | null;
  created_at: string;
  property_count?: number;
  total_earnings?: number;
  commission?: {
    type: string;
    ek_percentage: number;
    erik_percentage: number;
  };
}

export default function AdminOwners() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [commissionType, setCommissionType] = useState<string>('platform');

  const loadOwners = async () => {
    setLoading(true);
    try {
      // Get all users with owner role
      const { data: ownerRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'owner');

      const ownerIds = ownerRoles?.map(r => r.user_id) || [];

      if (ownerIds.length === 0) {
        setOwners([]);
        setLoading(false);
        return;
      }

      // Get profiles for these owners
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', ownerIds);

      // Get property counts per owner
      const { data: properties } = await supabase
        .from('properties')
        .select('owner_id');

      // Get earnings per owner from bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('owner_id, owner_payout')
        .neq('status', 'cancelled');

      // Get commission splits
      const { data: commissions } = await supabase
        .from('commission_splits')
        .select('property_id, commission_type, ek_percentage, erik_percentage');

      const ownersWithStats = (profiles || []).map(profile => {
        const propertyCount = properties?.filter(p => p.owner_id === profile.id).length || 0;
        const totalEarnings = bookings
          ?.filter(b => b.owner_id === profile.id)
          .reduce((sum, b) => sum + (Number(b.owner_payout) || 0), 0) || 0;

        return {
          ...profile,
          property_count: propertyCount,
          total_earnings: totalEarnings,
        };
      });

      // Filter by search query
      const filtered = searchQuery
        ? ownersWithStats.filter(o => 
            o.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : ownersWithStats;

      setOwners(filtered);
    } catch (error) {
      toast.error('Kunne ikke hente ejere');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwners();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(loadOwners, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('da-DK', { 
      style: 'currency', 
      currency: 'DKK',
      maximumFractionDigits: 0 
    }).format(value);
  };

  const openCommissionDialog = (owner: Owner) => {
    setSelectedOwner(owner);
    setCommissionDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ejere</h1>
            <p className="text-muted-foreground">
              {owners.length} ejere registreret
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/owners/new">
              <Plus className="h-4 w-4 mr-2" />
              Ny ejer
            </Link>
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søg på navn, email, firma..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Samlede ejere</div>
              <div className="text-2xl font-bold">{owners.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total udbetalt</div>
              <div className="text-2xl font-bold text-accent">
                {formatCurrency(owners.reduce((sum, o) => sum + (o.total_earnings || 0), 0))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Gennemsnitlige boliger pr. ejer</div>
              <div className="text-2xl font-bold">
                {owners.length > 0 
                  ? (owners.reduce((sum, o) => sum + (o.property_count || 0), 0) / owners.length).toFixed(1)
                  : '0'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Navn</TableHead>
                    <TableHead className="font-semibold">Kontakt</TableHead>
                    <TableHead className="font-semibold">Firma</TableHead>
                    <TableHead className="font-semibold text-center">Boliger</TableHead>
                    <TableHead className="font-semibold text-right">Udbetalt</TableHead>
                    <TableHead className="font-semibold">Oprettet</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {owners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Ingen ejere fundet
                      </TableCell>
                    </TableRow>
                  ) : (
                    owners.map((owner) => (
                      <TableRow key={owner.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div>
                            <div className="font-medium">{owner.full_name || 'Ikke angivet'}</div>
                            {owner.case_number && (
                              <div className="text-xs text-muted-foreground font-mono">{owner.case_number}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              {owner.email}
                            </div>
                            {owner.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                {owner.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{owner.company_name || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            <Building2 className="h-3 w-3 mr-1" />
                            {owner.property_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-accent">
                          {formatCurrency(owner.total_earnings || 0)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(owner.created_at), 'd. MMM yyyy', { locale: da })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/owners/${owner.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Se profil
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Rediger
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openCommissionDialog(owner)}>
                                <Settings2 className="h-4 w-4 mr-2" />
                                Kommissionsopsætning
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <DollarSign className="h-4 w-4 mr-2" />
                                Se udbetalinger
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Commission Dialog */}
        <Dialog open={commissionDialogOpen} onOpenChange={setCommissionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kommissionsopsætning</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Ejer</Label>
                <p className="text-sm text-muted-foreground">{selectedOwner?.full_name || selectedOwner?.email}</p>
              </div>
              <div className="space-y-2">
                <Label>Kommissionstype</Label>
                <Select value={commissionType} onValueChange={setCommissionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="platform">Platform (50% / 50%)</SelectItem>
                    <SelectItem value="sales_meeting">Salgsmøde (80% / 20%)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {commissionType === 'platform' 
                    ? 'EK: 50% | Erik: 50% - For boliger taget via platform' 
                    : 'EK: 80% | Erik: 20% - For boliger taget via fysisk salgsmøde'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCommissionDialogOpen(false)}>Annuller</Button>
              <Button onClick={() => {
                toast.success('Kommission opdateret');
                setCommissionDialogOpen(false);
              }}>Gem</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
