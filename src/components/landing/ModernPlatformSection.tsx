import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function ModernPlatformSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          {/* Left - Text */}
          <div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-6 leading-tight">
              Den nye standard for moderne sommerhusudlejning
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Med SommerVibes' omhyggelige design og funktioner specifikt lavet til
              sommerhusejere, er SommerVibes det moderne værktøj til at udleje dit sommerhus.
            </p>
            <Link to="/how-it-works">
              <Button variant="gold" size="lg" className="gap-2">
                Udforsk hvordan du udlejer
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Right - Dashboard mockup */}
          <div className="relative">
            {/* Main dashboard card */}
            <div className="bg-background rounded-2xl shadow-elevated border border-border p-6 md:p-8">
              <div className="text-sm text-muted-foreground mb-1">God eftermiddag 👋</div>
              <h3 className="font-display text-xl font-bold text-primary mb-6">Dit overblik</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="text-xs text-muted-foreground mb-1">Indtjening i år</div>
                  <div className="font-display text-2xl font-bold text-primary">132.730 DKK</div>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="text-xs text-muted-foreground mb-1">Godkendelsesrate</div>
                  <div className="font-display text-2xl font-bold text-accent">100%</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between bg-accent/10 rounded-lg p-3">
                  <span className="text-sm font-medium text-primary">Ny bookingforespørgsel</span>
                  <Button variant="outline" size="sm" className="h-7 text-xs border-accent text-accent">
                    Se detaljer
                  </Button>
                </div>
                <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                  <span className="text-sm text-muted-foreground">Næste check-in: 15. jul</span>
                  <span className="text-xs text-accent font-medium">3 dage</span>
                </div>
                <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                  <span className="text-sm text-muted-foreground">Svartid</span>
                  <span className="text-xs text-primary font-medium">Under 1 time</span>
                </div>
              </div>
            </div>

            {/* Floating stats card */}
            <div className="absolute -bottom-4 -right-4 bg-background rounded-xl shadow-xl border border-border p-4 w-48">
              <div className="text-xs text-muted-foreground mb-1">Visninger denne uge</div>
              <div className="font-display text-xl font-bold text-primary">296</div>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-xs text-accent font-medium">+22% vs. sidst</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
