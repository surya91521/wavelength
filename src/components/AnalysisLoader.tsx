import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

const phases = [
  "Reading your messages...",
  "Mapping emotional patterns...",
  "Analyzing response times...",
  "Finding shared language...",
  "Generating your Wavelength...",
];

interface AnalysisLoaderProps {
  onComplete: () => void;
}

export const AnalysisLoader = ({ onComplete }: AnalysisLoaderProps) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const phaseInterval = setInterval(() => {
      setCurrentPhase((prev) => {
        if (prev >= phases.length - 1) {
          clearInterval(phaseInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 1;
      });
    }, 60);

    return () => {
      clearInterval(phaseInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-coral via-rose to-amber rounded-full blur-3xl opacity-30 animate-pulse-slow" />
        <div className="relative animate-heartbeat">
          <Heart className="w-24 h-24 text-primary fill-primary" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-xl font-display font-medium text-foreground animate-pulse">
          {phases[currentPhase]}
        </p>
        <p className="text-sm text-muted-foreground">
          {Math.round(progress)}% complete
        </p>
      </div>

      <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-coral via-rose to-amber rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
