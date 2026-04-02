import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { cn } from '@/lib/utils';
import {
  RefreshCw, CheckCircle2, AlertTriangle, Info, Shield, Pen,
  ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';

// ── Types ──

type FieldStatus = 'autofilled' | 'needs_approval' | 'missing' | 'platform_specific' | 'manual_override';

interface ChannelField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'tags';
  hint?: string;
  maxLength?: number;
  rows?: number;
  masterSource?: string; // description of where data comes from
  platformSpecific?: boolean;
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

  // Auto-fill from master data
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

      {/* Toggle details */}
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
              <div key={field.key} className="space-y-1.5">
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
