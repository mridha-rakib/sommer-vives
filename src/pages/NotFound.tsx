import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useTranslation } from "@/lib/i18n";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center">
        <div className="flex justify-center mb-8">
          <BrandLogo variant="mark" tone="dark" size="lg" />
        </div>
        <h1 className="font-display text-6xl font-bold text-primary mb-3">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">{t('notFound.message')}</p>
        <a href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium">
          {t('notFound.back')}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
