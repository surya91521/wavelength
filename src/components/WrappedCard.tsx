import { cn } from "@/lib/utils";
import { Download, Share2 } from "lucide-react";
import { useRef } from "react";
import html2canvas from 'html2canvas';

interface WrappedCardProps {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
  bgClass?: string;
  footerText?: string;
}

export const WrappedCard = ({ title, subtitle, className, children, bgClass = "bg-background", footerText }: WrappedCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (cardRef.current) {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
      });
      const link = document.createElement('a');
      link.download = `heartbeat-${title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        ref={cardRef}
        className={cn(
          "relative w-[300px] h-[533px] overflow-hidden rounded-[24px] shadow-2xl flex flex-col p-6 text-foreground border border-border/50",
          bgClass,
          className
        )}
      >
        {/* Background Texture/Gradient Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-noise opacity-[0.03]" />
        
        {/* Header */}
        <div className="relative z-10 mb-4">
          <div className="flex items-center gap-2 mb-1 opacity-80">
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Heartbeat Report 2026</span>
          </div>
          <h2 className="text-3xl font-display font-black leading-tight tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm opacity-70 mt-1 font-medium">{subtitle}</p>}
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
            {children}
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-auto pt-4 border-t border-current/10 flex justify-between items-end">
            <div>
                 <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Copyright © 2026</p>
                 <p className="text-sm font-display font-bold">S Suryanarayanan</p>
            </div>
            {footerText && <p className="text-[10px] opacity-60 max-w-[50%] text-right">{footerText}</p>}
        </div>
      </div>

      <button 
        onClick={handleDownload}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-foreground/5 hovering:bg-foreground/10 rounded-full transition-colors"
      >
        <Download className="w-4 h-4" />
        Save Image
      </button>
    </div>
  );
};
