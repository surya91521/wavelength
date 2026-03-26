import { useEffect, useState, useRef } from "react";
import { Share2 } from "lucide-react";
import { shareImage, captureElement } from "@/lib/shareUtils";
import type { WavelengthScoreResult } from "@/lib/types";

interface WavelengthScoreProps {
  score: WavelengthScoreResult;
  participants: string[];
  totalMessages: number;
}

export const WavelengthScore = ({ score, participants, totalMessages }: WavelengthScoreProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame: number;
    const duration = 1500;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score.score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score.score]);

  const circumference = 2 * Math.PI * 90; // radius 90
  const offset = circumference - (animatedScore / 100) * circumference;

  const getGradientColors = () => {
    if (score.score >= 90) return { from: '#22c55e', to: '#10b981' }; // green
    if (score.score >= 75) return { from: '#3b82f6', to: '#6366f1' }; // blue-indigo
    if (score.score >= 60) return { from: '#8b5cf6', to: '#a855f7' }; // purple
    if (score.score >= 40) return { from: '#f59e0b', to: '#f97316' }; // amber-orange
    return { from: '#ef4444', to: '#dc2626' }; // red
  };

  const colors = getGradientColors();

  const handleShare = async () => {
    if (!cardRef.current) return;
    const blob = await captureElement(cardRef.current);
    await shareImage(blob, undefined, 'wavelength-score.png');
  };

  return (
    <div className="text-center animate-slide-up">
      <div
        ref={cardRef}
        className="inline-block p-8 md:p-12 rounded-3xl bg-gradient-to-br from-background to-muted/30 border border-border/50"
      >
        {/* SVG Gauge */}
        <div className="relative w-52 h-52 mx-auto mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.from} />
                <stop offset="100%" stopColor={colors.to} />
              </linearGradient>
            </defs>
            {/* Background circle */}
            <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
            {/* Score arc */}
            <circle
              cx="100" cy="100" r="90" fill="none"
              stroke="url(#scoreGradient)" strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-black font-display">{animatedScore}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">/ 100</span>
          </div>
        </div>

        {/* Tier */}
        <h3 className="text-2xl font-display font-black gradient-text mb-2">{score.tier}</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-1">{score.description}</p>

        {/* Participants */}
        <div className="flex gap-2 justify-center mt-4 flex-wrap">
          {participants.slice(0, 4).map(p => (
            <span key={p} className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary truncate max-w-[100px]">
              {p}
            </span>
          ))}
          {participants.length > 4 && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted">
              +{participants.length - 4}
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          Based on {totalMessages.toLocaleString()} messages
        </p>
      </div>

      {/* Share button */}
      <div className="mt-4">
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share Your Score
        </button>
      </div>
    </div>
  );
};
