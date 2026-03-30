import { AdminLayout } from '@/components/layout/AdminLayout';

export default function AdminCMS() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">CMS / Webindhold</h1>
          <p className="text-sm text-muted-foreground mt-1">Administrer indhold på den offentlige hjemmeside</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground">Indholdsadministration kommer snart.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
