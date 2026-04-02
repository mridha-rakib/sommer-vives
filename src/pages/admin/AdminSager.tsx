import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminListingsModule } from '@/components/admin/listings/AdminListingsModule';

export default function AdminSager() {
  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sager</h1>
          <p className="text-sm text-muted-foreground">Ejendomme, listings, status, priser, kanaler og dokumenter</p>
        </div>
        <AdminListingsModule />
      </div>
    </AdminLayout>
  );
}
