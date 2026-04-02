import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminListingsModule } from '@/components/admin/listings/AdminListingsModule';

export default function AdminSager() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader title="Sager" subtitle="Ejendomme, listings, status, priser, kanaler og dokumenter" />
        <AdminListingsModule />
      </div>
    </AdminLayout>
  );
}
