import { TrendingUp, MessageCircle, Clock } from "lucide-react";

export const PowerDynamic = () => {
  const youPercent = 62;
  const themPercent = 38;

  return (
    <div className="glass rounded-2xl p-6 animate-slide-up-delay-1">
      <h3 className="font-display text-xl font-semibold mb-2">The Power Dynamic</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Who puts in more effort?
      </p>

      <div className="space-y-6">
        {/* Effort Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-coral font-medium">You: {youPercent}%</span>
            <span className="text-rose font-medium">Them: {themPercent}%</span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden flex">
            <div 
              className="bg-gradient-to-r from-coral to-coral/80 transition-all duration-1000"
              style={{ width: `${youPercent}%` }}
            />
            <div 
              className="bg-gradient-to-r from-rose/80 to-rose transition-all duration-1000"
              style={{ width: `${themPercent}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-xl">
            <TrendingUp className="w-5 h-5 text-coral mx-auto mb-2" />
            <p className="text-2xl font-display font-bold gradient-text">73%</p>
            <p className="text-xs text-muted-foreground mt-1">You text first</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-xl">
            <MessageCircle className="w-5 h-5 text-rose mx-auto mb-2" />
            <p className="text-2xl font-display font-bold gradient-warm-text">2.4x</p>
            <p className="text-xs text-muted-foreground mt-1">Your avg msg length</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-xl">
            <Clock className="w-5 h-5 text-amber mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-amber">4.2m</p>
            <p className="text-xs text-muted-foreground mt-1">Their reply time</p>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground italic">
          "You put in 62% of the effort in 2024"
        </p>
      </div>
    </div>
  );
};
