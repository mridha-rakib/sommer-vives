import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { cn } from '@/lib/utils';
import {
  RefreshCw, CheckCircle2, AlertTriangle, Info, Shield, Pen,
  ChevronDown, ChevronUp, Sparkles, ArrowRight, CircleAlert, Lightbulb,
  Copy, Check, ExternalLink, Eye, EyeOff
} from 'lucide-react';

// ── Types ──
type FieldStatus = 'autofilled' | 'needs_approval' | 'missing' | 'platform_specific' | 'manual_override';

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

// ── Readiness Ring (compact) ──
function ChannelReadinessRing({ score, size = 56 }: { score: number; size?: number }) {
  const strokeWidth = 3;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const color = score >= 80 ? 'hsl(142, 71%, 45%)' : score >= 50 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 84%, 60%)';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} opacity={0.3} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${(score / 100) * c} ${c}`} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-foreground">{score}%</span>
      </div>
    </div>
  );
}

// ── Channel header info ──
const CHANNEL_INFO: Record<string, { color: string; desc: string }> = {
  airbnb: { color: 'hsl(353, 77%, 56%)', desc: 'Airbnb-optimeret titel, beskrivelse og highlights' },
  booking: { color: 'hsl(220, 80%, 50%)', desc: 'Booking.com-format med værelsesopsætning og politikker' },
  vrbo: { color: 'hsl(200, 65%, 45%)', desc: 'Vrbo-tilpasset beskrivelse og highlights' },
};

