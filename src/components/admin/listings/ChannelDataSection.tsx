import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { cn } from '@/lib/utils';
import {
  RefreshCw, CheckCircle2, AlertTriangle, Info, Shield, Pen,
  ChevronDown, ChevronUp, Sparkles, ArrowRight, CircleAlert, Lightbulb
} from 'lucide-react';

// ── Types ──

type FieldStatus = 'autofilled' | 'needs_approval' | 'missing' | 'platform_specific' | 'manual_override';

type ValidationSeverity = 'missing' | 'weak' | 'platform_mismatch' | 'manual_needed';

interface ValidationIssue {
  fieldKey: string;
  fieldLabel: string;
  severity: ValidationSeverity;
  message: string;
  suggestion?: string;
  canAutoFill: boolean;
}

interface ChannelField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'tags';
  hint?: string;
  maxLength?: number;
  minLength?: number;
  rows?: number;
  masterSource?: string;
  platformSpecific?: boolean;
  required?: boolean;
  getMasterValue: () => string | string[] | null;
}

interface ChannelDataSectionProps {
  channelName: string;
  channelKey: 'airbnb' | 'booking' | 'vrbo';
  emoji: string;
  fields: ChannelField[];
  listing: Record<string, any>;
  onUpdate: (key: string, value: any) => void;
  onAiFill?: () => void;
  aiFilling?: boolean;
  readinessScore: number;
  readinessPassed: string[];
  readinessMissing: { field: string }[];
}

const STATUS_CONFIG: Record<FieldStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'muted'; icon: typeof CheckCircle2 }> = {
  autofilled: { label: 'Auto-udfyldt', variant: 'success', icon: CheckCircle2 },
  needs_approval: { label: 'Kræver godkendelse', variant: 'warning', icon: AlertTriangle },
  missing: { label: 'Mangler data', variant: 'danger', icon: AlertTriangle },
  platform_specific: { label: 'Platform-specifikt', variant: 'info', icon: Info },
  manual_override: { label: 'Manuel override', variant: 'muted', icon: Pen },
};

function ReadinessBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-destructive';
  return (
    <div className="flex items-center gap-2 flex-1 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn('text-xs font-bold tabular-nums', score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-400' : 'text-destructive')}>{score}%</span>
    </div>
  );
}

