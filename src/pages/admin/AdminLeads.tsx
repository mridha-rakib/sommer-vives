import { AdminLayout } from '@/components/layout/AdminLayout';

export default function AdminLeads() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">Indgående forespørgsler og potentielle ejere</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground">Leads-oversigt kommer snart.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
