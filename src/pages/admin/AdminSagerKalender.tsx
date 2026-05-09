import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminCalendar } from '@/components/admin/AdminCalendar';

export default function AdminSagerKalender() {
  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sager — Kalender</h1>
          <p className="text-sm text-muted-foreground">Kalendervisning af bookinger og blokerede perioder</p>
        </div>
        <AdminCalendar />
      </div>
    </AdminLayout>
  );
}
