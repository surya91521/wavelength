import { Sparkles } from "lucide-react";

const sharedWords = [
  { word: "lowkey", startedBy: "them", adoptedDate: "March 2023" },
  { word: "slay", startedBy: "you", adoptedDate: "May 2023" },
  { word: "no cap", startedBy: "them", adoptedDate: "July 2023" },
  { word: "bestie", startedBy: "you", adoptedDate: "August 2023" },
  { word: "fr fr", startedBy: "them", adoptedDate: "October 2023" },
];

export const SlangConvergence = () => {
  return (
    <div className="glass rounded-2xl p-6 animate-slide-up-delay-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-amber" />
        <h3 className="font-display text-xl font-semibold">The Convergence</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Shared language patterns (a sign of deep bonding)
      </p>

      <div className="space-y-3">
        {sharedWords.map((item, index) => (
          <div
            key={item.word}
            className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-display font-semibold gradient-text">
                "{item.word}"
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                Started by {item.startedBy}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {item.adoptedDate}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-coral/10 via-rose/10 to-amber/10 rounded-xl border border-primary/20">
        <p className="text-sm text-center">
          <span className="text-foreground font-medium">Linguistic sync score:</span>
          <span className="text-2xl font-display font-bold gradient-text ml-2">87%</span>
        </p>
        <p className="text-xs text-muted-foreground text-center mt-1">
          Top 5% of analyzed relationships
        </p>
      </div>
    </div>
  );
};
