import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-card text-foreground">
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <span className="font-display text-2xl font-bold tracking-tight text-foreground">
                S<span className="inline-block relative w-[0.65em] h-[0.65em] -mb-[0.05em] mx-[0.02em]"><svg className="absolute inset-0 w-full h-full drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="8" fill="hsl(var(--primary))" /><circle cx="16" cy="16" r="11" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.5" />{[0,45,90,135,180,225,270,315].map((angle, i) => { const rad = (angle * Math.PI) / 180; const x1 = 16 + 12 * Math.cos(rad); const y1 = 16 + 12 * Math.sin(rad); const x2 = 16 + 15 * Math.cos(rad); const y2 = 16 + 15 * Math.sin(rad); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--primary))" strokeWidth="1.8" strokeLinecap="round" />; })}</svg></span>mmer<span className="text-primary italic">Vibes</span>
              </span>
            </Link>
            <p className="text-foreground/70 text-sm leading-relaxed">
              Din partner i professionel sommerhusudlejning. Vi gør det nemt at udleje dit sommerhus med kun 15% kommission.
            </p>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold mb-4">For ejere</h4>
            <ul className="space-y-2">
              <li><Link to="/how-it-works" className="text-sm text-foreground/70 hover:text-primary transition-colors">Sådan virker det</Link></li>
              <li><Link to="/pricing" className="text-sm text-foreground/70 hover:text-primary transition-colors">Priser</Link></li>
              <li><Link to="/kom-i-gang" className="text-sm text-foreground/70 hover:text-primary transition-colors">Opret sommerhus</Link></li>
              <li><Link to="/refer-a-host" className="text-sm text-foreground/70 hover:text-primary transition-colors">Henvis en ejer</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Om os</h4>
            <ul className="space-y-2">
              <li><Link to="/team" className="text-sm text-foreground/70 hover:text-primary transition-colors">Mød teamet</Link></li>
              <li><Link to="/contact" className="text-sm text-foreground/70 hover:text-primary transition-colors">Kontakt os</Link></li>
              <li><Link to="/#faq" className="text-sm text-foreground/70 hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Kontakt</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-foreground/70">
                <Mail className="h-4 w-4 text-primary" />
                kontakt@sommervibes.dk
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground/70">
                <Phone className="h-4 w-4 text-primary" />
                +45 12 34 56 78
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground/70">
                <MapPin className="h-4 w-4 text-primary" />
                København, Danmark
              </li>
            </ul>
            <div className="mt-4 space-y-1">
              <p className="text-xs text-foreground/50 font-semibold uppercase tracking-wider">Åbningstider</p>
              <p className="text-sm text-foreground/70">Tirsdag–fredag: 10–15</p>
              <p className="text-sm text-foreground/70">Mandag, lørdag & søndag: Lukket</p>
              <p className="text-xs text-foreground/50 mt-2">Chatsupport (gæster/ejere): 10–22</p>
            </div>
          </div>
        </div>

        <div className="border-t border-foreground/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-foreground/50">
            © {new Date().getFullYear()} SommerVibes. Alle rettigheder forbeholdes.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-sm text-foreground/50 hover:text-primary transition-colors">Privatlivspolitik</Link>
            <Link to="/terms" className="text-sm text-foreground/50 hover:text-primary transition-colors">Vilkår og betingelser</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
