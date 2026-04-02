import { useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronDown, Eye, EyeOff, GripVertical, ImageIcon, Plus, Sparkles, X } from 'lucide-react';

interface ContentBlockProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: string;
  visible?: boolean;
  onVisibilityChange?: (v: boolean) => void;
  draggable?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function StudioContentBlock({
  title, subtitle, icon, badge, visible = true, onVisibilityChange,
  draggable, collapsed, onToggleCollapse, children, className, actions,
}: ContentBlockProps) {
  return (
    <div className={cn(
      'rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-300',
      !visible && 'opacity-50',
      className
    )}>
      {/* Block header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30">
        {draggable && (
          <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab shrink-0" />
        )}
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
            {badge && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary">
                {badge}
              </Badge>
            )}
          </div>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          {onVisibilityChange && (
            <button
              onClick={() => onVisibilityChange(!visible)}
              className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors"
              title={visible ? 'Skjul sektion' : 'Vis sektion'}
            >
              {visible ? <Eye className="h-3.5 w-3.5 text-muted-foreground" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground/50" />}
            </button>
          )}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', collapsed && '-rotate-90')} />
            </button>
          )}
        </div>
      </div>

      {/* Block content */}
      {!collapsed && (
        <div className="p-5 space-y-4 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Field helpers for premium form fields ──
export function StudioField({ label, hint, children, className }: {
  label: string; hint?: string; children: ReactNode; className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-xs font-medium text-foreground/80 uppercase tracking-wider">{label}</label>
      {hint && <p className="text-[11px] text-muted-foreground -mt-0.5">{hint}</p>}
      {children}
    </div>
  );
}

export function StudioTextArea({ value, onChange, placeholder, rows = 3, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; className?: string;
}) {
  return (
    <Textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(
        'rounded-xl bg-background/50 border-border/50 focus:border-primary/40 focus:bg-background resize-none text-sm leading-relaxed',
        className
      )}
    />
  );
}

export function StudioInput({ value, onChange, placeholder, type = 'text', className }: {
  value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string;
}) {
  return (
    <Input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'rounded-xl bg-background/50 border-border/50 focus:border-primary/40 focus:bg-background text-sm h-10',
        className
      )}
    />
  );
}

// ── Bullet/highlight editor ──
export function StudioBulletEditor({ items, onChange, placeholder, maxItems = 10 }: {
  items: string[]; onChange: (items: string[]) => void; placeholder?: string; maxItems?: number;
}) {
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    if (newItem.trim() && items.length < maxItems) {
      onChange([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <Badge key={i} variant="secondary" className="gap-1 text-xs py-1 px-2.5 rounded-lg bg-primary/10 text-primary border-primary/20">
            {item}
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="ml-0.5 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
          placeholder={placeholder || 'Tilføj...'}
          className="flex-1 rounded-xl bg-background/50 border-border/50 text-sm h-9"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={addItem}
          disabled={!newItem.trim() || items.length >= maxItems}
          className="rounded-xl h-9 px-3"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── AI action button ──
export function StudioAIButton({ label, onClick, loading, className }: {
  label: string; onClick: () => void; loading?: boolean; className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={loading}
      className={cn(
        'gap-1.5 text-[11px] h-7 rounded-lg text-primary/70 hover:text-primary hover:bg-primary/10 font-medium',
        className
      )}
    >
      <Sparkles className="h-3 w-3" />
      {label}
    </Button>
  );
}