export function ChannelDataSection({
  channelName, channelKey, emoji, fields, listing, onUpdate,
  onAiFill, aiFilling, readinessScore, readinessPassed, readinessMissing,
}: ChannelDataSectionProps) {
  // Track which fields have been manually overridden vs auto-filled
  const [overrides, setOverrides] = useState<Set<string>>(new Set());
  const [autofilledFields, setAutofilledFields] = useState<Set<string>>(new Set());
  const [pendingApproval, setPendingApproval] = useState<Set<string>>(new Set());
  const [approved, setApproved] = useState(!!listing[`channel_${channelKey}_ready`]);
  const [showDetails, setShowDetails] = useState(true);
  const [showValidation, setShowValidation] = useState(true);
  const [focusField, setFocusField] = useState<string | null>(null);

  // Determine field status
  const getFieldStatus = (field: ChannelField): FieldStatus => {
    const channelValue = listing[field.key];
    const hasValue = Array.isArray(channelValue) ? channelValue.length > 0 : !!channelValue?.toString().trim();

    if (!hasValue) {
      return field.platformSpecific ? 'platform_specific' : 'missing';
    }
    if (overrides.has(field.key)) return 'manual_override';
    if (pendingApproval.has(field.key)) return 'needs_approval';
    if (autofilledFields.has(field.key)) return 'autofilled';
    return 'autofilled'; // existing data treated as autofilled
  };

  // Stats
  const stats = useMemo(() => {
    let autofilled = 0, missing = 0, needsApproval = 0, platformSpecific = 0, overridden = 0;
    fields.forEach(f => {
      const s = getFieldStatus(f);
      if (s === 'autofilled') autofilled++;
      else if (s === 'missing') missing++;
      else if (s === 'needs_approval') needsApproval++;
      else if (s === 'platform_specific') platformSpecific++;
      else if (s === 'manual_override') overridden++;
    });
    return { autofilled, missing, needsApproval, platformSpecific, overridden, total: fields.length };
  }, [fields, listing, overrides, autofilledFields, pendingApproval]);

  // Validation issues
  const validationIssues = useMemo<ValidationIssue[]>(() => {
    const issues: ValidationIssue[] = [];
    const MIN_LENGTHS: Record<string, number> = {
      title: 10, description: 50, highlights: 0, tags: 0,
    };

    fields.forEach(field => {
      const value = listing[field.key];
      const masterVal = field.getMasterValue();
      const hasValue = Array.isArray(value) ? value.length > 0 : !!value?.toString().trim();
      const strLen = Array.isArray(value) ? value.length : (value?.toString().trim().length || 0);
      const minLen = field.minLength || (field.type === 'textarea' ? 30 : field.type === 'text' ? 5 : 0);

      if (!hasValue) {
        if (field.platformSpecific) {
          issues.push({
            fieldKey: field.key, fieldLabel: field.label,
            severity: 'manual_needed',
            message: `${field.label} er påkrævet af ${channelName} og skal udfyldes manuelt`,
            suggestion: field.hint || undefined,
            canAutoFill: false,
          });
        } else {
          issues.push({
            fieldKey: field.key, fieldLabel: field.label,
            severity: 'missing',
            message: `${field.label} mangler helt`,
            suggestion: masterVal
              ? `Kan udfyldes automatisk fra ${field.masterSource || 'SommerVibes masterdata'}`
              : 'Ingen masterdata tilgængelig – skal udfyldes manuelt',
            canAutoFill: !!masterVal,
          });
        }
      } else if (field.type !== 'tags' && strLen < minLen) {
        issues.push({
          fieldKey: field.key, fieldLabel: field.label,
          severity: 'weak',
          message: `${field.label} er for kort (${strLen} tegn – anbefalet min. ${minLen})`,
          suggestion: `Udvid indholdet for bedre synlighed på ${channelName}`,
          canAutoFill: false,
        });
      } else if (field.type === 'tags' && Array.isArray(value) && value.length < 2) {
        issues.push({
          fieldKey: field.key, fieldLabel: field.label,
          severity: 'weak',
          message: `Kun ${value.length} highlight – anbefalet mindst 3`,
          suggestion: masterVal && Array.isArray(masterVal) && masterVal.length > value.length
            ? `${(masterVal as string[]).length} tilgængelige fra masterdata`
            : undefined,
          canAutoFill: !!(masterVal && Array.isArray(masterVal) && masterVal.length > (value as string[]).length),
        });
      }

      // Check max length compliance
      if (field.maxLength && !Array.isArray(value) && strLen > field.maxLength) {
        issues.push({
          fieldKey: field.key, fieldLabel: field.label,
          severity: 'platform_mismatch',
          message: `${field.label} overskrider ${channelName}-grænsen (${strLen}/${field.maxLength} tegn)`,
          suggestion: `Forkort teksten til max ${field.maxLength} tegn`,
          canAutoFill: false,
        });
      }
    });

    return issues;
  }, [fields, listing, channelName]);

  const handleScrollToField = (fieldKey: string) => {
    setShowDetails(true);
    setFocusField(fieldKey);
    setTimeout(() => {
      const el = document.getElementById(`field-${channelKey}-${fieldKey}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.querySelector('input,textarea')?.dispatchEvent(new Event('focus'));
      setFocusField(null);
    }, 150);
  };


  const handleAutoFill = () => {
    const newAutofilled = new Set(autofilledFields);
    const newPending = new Set(pendingApproval);

    fields.forEach(field => {
      if (field.platformSpecific) return;
      const masterVal = field.getMasterValue();
      if (!masterVal) return;
      const hasEmpty = Array.isArray(listing[field.key])
        ? (listing[field.key] || []).length === 0
        : !listing[field.key]?.toString().trim();

      if (hasEmpty || !overrides.has(field.key)) {
        onUpdate(field.key, masterVal);
        newAutofilled.add(field.key);
        newPending.add(field.key);
      }
    });

    setAutofilledFields(newAutofilled);
    setPendingApproval(newPending);
  };

  // Approve all pending
  const handleApproveAll = () => {
    setPendingApproval(new Set());
    setApproved(true);
    onUpdate(`channel_${channelKey}_ready`, true);
  };

  // Handle manual edit
  const handleFieldChange = (field: ChannelField, value: any) => {
    const newOverrides = new Set(overrides);
    newOverrides.add(field.key);
    setOverrides(newOverrides);

    const newPending = new Set(pendingApproval);
    newPending.delete(field.key);
    setPendingApproval(newPending);

    onUpdate(field.key, value);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header with readiness */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{emoji}</span>
            <h3 className="font-display text-base font-semibold text-foreground">{channelName}</h3>
            {approved && (
              <StatusChip label="Godkendt" variant="success" dot size="sm" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={handleAutoFill}
            >
              <RefreshCw className="h-3 w-3" />
              Auto-udfyld fra SV
            </Button>
            {onAiFill && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={onAiFill}
                disabled={aiFilling}
              >
                <Sparkles className="h-3 w-3" />
                {aiFilling ? 'Genererer...' : 'AI-optimér'}
              </Button>
            )}
          </div>
        </div>

        {/* Readiness bar + stats */}
        <div className="flex items-center gap-4 flex-wrap">
          <ReadinessBar score={readinessScore} />
          <div className="flex items-center gap-3 text-[10px] font-medium">
            {stats.autofilled > 0 && (
              <span className="flex items-center gap-1 text-emerald-500">
                <CheckCircle2 className="h-3 w-3" />{stats.autofilled} udfyldt
              </span>
            )}
            {stats.missing > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3" />{stats.missing} mangler
              </span>
            )}
            {stats.needsApproval > 0 && (
              <span className="flex items-center gap-1 text-amber-500">
                <Shield className="h-3 w-3" />{stats.needsApproval} afventer
              </span>
            )}
            {stats.platformSpecific > 0 && (
              <span className="flex items-center gap-1 text-primary">
                <Info className="h-3 w-3" />{stats.platformSpecific} platform-spec.
              </span>
            )}
          </div>
        </div>

        {/* Approval banner */}
        {stats.needsApproval > 0 && (
          <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium text-amber-600">{stats.needsApproval} felter afventer din godkendelse</span>
            </div>
            <Button size="sm" variant="outline" className="text-xs h-7 gap-1 border-amber-500/30 text-amber-600 hover:bg-amber-500/10" onClick={handleApproveAll}>
              <CheckCircle2 className="h-3 w-3" /> Godkend alle
            </Button>
          </div>
        )}
      </div>

      {/* ── Mangler før klar ── */}
      {validationIssues.length > 0 && (
        <div className="border-b border-border/50">
          <button
            onClick={() => setShowValidation(!showValidation)}
            className="w-full px-5 py-3 flex items-center justify-between hover:bg-muted/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold text-foreground">Mangler før klar</span>
              <span className="text-[10px] font-bold tabular-nums rounded-full bg-destructive/10 text-destructive px-2 py-0.5">
                {validationIssues.length}
              </span>
            </div>
            {showValidation ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>

          {showValidation && (
            <div className="px-5 pb-4 space-y-2">
              {validationIssues.map((issue) => {
                const severityCfg: Record<ValidationSeverity, { icon: typeof AlertTriangle; color: string; bgColor: string; label: string }> = {
                  missing: { icon: CircleAlert, color: 'text-destructive', bgColor: 'bg-destructive/5 border-destructive/15', label: 'Mangler' },
                  weak: { icon: AlertTriangle, color: 'text-amber-500', bgColor: 'bg-amber-500/5 border-amber-500/15', label: 'Svag' },
                  platform_mismatch: { icon: Info, color: 'text-primary', bgColor: 'bg-primary/5 border-primary/15', label: 'Platform-krav' },
                  manual_needed: { icon: Pen, color: 'text-muted-foreground', bgColor: 'bg-muted/50 border-border', label: 'Manuel input' },
                };
                const cfg = severityCfg[issue.severity];
                const Icon = cfg.icon;

                return (
                  <div key={issue.fieldKey + issue.severity} className={cn('rounded-lg border p-3 flex items-start gap-3', cfg.bgColor)}>
                    <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', cfg.color)} />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground">{issue.fieldLabel}</span>
                        <span className={cn('text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded', cfg.color)}>{cfg.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{issue.message}</p>
                      {issue.suggestion && (
                        <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                          <Lightbulb className="h-3 w-3 shrink-0" /> {issue.suggestion}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {issue.canAutoFill && (
                        <Button
                          size="sm" variant="outline"
                          className="text-[10px] h-6 px-2 gap-1"
                          onClick={() => {
                            const field = fields.find(f => f.key === issue.fieldKey);
                            if (field) {
                              const val = field.getMasterValue();
                              if (val) onUpdate(field.key, val);
                            }
                          }}
                        >
                          <RefreshCw className="h-2.5 w-2.5" /> Auto-udfyld
                        </Button>
                      )}
                      <Button
                        size="sm" variant="ghost"
                        className="text-[10px] h-6 px-2 gap-1 text-muted-foreground"
                        onClick={() => handleScrollToField(issue.fieldKey)}
                      >
                        <ArrowRight className="h-2.5 w-2.5" /> Gå til felt
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Ready state */}
      {validationIssues.length === 0 && readinessScore >= 80 && (
        <div className="px-5 py-3 border-b border-border/50 flex items-center gap-2 bg-emerald-500/5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-semibold text-emerald-600">{channelName} er klar til publicering</span>
        </div>
      )}

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full px-5 py-2 flex items-center justify-between text-xs text-muted-foreground hover:bg-muted/10 transition-colors border-b border-border/30"
      >
        <span className="font-medium">{showDetails ? 'Skjul felter' : 'Vis felter'} ({fields.length})</span>
        {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {/* Fields */}
      {showDetails && (
        <div className="p-5 space-y-4">
          {fields.map(field => {
            const status = getFieldStatus(field);
            const statusCfg = STATUS_CONFIG[status];
            const StatusIcon = statusCfg.icon;
            const value = listing[field.key];

            return (
              <div key={field.key} id={`field-${channelKey}-${field.key}`} className={cn('space-y-1.5 rounded-lg transition-all', focusField === field.key && 'ring-2 ring-primary/30 bg-primary/5 p-3 -m-1.5')}>
                {/* Label row with status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">{field.label}</Label>
                    <StatusChip
                      label={statusCfg.label}
                      variant={statusCfg.variant}
                      size="sm"
                      className="text-[9px] px-1.5 py-0"
                    />
                  </div>
                  {field.masterSource && status !== 'manual_override' && (
                    <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                      <RefreshCw className="h-2.5 w-2.5" /> {field.masterSource}
                    </span>
                  )}
                  {status === 'manual_override' && (
                    <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                      <Pen className="h-2.5 w-2.5" /> Manuelt tilpasset
                    </span>
                  )}
                </div>

                {/* Input */}
                {field.type === 'text' && (
                  <>
                    <Input
                      value={value || ''}
                      onChange={e => handleFieldChange(field, e.target.value)}
                      placeholder={field.hint || ''}
                      maxLength={field.maxLength}
                      className={cn(
                        'h-9 text-sm',
                        pendingApproval.has(field.key) && 'border-amber-500/40 bg-amber-500/5',
                      )}
                    />
                    {field.maxLength && (
                      <div className="text-[10px] text-muted-foreground text-right">{(value || '').length}/{field.maxLength}</div>
                    )}
                  </>
                )}

                {field.type === 'textarea' && (
                  <Textarea
                    value={value || ''}
                    onChange={e => handleFieldChange(field, e.target.value)}
                    rows={field.rows || 3}
                    placeholder={field.hint || ''}
                    className={cn(
                      'text-sm',
                      pendingApproval.has(field.key) && 'border-amber-500/40 bg-amber-500/5',
                    )}
                  />
                )}

                {field.type === 'tags' && (
                  <Input
                    value={(Array.isArray(value) ? value : []).join(', ')}
                    onChange={e => handleFieldChange(field, e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                    placeholder={field.hint || 'Komma-separeret'}
                    className={cn(
                      'h-9 text-sm',
                      pendingApproval.has(field.key) && 'border-amber-500/40 bg-amber-500/5',
                    )}
                  />
                )}

                {field.hint && field.type !== 'text' && (
                  <p className="text-[11px] text-muted-foreground/70">{field.hint}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
