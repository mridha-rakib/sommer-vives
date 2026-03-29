import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <span className="font-display text-2xl font-bold tracking-tight text-primary-foreground">
                Sommer<span className="text-accent italic">V<span className="inline-block relative w-0"><svg className="absolute -top-[1.1em] left-[-0.35em] w-[0.55em] h-[0.55em] text-accent" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5" /><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" /></svg></span>ibes</span>
              </span>
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Din partner i professionel sommerhusudlejning. Vi gør det nemt at udleje dit sommerhus med kun 15% kommission.
            </p>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold mb-4">For ejere</h4>
            <ul className="space-y-2">
              <li><Link to="/how-it-works" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">Sådan virker det</Link></li>
              <li><Link to="/pricing" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">Priser</Link></li>
              <li><Link to="/kom-i-gang" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">Opret sommerhus</Link></li>
              <li><Link to="/refer-a-host" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">Henvis en ejer</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Om os</h4>
            <ul className="space-y-2">
              <li><Link to="/team" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">Mød teamet</Link></li>
              <li><Link to="/contact" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">Kontakt os</Link></li>
              <li><Link to="/#faq" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Kontakt</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Mail className="h-4 w-4 text-accent" />
                kontakt@sommervibes.dk
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Phone className="h-4 w-4 text-accent" />
                +45 12 34 56 78
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <MapPin className="h-4 w-4 text-accent" />
                København, Danmark
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/50">
            © {new Date().getFullYear()} SommerVibes. Alle rettigheder forbeholdes.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-sm text-primary-foreground/50 hover:text-accent transition-colors">Privatlivspolitik</Link>
            <Link to="/terms" className="text-sm text-primary-foreground/50 hover:text-accent transition-colors">Vilkår og betingelser</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
