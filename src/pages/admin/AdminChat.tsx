import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminChatPanel } from '@/components/admin/AdminChatPanel';

export default function AdminChat() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Live Chat</h1>
          <p className="text-muted-foreground text-sm">Svar på gæste- og ejerhenvendelser i realtid</p>
        </div>
        <AdminChatPanel />
      </div>
    </AdminLayout>
  );
}
