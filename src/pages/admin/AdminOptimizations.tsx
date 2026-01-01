import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, DollarSign, Home, Calendar, Users, PiggyBank, Percent } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area } from 'recharts';

interface SimulationParams {
  properties: number;
  avgRevenuePerProperty: number;
  bookingsPerProperty: number;
  nightsPerProperty: number;
  hostCommission: number;
  guestCommission: number;
  adminFeePerBooking: number;
  utilityFeePerNight: number;
}

const defaultParams: SimulationParams = {
  properties: 20,
  avgRevenuePerProperty: 150000,
  bookingsPerProperty: 70,
  nightsPerProperty: 160,
  hostCommission: 15,
  guestCommission: 5,
  adminFeePerBooking: 90,
  utilityFeePerNight: 65,
};

export default function AdminOptimizations() {
  const [params, setParams] = useState<SimulationParams>(defaultParams);

  const updateParam = (key: keyof SimulationParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const calculations = useMemo(() => {
    const totalRevenue = params.properties * params.avgRevenuePerProperty;
    const totalBookings = params.properties * params.bookingsPerProperty;
    const totalNights = params.properties * params.nightsPerProperty;
    
    // Indkomst fra værter (15% af omsætning)
    const hostCommissionRevenue = totalRevenue * (params.hostCommission / 100);
    
    // Indkomst fra gæster (5% af omsætning)
    const guestCommissionRevenue = totalRevenue * (params.guestCommission / 100);
    
    // Admin gebyr (90 kr pr. booking)
    const adminFeeRevenue = totalBookings * params.adminFeePerBooking;
    
    // Vand & el (65 kr pr. nat)
    const utilityFeeRevenue = totalNights * params.utilityFeePerNight;
    
    // Total platform indkomst
    const totalPlatformRevenue = hostCommissionRevenue + guestCommissionRevenue + adminFeeRevenue + utilityFeeRevenue;
    
    // Skadespulje (3% af platform kommission)
    const damagePool = (hostCommissionRevenue + guestCommissionRevenue) * 0.03;
    
    // Nettoindtjening
    const netRevenue = totalPlatformRevenue - damagePool;

    return {
      totalRevenue,
      totalBookings,
      totalNights,
      hostCommissionRevenue,
      guestCommissionRevenue,
      adminFeeRevenue,
      utilityFeeRevenue,
      totalPlatformRevenue,
      damagePool,
      netRevenue,
    };
  }, [params]);

  // Generate trend data for charts
  const trendData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const seasonFactor = 1 + 0.5 * Math.sin((month - 3) * Math.PI / 6); // Peak in summer
      const baseRevenue = (calculations.totalPlatformRevenue / 12) * seasonFactor;
      return {
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'][i],
        platformIndkomst: Math.round(baseRevenue),
        værtsKommission: Math.round((calculations.hostCommissionRevenue / 12) * seasonFactor),
        gæsteKommission: Math.round((calculations.guestCommissionRevenue / 12) * seasonFactor),
        adminGebyr: Math.round(calculations.adminFeeRevenue / 12),
        utilities: Math.round((calculations.utilityFeeRevenue / 12) * seasonFactor),
      };
    });
  }, [calculations]);

  // Generate property scaling data
  const scalingData = useMemo(() => {
    return [5, 10, 15, 20, 25, 30, 40, 50, 75, 100].map(propCount => {
      const scaledRevenue = propCount * params.avgRevenuePerProperty;
      const scaledBookings = propCount * params.bookingsPerProperty;
      const scaledNights = propCount * params.nightsPerProperty;
      
      const hostComm = scaledRevenue * (params.hostCommission / 100);
      const guestComm = scaledRevenue * (params.guestCommission / 100);
      const adminFee = scaledBookings * params.adminFeePerBooking;
      const utility = scaledNights * params.utilityFeePerNight;
      const total = hostComm + guestComm + adminFee + utility;
      
      return {
        boliger: propCount,
        totalIndkomst: Math.round(total),
        nettoIndkomst: Math.round(total * 0.97),
      };
    });
  }, [params]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('da-DK', { 
      style: 'currency', 
      currency: 'DKK',
      maximumFractionDigits: 0 
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('da-DK').format(value);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Optimeringer & Simulering
          </h1>
          <p className="text-muted-foreground">
            Simulér platformens indtjening med forskellige scenarier
          </p>
        </div>

        {/* Input Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Baseline Parametre</CardTitle>
            <CardDescription>Justér tallene for at se hvordan de påvirker indtjeningen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Properties */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-primary" />
                    Antal boliger
                  </Label>
                  <span className="font-semibold text-primary">{params.properties}</span>
                </div>
                <Slider
                  value={[params.properties]}
                  onValueChange={([v]) => updateParam('properties', v)}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <Input
                  type="number"
                  value={params.properties}
                  onChange={(e) => updateParam('properties', Number(e.target.value))}
                  className="h-8"
                />
              </div>

              {/* Avg Revenue */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    Gns. omsætning/bolig
                  </Label>
                  <span className="font-semibold text-emerald-600">{formatCurrency(params.avgRevenuePerProperty)}</span>
                </div>
                <Slider
                  value={[params.avgRevenuePerProperty]}
                  onValueChange={([v]) => updateParam('avgRevenuePerProperty', v)}
                  min={50000}
                  max={500000}
                  step={5000}
                  className="w-full"
                />
                <Input
                  type="number"
                  value={params.avgRevenuePerProperty}
                  onChange={(e) => updateParam('avgRevenuePerProperty', Number(e.target.value))}
                  className="h-8"
                />
              </div>

              {/* Bookings per property */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Bookinger/bolig
                  </Label>
                  <span className="font-semibold text-blue-600">{params.bookingsPerProperty}</span>
                </div>
                <Slider
                  value={[params.bookingsPerProperty]}
                  onValueChange={([v]) => updateParam('bookingsPerProperty', v)}
                  min={10}
                  max={150}
                  step={5}
                  className="w-full"
                />
                <Input
                  type="number"
                  value={params.bookingsPerProperty}
                  onChange={(e) => updateParam('bookingsPerProperty', Number(e.target.value))}
                  className="h-8"
                />
              </div>

              {/* Nights per property */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    Udlejede nætter/bolig
                  </Label>
                  <span className="font-semibold text-purple-600">{params.nightsPerProperty}</span>
                </div>
                <Slider
                  value={[params.nightsPerProperty]}
                  onValueChange={([v]) => updateParam('nightsPerProperty', v)}
                  min={30}
                  max={300}
                  step={5}
                  className="w-full"
                />
                <Input
                  type="number"
                  value={params.nightsPerProperty}
                  onChange={(e) => updateParam('nightsPerProperty', Number(e.target.value))}
                  className="h-8"
                />
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Host Commission */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-orange-600" />
                    Værts-kommission
                  </Label>
                  <span className="font-semibold text-orange-600">{params.hostCommission}%</span>
                </div>
                <Slider
                  value={[params.hostCommission]}
                  onValueChange={([v]) => updateParam('hostCommission', v)}
                  min={5}
                  max={25}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Guest Commission */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-teal-600" />
                    Gæste-kommission
                  </Label>
                  <span className="font-semibold text-teal-600">{params.guestCommission}%</span>
                </div>
                <Slider
                  value={[params.guestCommission]}
                  onValueChange={([v]) => updateParam('guestCommission', v)}
                  min={0}
                  max={15}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Admin Fee */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <PiggyBank className="h-4 w-4 text-pink-600" />
                    Admin gebyr/booking
                  </Label>
                  <span className="font-semibold text-pink-600">{formatCurrency(params.adminFeePerBooking)}</span>
                </div>
                <Slider
                  value={[params.adminFeePerBooking]}
                  onValueChange={([v]) => updateParam('adminFeePerBooking', v)}
                  min={0}
                  max={250}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Utility Fee */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-cyan-600" />
                    Vand & el/nat
                  </Label>
                  <span className="font-semibold text-cyan-600">{formatCurrency(params.utilityFeePerNight)}</span>
                </div>
                <Slider
                  value={[params.utilityFeePerNight]}
                  onValueChange={([v]) => updateParam('utilityFeePerNight', v)}
                  min={0}
                  max={150}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total omsætning</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(calculations.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Værts-kommission</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(calculations.hostCommissionRevenue)}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-teal-500/10 to-teal-500/5 border-teal-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Gæste-kommission</p>
              <p className="text-xl font-bold text-teal-600">{formatCurrency(calculations.guestCommissionRevenue)}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border-pink-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Admin gebyrer</p>
              <p className="text-xl font-bold text-pink-600">{formatCurrency(calculations.adminFeeRevenue)}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Vand & el</p>
              <p className="text-xl font-bold text-cyan-600">{formatCurrency(calculations.utilityFeeRevenue)}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Platform netto</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(calculations.netRevenue)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Indtægtsfordeling</CardTitle>
              <CardDescription>Hvordan platformens indtjening er sammensat</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Værts-kommission ({params.hostCommission}%)</span>
                  <span className="font-semibold">{formatCurrency(calculations.hostCommissionRevenue)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full" 
                    style={{ width: `${(calculations.hostCommissionRevenue / calculations.totalPlatformRevenue) * 100}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Gæste-kommission ({params.guestCommission}%)</span>
                  <span className="font-semibold">{formatCurrency(calculations.guestCommissionRevenue)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-teal-500 h-2 rounded-full" 
                    style={{ width: `${(calculations.guestCommissionRevenue / calculations.totalPlatformRevenue) * 100}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Admin gebyr ({formatNumber(calculations.totalBookings)} bookinger × {params.adminFeePerBooking} kr)</span>
                  <span className="font-semibold">{formatCurrency(calculations.adminFeeRevenue)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-pink-500 h-2 rounded-full" 
                    style={{ width: `${(calculations.adminFeeRevenue / calculations.totalPlatformRevenue) * 100}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Vand & el ({formatNumber(calculations.totalNights)} nætter × {params.utilityFeePerNight} kr)</span>
                  <span className="font-semibold">{formatCurrency(calculations.utilityFeeRevenue)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-cyan-500 h-2 rounded-full" 
                    style={{ width: `${(calculations.utilityFeeRevenue / calculations.totalPlatformRevenue) * 100}%` }}
                  />
                </div>

                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-600">Skadespulje (3%)</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(calculations.damagePool)}</span>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-semibold">Platform nettoindtjening</span>
                  <span className="text-xl font-bold text-emerald-600">{formatCurrency(calculations.netRevenue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nøgletal</CardTitle>
              <CardDescription>Beregnede gennemsnit og totaler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase">Total bookinger</p>
                  <p className="text-2xl font-bold">{formatNumber(calculations.totalBookings)}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase">Total nætter</p>
                  <p className="text-2xl font-bold">{formatNumber(calculations.totalNights)}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase">Gns. booking værdi</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculations.totalRevenue / calculations.totalBookings)}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase">Gns. nætter/booking</p>
                  <p className="text-2xl font-bold">{(calculations.totalNights / calculations.totalBookings).toFixed(1)}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase">Platform/booking</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculations.netRevenue / calculations.totalBookings)}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase">Platform/bolig</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculations.netRevenue / params.properties)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Månedlig indtægt (estimat)
              </CardTitle>
              <CardDescription>Baseret på sæsonvariation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Area type="monotone" dataKey="platformIndkomst" name="Platform total" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Home className="h-5 w-5" />
                Skalering: Indtjening vs. boliger
              </CardTitle>
              <CardDescription>Hvordan indtjeningen stiger med flere boliger</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scalingData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="boliger" className="text-xs" />
                    <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="totalIndkomst" name="Brutto" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="nettoIndkomst" name="Netto" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Månedlig indtægtsfordeling</CardTitle>
            <CardDescription>Fordeling af indtægtskilder pr. måned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Bar dataKey="værtsKommission" name="Værts-kommission" fill="#f97316" stackId="a" />
                  <Bar dataKey="gæsteKommission" name="Gæste-kommission" fill="#14b8a6" stackId="a" />
                  <Bar dataKey="adminGebyr" name="Admin gebyr" fill="#ec4899" stackId="a" />
                  <Bar dataKey="utilities" name="Vand & el" fill="#06b6d4" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
