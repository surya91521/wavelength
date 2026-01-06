import { Button } from "@/components/ui/button";
import { Zap, Lock, FileText, TrendingUp } from "lucide-react";

export const DeepDiveCTA = () => {
  return (
    <div className="relative overflow-hidden rounded-3xl animate-slide-up">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-coral via-rose to-amber opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
      
      <div className="relative p-8 md:p-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm text-primary-foreground/90 mb-6">
            <Zap className="w-4 h-4" />
            Deep Dive Report
          </div>

          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Unlock the Full Story
          </h2>
          
          <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
            Get 50+ additional insights including attachment style analysis, 
            emotional peaks, and AI-powered relationship predictions.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: FileText, label: "PDF Report" },
              { icon: TrendingUp, label: "Trend Analysis" },
              { icon: Lock, label: "Private & Secure" },
              { icon: Zap, label: "AI Insights" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2 p-3 bg-white/10 rounded-xl">
                <item.icon className="w-5 h-5 text-primary-foreground" />
                <span className="text-xs text-primary-foreground/80">{item.label}</span>
              </div>
            ))}
          </div>

          <Button 
            size="xl" 
            className="bg-background text-foreground hover:bg-background/90 shadow-xl"
          >
            Get Deep Dive Report — $10
          </Button>

          <p className="text-xs text-primary-foreground/60 mt-4">
            One-time payment • Instant download • 100% satisfaction guarantee
          </p>
        </div>
      </div>
    </div>
  );
};
