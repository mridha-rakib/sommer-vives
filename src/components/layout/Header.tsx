import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Menu, X, User, LogOut, ChevronRight, Calculator } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    let ticking = false;
    let lastScrolled = scrolled;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const next = window.scrollY > 50;
        if (next !== lastScrolled) {
          lastScrolled = next;
          setScrolled(next);
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const transparent = isHome && !scrolled && !mobileMenuOpen;

  const navigation = [
    { name: t('nav.howItWorks'), href: '/#saadan-virker-det' },
    { name: t('nav.listings'), href: '/listings' },
    { name: t('nav.pricing'), href: '/#priser' },
    { name: t('nav.faq'), href: '/#faq' },
    { name: t('nav.about'), href: '/about' },
  ];

  const isActiveLink = (href: string) => {
    if (href.startsWith('/#')) return location.pathname === '/' && location.hash === href.slice(1);
    return location.pathname === href;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        transparent
          ? 'bg-transparent'
          : 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-[0_1px_20px_-6px_rgba(0,0,0,0.1)]'
      }`}
    >
      <nav className="container mx-auto px-4 md:px-8">
        <div className="flex h-16 md:h-[72px] items-center justify-between">
          {/* Logo */}
          <div className="shrink-0">
            <BrandLogo
              variant="full"
              size="sm"
              tone="light"
            />
          </div>

          {/* Desktop Navigation */}
          <div className={`hidden 2xl:flex items-center gap-0.5 rounded-full px-1 py-0.5 transition-all duration-500 ${
            transparent
              ? 'bg-foreground/8 backdrop-blur-md border border-foreground/10'
              : 'bg-muted/50 border border-border/50'
          }`}>
            {navigation.map((item) => {
              const active = isActiveLink(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative whitespace-nowrap px-3.5 py-1.5 rounded-full text-[12.5px] leading-none font-medium transition-all duration-300 ${
                    active
                      ? transparent
                        ? 'text-primary bg-primary/15'
                        : 'text-primary bg-primary/10'
                      : transparent
                        ? 'text-foreground/70 hover:text-foreground hover:bg-foreground/8'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right side actions */}
          <div className="hidden 2xl:flex items-center gap-2">
            <LanguageSelector />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 rounded-full ${
                      transparent
                        ? 'text-foreground/80 hover:text-foreground hover:bg-foreground/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      transparent ? 'bg-primary/20' : 'bg-primary/10'
                    }`}>
                      <User className="h-3 w-3 text-primary" />
                    </div>
                    {t('nav.myAccount')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl border-border/50 shadow-elevated">
                  <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user.email}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-lg">
                    <Link to="/" className="flex items-center gap-2">
                      <ChevronRight className="h-3 w-3" />
                      {t('nav.home')}
                    </Link>
                  </DropdownMenuItem>
                  {isOwner && (
                    <DropdownMenuItem asChild className="rounded-lg">
                      <Link to="/owner" className="flex items-center gap-2">
                        <ChevronRight className="h-3 w-3" />
                        {t('nav.ownerPortal')}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem asChild className="rounded-lg">
                      <Link to="/admin" className="flex items-center gap-2">
                        <ChevronRight className="h-3 w-3" />
                        {t('nav.adminPortal')}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive rounded-lg">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className={`rounded-full text-[13px] px-3 gap-1.5 ${
                    transparent
                      ? 'text-foreground/70 hover:text-foreground hover:bg-foreground/10'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}>
                    <User className="h-3.5 w-3.5" />
                    {t('nav.ownerLogin')}
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t('nav.guestLogin')}
                      className={`rounded-full ${
                        transparent
                          ? 'text-foreground/70 hover:text-foreground hover:bg-foreground/10'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/50 shadow-elevated">
                    <DropdownMenuItem asChild className="rounded-lg">
                      <Link to="/guest/auth" className="flex items-center gap-2">
                        <ChevronRight className="h-3 w-3" />
                        {t('nav.guestLogin')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="rounded-lg">
                      <Link to="/admin/auth" className="flex items-center gap-2">
                        <ChevronRight className="h-3 w-3" />
                        {t('nav.adminLogin')}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Link to="/beregn-lejeindtaegt">
                  <Button variant="ghost" size="sm" className={`rounded-full text-[13px] px-4 gap-1.5 ${
                    transparent
                      ? 'text-foreground/70 hover:text-foreground hover:bg-foreground/10'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}>
                    <Calculator className="w-3.5 h-3.5" />
                    {t('nav.calcEarnings')}
                  </Button>
                </Link>
                <Link to="/book-vurdering">
                  <Button variant="outline" size="sm" className="rounded-full text-[13px] px-4 border-primary/30 text-primary hover:bg-primary/10">
                    {t('hero.cta2')}
                  </Button>
                </Link>
                <Link to="/kom-i-gang">
                  <Button variant="gold" size="sm" className="rounded-full text-[13px] px-5 shadow-[0_2px_12px_-3px_hsl(var(--primary)/0.4)]">
                    {t('nav.getStarted')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className={`2xl:hidden p-2 rounded-xl transition-colors ${
              transparent
                ? 'text-foreground hover:bg-foreground/10'
                : 'text-foreground hover:bg-muted'
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="2xl:hidden overflow-hidden"
            >
              <div className="pb-5 pt-2">
                <div className="flex flex-col gap-1 mb-4">
                  {navigation.map((item) => {
                    const active = isActiveLink(item.href);
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          active
                            ? 'text-primary bg-primary/8'
                            : 'text-foreground hover:bg-muted/50'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                        <ChevronRight className={`w-4 h-4 ${active ? 'text-primary' : 'text-muted-foreground/30'}`} />
                      </Link>
                    );
                  })}
                </div>

                {/* Language selector in mobile */}
                <div className="flex items-center justify-center mb-4 pt-2 border-t border-border/50">
                  <LanguageSelector />
                </div>

                <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                  {user ? (
                    <>
                      {isOwner && (
                        <Link to="/owner" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full rounded-xl">{t('nav.ownerPortal')}</Button>
                        </Link>
                      )}
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full rounded-xl">Admin</Button>
                        </Link>
                      )}
                      <Button variant="ghost" onClick={signOut} className="w-full text-destructive rounded-xl">{t('nav.logout')}</Button>
                    </>
                  ) : (
                    <>
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full rounded-xl">{t('nav.ownerLogin')}</Button>
                      </Link>
                      <Link to="/guest/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full rounded-xl">{t('nav.guestLogin')}</Button>
                      </Link>
                      <Link to="/admin/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full rounded-xl text-muted-foreground">{t('nav.adminLogin')}</Button>
                      </Link>
                      <Link to="/beregn-lejeindtaegt" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full rounded-xl gap-1.5">
                          <Calculator className="w-4 h-4" />
                          {t('nav.calcEarnings')}
                        </Button>
                      </Link>
                      <Link to="/book-vurdering" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full rounded-xl border-primary/30 text-primary">
                          {t('hero.cta2')}
                        </Button>
                      </Link>
                      <Link to="/kom-i-gang" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="gold" className="w-full rounded-xl shadow-[0_2px_12px_-3px_hsl(var(--primary)/0.4)]">{t('nav.getStarted')}</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
