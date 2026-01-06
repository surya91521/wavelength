import { TrendingUp, MessageCircle, Clock, Send, Reply, MessagesSquare } from "lucide-react";

interface PowerDynamicProps {
  participants: string[];
  avgResponseTimes: Record<string, number | null>;
  initiatorCounts: Record<string, number>;
  doubleTextRatios: Record<string, number>;
  totalMessages: number;
}

export const PowerDynamic = ({ 
  participants, 
  avgResponseTimes, 
  initiatorCounts, 
  doubleTextRatios,
}: PowerDynamicProps) => {
  const [you, them] = participants.length >= 2 ? participants : ['You', 'Them'];
  
  // Calculate effort percentages based on initiator counts
  const totalInitiations = Object.values(initiatorCounts).reduce((a, b) => a + b, 0) || 1;
  const youInitiatorPercent = Math.round(((initiatorCounts[you] || 0) / totalInitiations) * 100);
  const themInitiatorPercent = 100 - youInitiatorPercent;
  
  // Format response time
  const formatTime = (minutes: number | null) => {
    if (minutes === null) return 'N/A';
    if (minutes < 1) return '<1m';
    if (minutes < 60) return `${Math.round(minutes)}m`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}d`;
  };
  
  const yourResponseTime = avgResponseTimes[you];
  const theirResponseTime = avgResponseTimes[them];
  
  // Double text ratio comparison
  const yourDoubleText = doubleTextRatios[you] || 0;
  const theirDoubleText = doubleTextRatios[them] || 0;
  const doubleTextMultiplier = theirDoubleText > 0 
    ? (yourDoubleText / theirDoubleText).toFixed(1) 
    : yourDoubleText > 0 ? '∞' : '1';

  return (
    <div className="glass rounded-2xl p-6 animate-slide-up-delay-1">
      <h3 className="font-display text-xl font-semibold mb-2">The Power Dynamic</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Who puts in more effort?
      </p>

      <div className="space-y-6">
        {/* Response Time Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-xl border border-coral/20">
            <Clock className="w-5 h-5 text-coral mx-auto mb-2" />
            <p className="text-2xl font-display font-bold gradient-text">
              {formatTime(yourResponseTime)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Your reply time</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-xl border border-rose/20">
            <Clock className="w-5 h-5 text-rose mx-auto mb-2" />
            <p className="text-2xl font-display font-bold gradient-warm-text">
              {formatTime(theirResponseTime)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Their reply time</p>
          </div>
        </div>

        {/* Initiator Badge */}
        <div className="p-4 bg-gradient-to-r from-coral/10 to-rose/10 rounded-xl border border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <Send className="w-5 h-5 text-coral" />
            <span className="font-display font-semibold">The Initiator</span>
          </div>
          <p className="text-sm text-muted-foreground">
            You started <span className="text-coral font-bold">{youInitiatorPercent}%</span> of conversations after 24+ hours of silence
          </p>
          <div className="mt-3 h-3 bg-muted rounded-full overflow-hidden flex">
            <div 
              className="bg-gradient-to-r from-coral to-coral/80 transition-all duration-1000"
              style={{ width: `${youInitiatorPercent}%` }}
            />
            <div 
              className="bg-gradient-to-r from-rose/80 to-rose transition-all duration-1000"
              style={{ width: `${themInitiatorPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>You: {initiatorCounts[you] || 0}</span>
            <span>Them: {initiatorCounts[them] || 0}</span>
          </div>
        </div>

        {/* Double Text Ratio */}
        <div className="p-4 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <MessagesSquare className="w-5 h-5 text-amber" />
            <span className="font-display font-semibold">The Double-Texter</span>
          </div>
          <p className="text-sm text-muted-foreground">
            You are <span className="text-amber font-bold">{doubleTextMultiplier}x</span> more likely to send multiple messages without a reply
          </p>
        </div>

        {/* Insight Quote */}
        <p className="text-center text-sm text-muted-foreground italic border-t border-border/50 pt-4">
          {yourResponseTime !== null && theirResponseTime !== null && yourResponseTime < theirResponseTime * 0.5 
            ? `"You're always there for them. Maybe they should pick up the pace?"`
            : yourResponseTime !== null && theirResponseTime !== null && theirResponseTime < yourResponseTime * 0.5
            ? `"They're always on it. They really care about your convos."`
            : `"Pretty balanced! You both value each other's time."`
          }
        </p>
      </div>
    </div>
  );
};
