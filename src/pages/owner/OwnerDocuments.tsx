import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, FileSignature, Receipt, Download, FolderOpen, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { da, de, enUS, nl } from 'date-fns/locale';
import {
  getOwnerDocuments,
  normalizeOwnerDocuments,
  type OwnerAgreementDocument,
  type OwnerUploadedDocument,
} from '@/lib/owner-documents-api';
import { useTranslation } from '@/lib/i18n';

const statusBadge = (status: string, label: string) => {
  const map: Record<string, { className: string }> = {
    signed: { className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
    draft: { className: 'bg-amber-400/15 text-amber-400 border-amber-400/20' },
    active: { className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
    paid: { className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
    issued: { className: 'bg-blue-400/15 text-blue-400 border-blue-400/20' },
    generated: { className: 'bg-blue-400/15 text-blue-400 border-blue-400/20' },
    sent: { className: 'bg-blue-400/15 text-blue-400 border-blue-400/20' },
  };
  const s = map[status] || { className: '' };
  return <Badge variant="outline" className={`text-[10px] ${s.className}`}>{label}</Badge>;
};

export default function OwnerDocuments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [agreements, setAgreements] = useState<OwnerAgreementDocument[]>([]);
  const [documents, setDocuments] = useState<OwnerUploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'agreements'>('all');
  const dateLocale = { da, en: enUS, de, nl }[language];
  const dateFormat = language === 'en' ? 'MMM d, yyyy' : 'd. MMM yyyy';
  const getStatusLabel = (status: string) => {
    const key = `owner.documents.status.${status}`;
    const translated = t(key);
    return translated === key ? status : translated;
  };

  useEffect(() => {
    if (user) loadDocs();
  }, [user]);

  const loadDocs = async () => {
    if (!user) return;
    try {
      const data = await getOwnerDocuments(user.id);
      setAgreements(data.agreements);
      setDocuments(data.documents);
    } finally {
      setLoading(false);
    }
  };

  const allDocs = normalizeOwnerDocuments(
    { agreements, documents },
    (version) => t('owner.documents.agreementTitle').replace('{version}', version),
  );

  const filtered = tab === 'agreements' ? allDocs.filter(d => d.type === 'agreement') : allDocs;

  const getIcon = (type: string) => {
    if (type === 'agreement') return FileSignature;
    return FileText;
  };

  return (
    <OwnerLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('owner.documents.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('owner.documents.subtitle')}</p>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1.5 p-1 bg-muted/40 rounded-xl w-fit">
          {[
            { key: 'all' as const, label: `${t('owner.documents.tab.all')} (${allDocs.length})` },
            { key: 'agreements' as const, label: `${t('owner.documents.tab.agreements')} (${agreements.length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-[hsl(var(--gold))] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground">{t('owner.documents.empty')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(doc => {
              const Icon = getIcon(doc.type);
              const handleOpen = () => {
                if (doc.type === 'agreement') navigate('/owner/agreement');
                else if (doc.url) window.open(doc.url, '_blank', 'noopener');
              };
              const canOpen = doc.type === 'agreement' || !!doc.url;
              return (
                <Card
                  key={doc.id}
                  className={`group hover:border-[hsl(var(--gold)/0.2)] transition-all ${canOpen ? 'cursor-pointer' : ''}`}
                  onClick={canOpen ? handleOpen : undefined}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-[hsl(var(--gold-light))]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{doc.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(doc.date), dateFormat, { locale: dateLocale })}
                        {doc.extra && ` · ${doc.extra}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {statusBadge(doc.status, getStatusLabel(doc.status))}
                      {canOpen && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={handleOpen}
                          title={t('owner.documents.view') === 'owner.documents.view' ? 'View' : t('owner.documents.view')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {doc.url && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" asChild>
                          <a href={doc.url} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}><Download className="w-4 h-4" /></a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
