import { useAuth } from '@/lib/auth';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Bell } from 'lucide-react';

export default function GuestMessages() {
  const { user, signOut } = useAuth();

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Beskeder</h1>
          <p className="text-sm text-muted-foreground mt-1">Kommunikation om dit ophold</p>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <Card className="hover:border-accent/20 transition-colors cursor-pointer">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">SommerVibes Support</div>
                <div className="text-xs text-muted-foreground">Direkte kontakt med dit support-team</div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:border-accent/20 transition-colors cursor-pointer">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Opdateringer</div>
                <div className="text-xs text-muted-foreground">Automatiske beskeder om dit ophold</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="py-16 text-center">
            <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Ingen beskeder endnu</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Du modtager beskeder om dit ophold her</p>
          </CardContent>
        </Card>
      </div>
    </GuestLayout>
  );
}
