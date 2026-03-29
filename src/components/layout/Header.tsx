import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

export function Header() {
  const { user, signOut, isAdmin, isOwner } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const transparent = isHome && !scrolled && !mobileMenuOpen;

  const navigation = [
    { name: 'Sådan virker det', href: '/how-it-works' },
    { name: 'Priser', href: '/pricing' },
    { name: 'Sommerhuse', href: '/rentals' },
    { name: 'Teamet', href: '/team' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        transparent
          ? 'bg-transparent border-b border-transparent'
          : 'bg-background/95 backdrop-blur-sm border-b border-border'
      }`}
    >
      <nav className="container mx-auto px-4 md:px-8">
        <div className="flex h-16 md:h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-1">
            <span className={`font-display text-2xl md:text-3xl font-bold tracking-tight transition-colors duration-300 ${
              transparent ? 'text-primary-foreground' : 'text-primary'
            }`}>
              Sommer<span className="text-accent">Vibes</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors ${
                  transparent
                    ? 'text-primary-foreground/80 hover:text-accent'
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={transparent ? 'ghost' : 'outline'} size="sm" className={`gap-2 ${transparent ? 'text-primary-foreground border-primary-foreground/30' : ''}`}>
                    <User className="h-4 w-4" />
                    Min konto
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {isOwner && (
                    <DropdownMenuItem asChild>
                      <Link to="/owner">Ejerportal</Link>
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">Admin</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log ud
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className={transparent ? 'text-primary-foreground hover:text-accent' : ''}>
                    Ejer Login
                  </Button>
                </Link>
                <Link to="/kom-i-gang">
                  <Button variant="gold" size="sm">Udlej dit hus</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className={`h-6 w-6 ${transparent ? 'text-primary-foreground' : ''}`} />
            ) : (
              <Menu className={`h-6 w-6 ${transparent ? 'text-primary-foreground' : ''}`} />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border bg-background rounded-b-2xl">
            <div className="flex flex-col gap-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {user ? (
                  <>
                    {isOwner && (
                      <Link to="/owner" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">Ejerportal</Button>
                      </Link>
                    )}
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">Admin</Button>
                      </Link>
                    )}
                    <Button variant="ghost" onClick={signOut} className="w-full text-destructive">Log ud</Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">Ejer Login</Button>
                    </Link>
                    <Link to="/kom-i-gang" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="gold" className="w-full">Udlej dit hus</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
