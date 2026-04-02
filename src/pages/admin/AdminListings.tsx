import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminListingsModule } from '@/components/admin/listings/AdminListingsModule';

export default function AdminListings() {
  return (
    <AdminLayout>
      <AdminListingsModule />
    </AdminLayout>
  );
}
