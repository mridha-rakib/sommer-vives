import { Button } from '@/components/ui/button';
import { Loader2, Save, Globe, RotateCcw } from 'lucide-react';

interface Props {
  visible: boolean;
  saving: boolean;
  publishing?: boolean;
  onSave: () => void;
  onPublish?: () => void;
  onDiscard?: () => void;
  hasDraft?: boolean;
}

export function StickyActionBar({ visible, saving, publishing, onSave, onPublish, onDiscard, hasDraft }: Props) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg animate-in slide-in-from-bottom-4 duration-200">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground hidden sm:block">Du har ugemte ændringer</p>
        <div className="flex items-center gap-2 ml-auto">
          {onDiscard && hasDraft && (
            <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving || publishing} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Kassér kladde
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onSave} disabled={saving || publishing} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Gem kladde
          </Button>
          {onPublish && (
            <Button size="sm" onClick={onPublish} disabled={saving || publishing} className="gap-2">
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              Udgiv live
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
