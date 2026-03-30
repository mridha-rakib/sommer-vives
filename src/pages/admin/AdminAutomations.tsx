import { AdminLayout } from '@/components/layout/AdminLayout';

export default function AdminAutomations() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Automations</h1>
          <p className="text-sm text-muted-foreground mt-1">Automatiserede workflows og kommunikationsflows</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground">Automation-opsætning kommer snart.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
