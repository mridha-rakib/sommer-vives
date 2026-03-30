import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignatureCanvasProps {
  onSignatureChange: (dataUrl: string | null) => void;
  className?: string;
}

export function SignatureCanvas({ onSignatureChange, className }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return ctx;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;

    // Get CSS variable for primary color
    const style = getComputedStyle(document.documentElement);
    const primaryHsl = style.getPropertyValue('--primary').trim();
    ctx.strokeStyle = primaryHsl ? `hsl(${primaryHsl})` : '#1a1a1a';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (canvas) {
      onSignatureChange(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasSignature(false);
    onSignatureChange(null);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="relative rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-32 cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-muted-foreground/40 text-sm">Tegn din underskrift her</span>
          </div>
        )}
        {/* Signature line */}
        <div className="absolute bottom-4 left-8 right-8 border-b border-primary/20" />
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCanvas}
          className="text-muted-foreground gap-1.5 text-xs h-8"
          disabled={!hasSignature}
        >
          <Eraser className="w-3 h-3" /> Ryd
        </Button>
        {hasSignature && (
          <div className="flex items-center gap-1.5 text-accent text-xs font-medium">
            <Check className="w-3 h-3" /> Underskrift registreret
          </div>
        )}
      </div>
    </div>
  );
}
