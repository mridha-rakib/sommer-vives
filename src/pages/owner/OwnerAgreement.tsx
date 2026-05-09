import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSignature, Check, Shield, ArrowRight, ArrowLeft, Download,
  CheckCircle2, Phone, Globe, PenLine, Lock, Eye, Home, Calendar,
  ChevronDown, ChevronUp, FileText, Sparkles, Loader2
} from 'lucide-react';
import { SignatureCanvas } from '@/components/agreement/SignatureCanvas';
import {
  renderTemplate, buildVariables, extractPlaceholders, placeholderLabel,
  getStatusMeta, type AgreementVariables
} from '@/lib/agreement-engine';

const AGREEMENT_VERSION = '1.2';

interface AgreementData {
  ownerName: string; ownerEmail: string; ownerPhone: string; ownerAddress: string;
  propertyTitle: string; propertyAddress: string; propertyRegion: string; propertyId: string | null;
}

export default function OwnerAgreement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingAgreement, setExistingAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [templateHtml, setTemplateHtml] = useState('');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [showFullDoc, setShowFullDoc] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const [agreementData, setAgreementData] = useState<AgreementData>({
    ownerName: '', ownerEmail: '', ownerPhone: '', ownerAddress: '',
    propertyTitle: '', propertyAddress: '', propertyRegion: '', propertyId: null,
  });

  const [consent, setConsent] = useState({
    acceptAgreement: false, acceptTerms: false, acceptPrivacy: false, acceptMarketing: false,
  });
  const [signatureName, setSignatureName] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);

      const { data: templates } = await supabase
        .from('agreement_templates' as any)
        .select('*')
        .eq('is_active', true)
        .limit(1);
      if (templates && templates.length > 0) {
        setTemplateHtml((templates[0] as any).body_html || '');
        setTemplateId((templates[0] as any).id);
      }

      const { data: agreements } = await supabase
        .from('agreements').select('*').eq('owner_id', user.id)
        .order('created_at', { ascending: false }).limit(1);
      if (agreements && agreements.length > 0 && agreements[0].status === 'signed') {
        setExistingAgreement(agreements[0]);
        setStep(6);
      }

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) {
        setAgreementData(p => ({ ...p, ownerName: profile.full_name || '', ownerEmail: profile.email || '', ownerPhone: profile.phone || '' }));
        setSignatureName(profile.full_name || '');
      }

      const { data: properties } = await supabase.from('properties').select('*').eq('owner_id', user.id).limit(1);
      if (properties && properties.length > 0) {
        const pr = properties[0];
        setAgreementData(p => ({ ...p, propertyTitle: pr.title || '', propertyAddress: pr.address || '', propertyRegion: pr.region || '', propertyId: pr.id }));
      }

      setLoading(false);
    };
    load();
  }, [user]);

  const variables = buildVariables({
    ownerName: agreementData.ownerName, ownerAddress: agreementData.ownerAddress,
    ownerEmail: agreementData.ownerEmail, ownerPhone: agreementData.ownerPhone,
    propertyAddress: agreementData.propertyAddress, propertyRegion: agreementData.propertyRegion,
    commissionPercent: 15, bindingMonths: 6, signatureName,
  });

  const renderedHtml = renderTemplate(templateHtml, variables);
  const placeholders = extractPlaceholders(templateHtml);
  const missingFields = placeholders.filter(k => !variables[k as keyof AgreementVariables]?.trim());

  const handleSign = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('agreements').insert({
        owner_id: user.id,
        property_id: agreementData.propertyId,
        template_id: templateId,
        version: AGREEMENT_VERSION,
        status: 'signed',
        owner_name: agreementData.ownerName,
        owner_email: agreementData.ownerEmail,
        owner_phone: agreementData.ownerPhone,
        owner_address: agreementData.ownerAddress,
        property_title: agreementData.propertyTitle,
        property_address: agreementData.propertyAddress,
        property_region: agreementData.propertyRegion,
        commission_percent: 15,
        binding_months: 6,
        notice_days: 30,
        signature_name: signatureName,
        signature_date: new Date().toISOString().split('T')[0],
        signed_at: new Date().toISOString(),
        accept_terms: consent.acceptTerms,
        accept_privacy: consent.acceptPrivacy,
        accept_marketing: consent.acceptMarketing,
        generated_body: renderedHtml,
        signature_data_url: signatureDataUrl,
      } as any);
      if (error) throw error;

      const { data: agreements } = await supabase
        .from('agreements').select('*').eq('owner_id', user.id)
        .order('created_at', { ascending: false }).limit(1);
      if (agreements?.length) setExistingAgreement(agreements[0]);

      setStep(6);
      toast.success('Aftalen er signeret!');
    } catch (err: any) {
      toast.error(err.message || 'Der opstod en fejl');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = useCallback(async () => {
    setGeneratingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const agreement = existingAgreement;
      const htmlContent = agreement?.generated_body || renderedHtml;
      const sigName = agreement?.signature_name || signatureName;
      const sigDate = agreement?.signed_at
        ? new Date(agreement.signed_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
      const sigDataUrl = agreement?.signature_data_url || signatureDataUrl;

      // Create a temporary container for rendering
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;padding:60px;background:white;font-family:system-ui,sans-serif;color:#1a1a1a;font-size:14px;line-height:1.6;';
      container.innerHTML = `
        <div style="text-align:center;margin-bottom:32px;border-bottom:2px solid #e5e7eb;padding-bottom:24px;">
          <h1 style="font-size:22px;font-weight:700;margin:0 0 4px 0;">Formidlingsaftale</h1>
          <p style="color:#6b7280;font-size:12px;margin:0;">SommerVibes · Version ${agreement?.version || AGREEMENT_VERSION} · ${sigDate}</p>
        </div>
        <div style="font-size:13px;line-height:1.7;">${htmlContent}</div>
        <div style="margin-top:40px;border-top:2px solid #e5e7eb;padding-top:24px;">
          <p style="font-size:12px;color:#6b7280;margin:0 0 12px 0;">Digital signering</p>
          ${sigDataUrl ? `<img src="${sigDataUrl}" style="max-width:200px;height:auto;margin-bottom:8px;" />` : ''}
          <p style="font-size:14px;font-weight:600;margin:0;">${sigName}</p>
          <p style="font-size:12px;color:#6b7280;margin:4px 0 0 0;">${sigDate}</p>
        </div>
      `;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(container);

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`SommerVibes-Formidlingsaftale-${sigDate.replace(/\s/g, '-')}.pdf`);
      toast.success('PDF downloadet!');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Kunne ikke generere PDF. Prøv igen.');
    } finally {
      setGeneratingPdf(false);
    }
  }, [existingAgreement, renderedHtml, signatureName, signatureDataUrl]);

  const canSign = consent.acceptAgreement && consent.acceptTerms && consent.acceptPrivacy
    && signatureName.trim().length > 2 && signatureDataUrl !== null;

  if (loading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </OwnerLayout>
    );
  }

  // ─── Step bar ────────────────────────────────────────────
  const STEPS_META = [
    { label: 'Introduktion', icon: Eye },
    { label: 'Forhåndsvisning', icon: FileText },
    { label: 'Dine data', icon: Sparkles },
    { label: 'Bekræftelse', icon: Check },
    { label: 'Signering', icon: PenLine },
    { label: 'Signeret', icon: CheckCircle2 },
  ];

  const StepBar = () => (
    <div className="flex items-center justify-center gap-0 mb-8 overflow-x-auto px-2">
      {STEPS_META.map((s, i) => {
        const idx = i + 1; const done = idx < step; const active = idx === step;
        return (
          <div key={i} className="flex items-center shrink-0">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                done ? 'bg-primary text-primary-foreground' :
                active ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                'bg-muted/40 text-muted-foreground/50'
              }`}>
                {done ? <Check className="w-3.5 h-3.5" /> : <span className="font-semibold">{idx}</span>}
              </div>
              <span className={`text-[9px] mt-1 font-medium whitespace-nowrap ${
                active ? 'text-primary' : done ? 'text-primary/60' : 'text-muted-foreground/40'
              }`}>{s.label}</span>
            </div>
            {i < STEPS_META.length - 1 && (
              <div className={`w-6 md:w-10 h-px mx-1 ${done ? 'bg-primary/40' : 'bg-border/30'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const InfoRow = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
    <div className="flex justify-between text-sm py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? 'text-primary font-semibold' : 'text-foreground font-medium'}>{value || '—'}</span>
    </div>
  );

  const canNextStep = () => {
    if (step === 3) return !!agreementData.ownerName.trim();
    if (step === 4) return consent.acceptAgreement && consent.acceptTerms && consent.acceptPrivacy;
    if (step === 5) return canSign;
    return true;
  };

  const handleNext = () => {
    if (step === 5) handleSign();
    else if (step < 6) setStep(s => s + 1);
  };

  // ─── Build the "done" step data ────────────────────────
  const agreement = existingAgreement;
  const signedDate = agreement?.signed_at
    ? new Date(agreement.signed_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });

  const nextSteps = [
    { icon: Phone, title: 'Vi kontakter dig', desc: 'Inden for 24 timer ringer vi og planlægger det næste', time: '1-2 dage' },
    { icon: Home, title: 'Ejendomsgennemgang', desc: 'Vi kommer forbi og gennemgår det praktiske', time: '3-7 dage' },
    { icon: Globe, title: 'Din bolig går online', desc: 'Vi opretter og optimerer dine annoncer', time: '1-2 uger' },
    { icon: Calendar, title: 'Første bookinger', desc: 'Gæster finder dit hus — vi håndterer alt', time: '2-4 uger' },
  ];

  return (
    <OwnerLayout>
      <div className="max-w-4xl mx-auto">
        {step < 6 && <StepBar />}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>

            {/* ─── Step 1: Intro ──────────────────────────────────── */}
            {step === 1 && (
              <div className="max-w-xl mx-auto text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <FileSignature className="w-8 h-8 text-primary" />
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">Formidlingsaftale</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Gennemgå og underskriv din formidlingsaftale med SommerVibes. Det tager kun et par minutter.
                </p>
                <Card className="border-border/30 bg-card/30 text-left mb-8">
                  <CardContent className="p-5 space-y-1">
                    <InfoRow label="Aftaleversion" value={`v${AGREEMENT_VERSION}`} />
                    <InfoRow label="Dato" value={new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })} />
                    <InfoRow label="Ejer" value={agreementData.ownerName} />
                    <InfoRow label="Bolig" value={agreementData.propertyTitle || 'Ikke angivet'} />
                    <InfoRow label="Kommission" value="15%" highlight />
                    <InfoRow label="Binding" value="6 måneder" />
                  </CardContent>
                </Card>
                <div className="flex items-center gap-2 justify-center text-muted-foreground/60 text-xs">
                  <Lock className="w-3 h-3" /> Krypteret og sikker digital signering
                </div>
              </div>
            )}

            {/* ─── Step 2: Document Preview ────────────────────── */}
            {step === 2 && (
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">Forhåndsvisning af aftalen</h2>
                  <p className="text-muted-foreground text-sm">Din aftale med dine data indsat — gennemgå inden signering</p>
                </div>
                {missingFields.length > 0 && (
                  <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    <strong>Manglende felter:</strong> {missingFields.map(k => placeholderLabel(k)).join(', ')}
                    <span className="text-xs block mt-1 text-amber-600">Gå til næste trin for at udfylde.</span>
                  </div>
                )}
                <Card className="border-border/30 bg-white shadow-sm">
                  <CardContent className="p-6 md:p-10">
                    <div
                      className="prose prose-sm max-w-none 
                        [&_h1]:font-display [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mb-4
                        [&_h2]:font-display [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:mb-2
                        [&_p]:text-foreground/70 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-2
                        [&_.meta]:text-muted-foreground [&_.meta]:text-sm
                        [&_strong]:text-foreground
                        [&_.signature-block]:border-t [&_.signature-block]:border-border/30 [&_.signature-block]:mt-8 [&_.signature-block]:pt-6"
                      dangerouslySetInnerHTML={{ __html: renderedHtml }}
                    />
                  </CardContent>
                </Card>
                <div className="mt-4 text-center">
                  <button onClick={() => setShowFullDoc(!showFullDoc)} className="text-primary text-xs underline">
                    {showFullDoc ? 'Skjul variabel-overblik' : 'Vis alle indsatte variabler'}
                  </button>
                  {showFullDoc && (
                    <Card className="mt-3 border-border/30 bg-card/30 text-left">
                      <CardContent className="p-4 space-y-1">
                        {placeholders.map(k => (
                          <InfoRow key={k} label={placeholderLabel(k)} value={variables[k as keyof AgreementVariables] || '—'}
                            highlight={!variables[k as keyof AgreementVariables]?.trim()} />
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* ─── Step 3: Field Editor (INLINE — not a sub-component) ─── */}
            {step === 3 && (
              <div className="max-w-xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">Bekræft dine oplysninger</h2>
                  <p className="text-muted-foreground text-sm">Disse data indsættes i din aftale</p>
                </div>
                <Card className="border-border/30 bg-card/40 backdrop-blur-sm">
                  <CardContent className="p-5 md:p-7 space-y-4">
                    <div>
                      <Label className="text-foreground font-medium text-sm">Fulde navn *</Label>
                      <Input value={agreementData.ownerName}
                        onChange={e => setAgreementData(p => ({ ...p, ownerName: e.target.value }))}
                        className="mt-1.5 bg-background/50" />
                    </div>
                    <div>
                      <Label className="text-foreground font-medium text-sm">E-mail</Label>
                      <Input value={agreementData.ownerEmail}
                        onChange={e => setAgreementData(p => ({ ...p, ownerEmail: e.target.value }))}
                        className="mt-1.5 bg-background/50" />
                    </div>
                    <div>
                      <Label className="text-foreground font-medium text-sm">Telefon</Label>
                      <Input value={agreementData.ownerPhone}
                        onChange={e => setAgreementData(p => ({ ...p, ownerPhone: e.target.value }))}
                        className="mt-1.5 bg-background/50" />
                    </div>
                    <div>
                      <Label className="text-foreground font-medium text-sm">Adresse</Label>
                      <Input value={agreementData.ownerAddress}
                        onChange={e => setAgreementData(p => ({ ...p, ownerAddress: e.target.value }))}
                        className="mt-1.5 bg-background/50" />
                    </div>
                    <div className="border-t border-border/20 pt-4">
                      <Label className="text-foreground font-medium text-sm">Boligens adresse</Label>
                      <Input value={agreementData.propertyAddress}
                        onChange={e => setAgreementData(p => ({ ...p, propertyAddress: e.target.value }))}
                        className="mt-1.5 bg-background/50" />
                    </div>
                    <div>
                      <Label className="text-foreground font-medium text-sm">Region</Label>
                      <Input value={agreementData.propertyRegion}
                        onChange={e => setAgreementData(p => ({ ...p, propertyRegion: e.target.value }))}
                        className="mt-1.5 bg-background/50" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ─── Step 4: Confirm ────────────────────────────── */}
            {step === 4 && (
              <div className="max-w-xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">Bekræft vilkårene</h2>
                  <p className="text-muted-foreground text-sm">Accepter de relevante punkter for at gå videre</p>
                </div>
                <Card className="border-border/30 bg-card/30">
                  <CardContent className="p-5 space-y-4">
                    <div className="p-4 rounded-xl bg-muted/20 border border-border/20 space-y-1.5 mb-2">
                      <InfoRow label="Ejer" value={agreementData.ownerName} />
                      <InfoRow label="Bolig" value={agreementData.propertyTitle || `Bolig i ${agreementData.propertyRegion}`} />
                      <InfoRow label="Kommission" value="15%" highlight />
                      <InfoRow label="Binding" value="6 måneder" />
                    </div>
                    <div className="space-y-3 pt-2">
                      <label className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15 cursor-pointer">
                        <Checkbox checked={consent.acceptAgreement}
                          onCheckedChange={(c) => setConsent(p => ({ ...p, acceptAgreement: c === true }))} className="mt-0.5" />
                        <span className="text-sm text-foreground/80 leading-relaxed">
                          Jeg accepterer formidlingsaftalen med SommerVibes, herunder 15% kommission og 6 måneders binding. *
                        </span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox checked={consent.acceptTerms}
                          onCheckedChange={(c) => setConsent(p => ({ ...p, acceptTerms: c === true }))} className="mt-0.5" />
                        <span className="text-sm text-muted-foreground leading-relaxed">
                          Jeg accepterer <span className="text-primary underline" onClick={e => { e.preventDefault(); window.open('/terms', '_blank'); }}>handelsbetingelserne</span>. *
                        </span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox checked={consent.acceptPrivacy}
                          onCheckedChange={(c) => setConsent(p => ({ ...p, acceptPrivacy: c === true }))} className="mt-0.5" />
                        <span className="text-sm text-muted-foreground leading-relaxed">
                          Jeg har læst <span className="text-primary underline" onClick={e => { e.preventDefault(); window.open('/privacy', '_blank'); }}>privatlivspolitikken</span>. *
                        </span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox checked={consent.acceptMarketing}
                          onCheckedChange={(c) => setConsent(p => ({ ...p, acceptMarketing: c === true }))} className="mt-0.5" />
                        <span className="text-sm text-muted-foreground leading-relaxed">
                          Ja tak, jeg vil gerne modtage nyheder og tips (valgfrit)
                        </span>
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ─── Step 5: Sign ───────────────────────────────── */}
            {step === 5 && (
              <div className="max-w-lg mx-auto">
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <PenLine className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">Signer aftalen</h2>
                  <p className="text-muted-foreground text-sm">Tegn din underskrift og bekræft med dit navn</p>
                </div>
                <Card className="border-border/30 bg-card/30">
                  <CardContent className="p-5 space-y-5">
                    <div>
                      <Label className="text-foreground font-medium text-sm mb-2 block">Din håndskrevne underskrift *</Label>
                      <SignatureCanvas onSignatureChange={setSignatureDataUrl} />
                    </div>
                    <div>
                      <Label className="text-foreground font-medium text-sm">Bekræft med dit fulde navn *</Label>
                      <Input placeholder="Skriv dit fulde navn" value={signatureName}
                        onChange={e => setSignatureName(e.target.value)} className="mt-1.5 bg-background/50 h-12" />
                    </div>
                    <div className="text-center text-muted-foreground/50 text-xs space-y-0.5">
                      <p>Dato: {new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p>Aftaleversion: v{AGREEMENT_VERSION}</p>
                    </div>
                    <div className="flex items-center gap-2 justify-center text-muted-foreground/50 text-xs pt-2">
                      <Lock className="w-3 h-3" />
                      <span>Krypteret og sikker · IP-logget · Tidsstemplet</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ─── Step 6: Done ───────────────────────────────── */}
            {step === 6 && (
              <div className="max-w-2xl mx-auto text-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-accent" />
                  </div>
                  <h2 className="font-display text-3xl font-bold text-foreground mb-2">Aftalen er signeret</h2>
                  <p className="text-muted-foreground mb-6">Tak — vi glæder os til samarbejdet!</p>
                </motion.div>

                <Card className="border-border/30 bg-card/30 text-left mb-8">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FileSignature className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-foreground text-sm">Formidlingsaftale</span>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-accent/10 text-accent font-semibold uppercase tracking-wider">Signeret</span>
                    </div>
                    <div className="space-y-1.5">
                      <InfoRow label="Version" value={`v${agreement?.version || AGREEMENT_VERSION}`} />
                      <InfoRow label="Signeret af" value={agreement?.signature_name || signatureName} />
                      <InfoRow label="Dato" value={signedDate} />
                      <InfoRow label="Kommission" value={`${agreement?.commission_percent || 15}%`} highlight />
                      <InfoRow label="Binding" value={`${agreement?.binding_months || 6} måneder`} />
                    </div>
                    <div className="border-t border-border/20 mt-4 pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-muted-foreground/50 text-xs">
                        <Lock className="w-3 h-3" /> Arkiveret kopi
                      </div>
                      <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8"
                        onClick={handleDownloadPdf} disabled={generatingPdf}>
                        {generatingPdf ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        {generatingPdf ? 'Genererer...' : 'Download PDF'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="text-left mb-8">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-5 text-center">Hvad sker der nu?</h3>
                  {nextSteps.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }} className="flex gap-4 relative">
                        {i < nextSteps.length - 1 && <div className="absolute left-5 top-12 bottom-0 w-px bg-border/30" />}
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 z-10">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="pb-6">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-semibold text-foreground text-sm">{s.title}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{s.time}</span>
                          </div>
                          <p className="text-muted-foreground text-sm">{s.desc}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="gold" size="lg" className="gap-2" onClick={() => navigate('/owner')}>
                    Gå til ejerdashboard <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="lg" className="border-border gap-2 text-muted-foreground" onClick={() => navigate('/contact')}>
                    <Phone className="w-4 h-4" /> Kontakt os
                  </Button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
        {step < 6 && (
          <div className="flex items-center justify-between mt-8 max-w-2xl mx-auto">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}
              className="gap-2 h-11 px-5 border-border/50">
              <ArrowLeft className="h-4 w-4" /> Tilbage
            </Button>
            <span className="text-xs text-muted-foreground/50">Trin {step} af 5</span>
            <Button variant="gold" onClick={handleNext} disabled={!canNextStep() || isSubmitting}
              className="gap-2 h-11 px-7">
              {step === 5 ? (isSubmitting ? 'Signerer...' : 'Signer aftalen') : 'Næste'}
              {step < 5 && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
