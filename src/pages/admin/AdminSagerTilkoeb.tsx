import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminAddOns as AddOnsComponent } from '@/components/admin/AdminAddOns';

export default function AdminSagerTilkoeb() {
  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tilkøb</h1>
          <p className="text-sm text-muted-foreground">Administrér tilkøb og ekstraydelser til listings</p>
        </div>
        <AddOnsComponent />
      </div>
    </AdminLayout>
  );
}
