import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Smartphone, Apple, Bell, BarChart3, CalendarDays, DoorOpen, ShoppingBag,
  LifeBuoy, Star, Shield, Zap, ArrowLeft, ArrowDown, Share, Plus, CheckCircle2
} from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { BrandLogo } from '@/components/ui/BrandLogo';

const ownerFeatures = [
  { icon: BarChart3, title: 'Indtjening i realtid', desc: 'Følg bookinger og udbetalinger direkte' },
  { icon: Bell, title: 'Push-notifikationer', desc: 'Nye bookinger, gæstebeskeder og opgaver' },
  { icon: CalendarDays, title: 'Kalender', desc: 'Se ledighed og kommende bookinger' },
  { icon: Star, title: 'Gæsteanmeldelser', desc: 'Læs feedback lige når den kommer' },
  { icon: Shield, title: 'Driftsstatus', desc: 'Rengøring, vedligehold og opgaver' },
  { icon: Zap, title: 'Hurtig support', desc: 'Kontakt SommerVibes med ét tryk' },
];

const guestFeatures = [
  { icon: DoorOpen, title: 'Check-in guide', desc: 'Adgangskode og ankomstguide' },
  { icon: ShoppingBag, title: 'Tilkøb', desc: 'Sengelinned, tidlig ankomst og mere' },
  { icon: LifeBuoy, title: '24/7 support', desc: 'Hjælp under hele dit ophold' },
  { icon: CalendarDays, title: 'Reservationsdetaljer', desc: 'Dato, pris og betalingsstatus' },
  { icon: Star, title: 'Husinformation', desc: 'WiFi, husregler og lokal info' },
  { icon: Bell, title: 'Opdateringer', desc: 'Automatiske påmindelser før ophold' },
];

export default function AppDownload() {
  const { canInstall, install, isIOS, isInstalled } = useInstallPrompt();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
              <Home className="h-3.5 w-3.5 text-accent" />
            </div>
            <span className="font-display text-base font-semibold text-foreground">
              Sommer<span className="text-accent">Vibes</span>
            </span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Tilbage
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center mx-auto mb-6">
            <Smartphone className="w-10 h-10 text-accent" />
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            SommerVibes i lommen
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Styr dit sommerhus eller følg dit ophold — direkte fra din telefon. 
            Alt samlet ét sted, elegant og nemt.
          </p>

          {isInstalled ? (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500/10 text-emerald-600 font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              App er installeret!
            </div>
          ) : canInstall ? (
            <Button 
              onClick={() => install()} 
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-3 h-14 px-10 rounded-2xl text-lg"
            >
              <ArrowDown className="w-6 h-6" />
              Installér SommerVibes
            </Button>
          ) : isIOS ? (
            <div className="max-w-sm mx-auto">
              <Card className="border-accent/20 bg-accent/5">
                <CardContent className="p-6">
                  <p className="text-sm font-semibold text-foreground mb-4">Installér på iPhone / iPad:</p>
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                        <Share className="w-4 h-4 text-accent" />
                      </div>
                      <span>Tryk på <strong className="text-foreground">Del</strong>-knappen i Safari</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                        <Plus className="w-4 h-4 text-accent" />
                      </div>
                      <span>Vælg <strong className="text-foreground">"Føj til hjemmeskærm"</strong></span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                      </div>
                      <span>Appen er klar!</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="bg-foreground text-background hover:bg-foreground/90 gap-3 h-14 px-8 rounded-2xl text-base">
                <Apple className="w-6 h-6" />
                <div className="text-left">
                  <div className="text-[10px] leading-none opacity-70">Download i</div>
                  <div className="text-base font-semibold leading-tight">App Store</div>
                </div>
              </Button>
              <Button className="bg-foreground text-background hover:bg-foreground/90 gap-3 h-14 px-8 rounded-2xl text-base">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302-2.302 2.302-2.698-2.302 2.698-2.302zM5.864 2.658L16.8 8.99l-2.302 2.302-8.635-8.635z"/></svg>
                <div className="text-left">
                  <div className="text-[10px] leading-none opacity-70">Hent den i</div>
                  <div className="text-base font-semibold leading-tight">Google Play</div>
                </div>
              </Button>
            </div>
          )}
          {!isInstalled && <p className="text-xs text-muted-foreground/60 mt-4">Gratis · iOS 15+ · Android 10+</p>}
        </div>

        {/* Owner features */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">For boligejere</h2>
            <p className="text-sm text-muted-foreground">Hold styr på dit sommerhus — uanset hvor du er</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ownerFeatures.map((f, i) => (
              <Card key={i} className="border-border/50 hover:border-accent/20 transition-colors">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{f.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{f.desc}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Guest features */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">For gæster</h2>
            <p className="text-sm text-muted-foreground">Den perfekte feriekompagnon i din lomme</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {guestFeatures.map((f, i) => (
              <Card key={i} className="border-border/50 hover:border-accent/20 transition-colors">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{f.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{f.desc}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Deep link section */}
        <section className="text-center">
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="p-8">
              <h3 className="font-display text-lg font-bold text-foreground mb-2">Har du allerede appen?</h3>
              <p className="text-sm text-muted-foreground mb-6">Åbn direkte i SommerVibes-appen</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/owner">
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl h-11 px-6">
                    Åbn ejerportal
                  </Button>
                </Link>
                <Link to="/guest">
                  <Button variant="outline" className="rounded-xl h-11 px-6 border-accent/30 text-accent hover:bg-accent/10">
                    Åbn gæsteportal
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
