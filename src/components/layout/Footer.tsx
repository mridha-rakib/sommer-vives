import { Link } from 'react-router-dom';
import { Home, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Home className="h-6 w-6 text-accent" />
              <span className="font-display text-xl font-semibold">
                Sommer<span className="text-accent">drøm</span>
              </span>
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-2">
              Slap af og nyd livet
            </p>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Din partner i professionel sommerhusudlejning. Vi gør det nemt at udleje dit sommerhus.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">For ejere</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/how-it-works" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">
                  Sådan virker det
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">
                  Priser
                </Link>
              </li>
              <li>
                <Link to="/auth?mode=signup" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">
                  Opret sommerhus
                </Link>
              </li>
              <li>
                <Link to="/refer-a-host" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">
                  Henvis en ejer
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Om os</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/team" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">
                  Mød teamet
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">
                  Kontakt os
                </Link>
              </li>
              <li>
                <Link to="/#faq" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/admin/auth" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Kontakt</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Mail className="h-4 w-4 text-accent" />
                kontakt@sommerdrom.dk
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
            © {new Date().getFullYear()} Sommerdrøm. Alle rettigheder forbeholdes.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-sm text-primary-foreground/50 hover:text-accent transition-colors">
              Privatlivspolitik
            </Link>
            <Link to="/terms" className="text-sm text-primary-foreground/50 hover:text-accent transition-colors">
              Vilkår og betingelser
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
