import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminGuestsPage } from '@/components/admin/AdminGuestsPage';

export default function AdminCrmGaester() {
  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gæster</h1>
          <p className="text-sm text-muted-foreground">CRM — alle gæster i systemet</p>
        </div>
        <AdminGuestsPage />
      </div>
    </AdminLayout>
  );
}