export function ChannelDataSection({
  channelName, channelKey, emoji, fields, listing, onUpdate,
  onAiFill, aiFilling, readinessScore, readinessPassed, readinessMissing,
}: ChannelDataSectionProps) {
  const [overrides, setOverrides] = useState<Set<string>>(new Set());
  const [autofilledFields, setAutofilledFields] = useState<Set<string>>(new Set());
  const [pendingApproval, setPendingApproval] = useState<Set<string>>(new Set());
  const [approved, setApproved] = useState(!!listing[`channel_${channelKey}_ready`]);
  const [editingField, setEditingField] = useState<string | null>(null);

  const info = CHANNEL_INFO[channelKey] || CHANNEL_INFO.airbnb;

  const getFieldStatus = (field: ChannelField): FieldStatus => {
    const channelValue = listing[field.key];
    const hasValue = Array.isArray(channelValue) ? channelValue.length > 0 : !!channelValue?.toString().trim();
    if (!hasValue) return field.platformSpecific ? 'platform_specific' : 'missing';
    if (overrides.has(field.key)) return 'manual_override';
    if (pendingApproval.has(field.key)) return 'needs_approval';
    return 'autofilled';
  };

  const stats = useMemo(() => {
    let filled = 0, missing = 0, pending = 0;
    fields.forEach(f => {
      const s = getFieldStatus(f);
      if (s === 'autofilled' || s === 'manual_override') filled++;
      else if (s === 'missing' || s === 'platform_specific') missing++;
      if (s === 'needs_approval') pending++;
    });
    return { filled, missing, pending, total: fields.length };
  }, [fields, listing, overrides, autofilledFields, pendingApproval]);

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

  const handleApproveAll = () => {
    setPendingApproval(new Set());
    setApproved(true);
    onUpdate(`channel_${channelKey}_ready`, true);
  };

  const handleFieldChange = (field: ChannelField, value: any) => {
    const newOverrides = new Set(overrides);
    newOverrides.add(field.key);
    setOverrides(newOverrides);
    const newPending = new Set(pendingApproval);
    newPending.delete(field.key);
    setPendingApproval(newPending);
    onUpdate(field.key, value);
  };

  const missingFields = fields.filter(f => getFieldStatus(f) === 'missing' || getFieldStatus(f) === 'platform_specific');
  const filledFields = fields.filter(f => getFieldStatus(f) !== 'missing' && getFieldStatus(f) !== 'platform_specific');

  return (
    <div className="space-y-5">
      {/* ═══ HERO SUMMARY CARD ═══ */}
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-5">
            {/* Readiness ring */}
            <ChannelReadinessRing score={readinessScore} />

            {/* Summary */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{emoji}</span>
                <h2 className="text-lg font-bold text-foreground">{channelName}</h2>
                {approved && <StatusChip label="Godkendt" variant="success" dot size="sm" />}
              </div>
              <p className="text-xs text-muted-foreground mb-3">{info.desc}</p>

              {/* Coverage bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(stats.filled / stats.total) * 100}%`,
                      background: readinessScore >= 80
                        ? 'linear-gradient(90deg, hsl(142, 71%, 45%), hsl(162, 63%, 46%))'
                        : readinessScore >= 50
                          ? 'linear-gradient(90deg, hsl(38, 92%, 50%), hsl(48, 96%, 53%))'
                          : 'linear-gradient(90deg, hsl(0, 84%, 60%), hsl(20, 94%, 64%))'
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium tabular-nums">{stats.filled}/{stats.total} felter</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 shrink-0">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 rounded-xl" onClick={handleAutoFill}>
                <RefreshCw className="h-3 w-3" /> Auto-udfyld
              </Button>
              {onAiFill && (
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 rounded-xl" onClick={onAiFill} disabled={aiFilling}>
                  <Sparkles className="h-3 w-3" /> {aiFilling ? 'Genererer...' : 'AI-optimér'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Approval banner */}
        {stats.pending > 0 && (
          <div className="px-6 py-3 border-t border-amber-500/15 bg-amber-500/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium text-amber-600">{stats.pending} felter afventer din godkendelse</span>
            </div>
            <Button size="sm" className="text-xs h-7 gap-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white" onClick={handleApproveAll}>
              <CheckCircle2 className="h-3 w-3" /> Godkend alle
            </Button>
          </div>
        )}

        {/* All ready banner */}
        {stats.missing === 0 && readinessScore >= 80 && stats.pending === 0 && (
          <div className="px-6 py-3 border-t border-emerald-500/15 bg-emerald-500/5 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-semibold" style={{ color: 'hsl(142, 71%, 45%)' }}>{channelName} er klar til publicering</span>
          </div>
        )}
      </div>

      {/* ═══ MISSING FIELDS - COMPACT ACTION LIST ═══ */}
      {missingFields.length > 0 && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] overflow-hidden">
          <div className="px-5 py-3 flex items-center gap-2 border-b border-destructive/10">
            <CircleAlert className="h-4 w-4 text-destructive" />
            <span className="text-sm font-semibold text-foreground">Mangler før klar</span>
            <span className="ml-auto text-[10px] font-bold tabular-nums rounded-full bg-destructive/10 text-destructive px-2 py-0.5">
              {missingFields.length}
            </span>
          </div>
          <div className="divide-y divide-border/20">
            {missingFields.map(field => {
              const masterVal = field.getMasterValue();
              const canAutoFill = !!masterVal;
              return (
                <div key={field.key} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-foreground">{field.label}</span>
                    {field.masterSource && canAutoFill && (
                      <span className="text-[10px] text-muted-foreground ml-2">← {field.masterSource}</span>
                    )}
                    {field.platformSpecific && (
                      <span className="text-[10px] text-primary ml-2">Platform-specifikt</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {canAutoFill && (
                      <Button size="sm" variant="outline" className="text-[10px] h-6 px-2 gap-1 rounded-lg"
                        onClick={() => {
                          onUpdate(field.key, masterVal);
                          setAutofilledFields(prev => new Set([...prev, field.key]));
                          setPendingApproval(prev => new Set([...prev, field.key]));
                        }}>
                        <Copy className="h-2.5 w-2.5" /> Hent
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-[10px] h-6 px-2 gap-1 rounded-lg text-muted-foreground"
                      onClick={() => setEditingField(editingField === field.key ? null : field.key)}>
                      <Pen className="h-2.5 w-2.5" /> Skriv
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ FIELD REVIEW CARDS ═══ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Feltoversigt</span>
        </div>

        {fields.map(field => {
          const status = getFieldStatus(field);
          const value = listing[field.key];
          const hasValue = Array.isArray(value) ? value.length > 0 : !!value?.toString().trim();
          const isEditing = editingField === field.key;
          const isPending = pendingApproval.has(field.key);

          return (
            <div key={field.key}
              className={cn(
                'rounded-xl border transition-all',
                isEditing
                  ? 'border-primary/30 bg-primary/[0.02] shadow-sm'
                  : isPending
                    ? 'border-amber-500/25 bg-amber-500/[0.02]'
                    : !hasValue
                      ? 'border-destructive/15 bg-destructive/[0.02]'
                      : 'border-border/30 bg-card/50'
              )}
            >
              {/* Field header row */}
              <div className="px-4 py-3 flex items-center gap-3">
                {/* Status icon */}
                <div className={cn(
                  'w-6 h-6 rounded-lg flex items-center justify-center shrink-0',
                  status === 'autofilled' || status === 'manual_override'
                    ? 'bg-emerald-500/10'
                    : status === 'needs_approval'
                      ? 'bg-amber-500/10'
                      : 'bg-destructive/10'
                )}>
                  {status === 'autofilled' || status === 'manual_override'
                    ? <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    : status === 'needs_approval'
                      ? <Shield className="h-3 w-3 text-amber-500" />
                      : <CircleAlert className="h-3 w-3 text-destructive" />
                  }
                </div>

                {/* Label & source */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{field.label}</span>
                    {field.maxLength && hasValue && !Array.isArray(value) && (
                      <span className="text-[9px] text-muted-foreground tabular-nums">{value.length}/{field.maxLength}</span>
                    )}
                  </div>
                  {field.masterSource && !isEditing && (
                    <span className="text-[10px] text-muted-foreground/60">Kilde: {field.masterSource}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {isPending && (
                    <Button size="sm" variant="ghost" className="text-[10px] h-6 px-2 gap-1 rounded-lg text-amber-600 hover:bg-amber-500/10"
                      onClick={() => {
                        const next = new Set(pendingApproval);
                        next.delete(field.key);
                        setPendingApproval(next);
                      }}>
                      <Check className="h-2.5 w-2.5" /> Godkend
                    </Button>
                  )}
                  <Button size="sm" variant="ghost"
                    className={cn('text-[10px] h-6 px-2 gap-1 rounded-lg', isEditing ? 'text-primary' : 'text-muted-foreground')}
                    onClick={() => setEditingField(isEditing ? null : field.key)}>
                    {isEditing ? <EyeOff className="h-2.5 w-2.5" /> : <Pen className="h-2.5 w-2.5" />}
                    {isEditing ? 'Luk' : 'Redigér'}
                  </Button>
                </div>
              </div>

              {/* Preview value (when not editing) */}
              {!isEditing && hasValue && (
                <div className="px-4 pb-3 -mt-1">
                  {field.type === 'tags' && Array.isArray(value) ? (
                    <div className="flex flex-wrap gap-1.5">
                      {value.map((tag: string, i: number) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted/50 text-[10px] font-medium text-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{value}</p>
                  )}
                </div>
              )}

              {/* Empty state */}
              {!isEditing && !hasValue && (
                <div className="px-4 pb-3 -mt-1">
                  <p className="text-[11px] text-muted-foreground/50 italic">
                    {field.platformSpecific ? 'Platform-specifikt felt – udfyldes manuelt' : 'Ingen data endnu'}
                  </p>
                </div>
              )}

              {/* Edit mode */}
              {isEditing && (
                <div className="px-4 pb-4 space-y-2">
                  {field.type === 'text' && (
                    <Input
                      value={value || ''}
                      onChange={e => handleFieldChange(field, e.target.value)}
                      placeholder={field.hint || ''}
                      maxLength={field.maxLength}
                      className="h-9 text-sm rounded-xl bg-background/60 border-border/40"
                      autoFocus
                    />
                  )}
                  {field.type === 'textarea' && (
                    <Textarea
                      value={value || ''}
                      onChange={e => handleFieldChange(field, e.target.value)}
                      rows={field.rows || 3}
                      placeholder={field.hint || ''}
                      className="text-sm rounded-xl bg-background/60 border-border/40"
                      autoFocus
                    />
                  )}
                  {field.type === 'tags' && (
                    <Input
                      value={(Array.isArray(value) ? value : []).join(', ')}
                      onChange={e => handleFieldChange(field, e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                      placeholder={field.hint || 'Komma-separeret'}
                      className="h-9 text-sm rounded-xl bg-background/60 border-border/40"
                      autoFocus
                    />
                  )}
                  {field.hint && <p className="text-[10px] text-muted-foreground/60">{field.hint}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ BOTTOM APPROVE BAR ═══ */}
      {!approved && stats.filled > 0 && (
        <div className="rounded-2xl border border-border/30 bg-card/80 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-foreground">Godkend {channelName}-data</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Markér kanaldata som gennemgået og klar til distribution</p>
          </div>
          <Button size="sm" className="gap-1.5 rounded-xl text-xs" onClick={handleApproveAll}
            disabled={stats.missing > 0}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Godkend og markér klar
          </Button>
        </div>
      )}
    </div>
  );
}
