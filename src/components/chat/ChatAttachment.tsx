import { FileText } from 'lucide-react';
import { formatAttachmentSize } from '@/lib/chatAttachments';

interface ChatAttachmentProps {
  url?: string | null;
  name?: string | null;
  size?: number | null;
  isOwn?: boolean;
}

export function ChatAttachment({ url, name, size, isOwn }: ChatAttachmentProps) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-2 flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-colors ${
        isOwn
          ? 'border-current/20 bg-background/10 hover:bg-background/20'
          : 'border-border/40 bg-background/40 hover:bg-background/60'
      }`}
    >
      <FileText className="w-3.5 h-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{name || 'Vedhæftet fil'}</span>
      {size ? <span className="shrink-0 opacity-70">{formatAttachmentSize(size)}</span> : null}
    </a>
  );
}
