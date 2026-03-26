import { TrendingUp, MessageCircle, Clock, Send, Reply, MessagesSquare } from "lucide-react";
import { useMemo } from "react";

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
  // Calculate effort percentages based on initiator counts
  const totalInitiations = Object.values(initiatorCounts).reduce((a, b) => a + b, 0) || 1;
  const initiatorStats = participants.map(p => ({
    name: p,
    count: initiatorCounts[p] || 0,
    percent: Math.round(((initiatorCounts[p] || 0) / totalInitiations) * 100)
  })).sort((a, b) => b.count - a.count);
  
  // Format response time
  const formatTime = (minutes: number | null) => {
    if (minutes === null) return 'N/A';
    if (minutes < 1) return '<1m';
    if (minutes < 60) return `${Math.round(minutes)}m`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}d`;
  };

  const getGradient = (index: number) => {
    const gradients = [
        "from-coral to-coral/80",
        "from-rose to-rose/80",
        "from-amber to-amber/80", 
        "from-blue-400 to-blue-600",
        "from-purple-400 to-purple-600"
    ];
    return gradients[index % gradients.length];
  }

  const sortedByResponseTime = [...participants].sort((a, b) => {
    const tA = avgResponseTimes[a] || 999999;
    const tB = avgResponseTimes[b] || 999999;
    return tA - tB;
  });

  const fastestResponder = sortedByResponseTime[0];

  return (
    <div className="glass rounded-2xl p-6 animate-slide-up-delay-1">
      <h3 className="font-display text-xl font-semibold mb-2">The Power Dynamic</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Who puts in more effort?
      </p>

      <div className="space-y-6">
        {/* Response Time Comparison */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {participants.map((p, i) => {
                const isFastest = p === fastestResponder;
                return (
                <div 
                    key={p} 
                    className={`relative text-center p-3 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center ${
                        isFastest 
                        ? "bg-primary/10 border-primary ring-2 ring-primary/20 shadow-lg scale-105 z-10" 
                        : "bg-muted/50 border-border/50 group hover:border-border"
                    }`}
                >
                    {isFastest && (
                        <div className="absolute -top-2.5 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            FASTEST
                        </div>
                    )}
                    <Clock className={`w-4 h-4 mb-2 ${isFastest ? "text-primary animate-pulse" : "text-muted-foreground group-hover:text-foreground transition-colors"}`} />
                    <p className={`text-lg font-display font-bold ${isFastest ? "text-foreground" : ""}`}>
                        {formatTime(avgResponseTimes[p] || null)}
                    </p>
                    <p 
                        className={`text-xs mt-1 truncate px-1 max-w-full font-medium ${isFastest ? "text-primary" : "text-muted-foreground"}`} 
                        title={p}
                    >
                        {p}
                    </p>
                </div>
            )})}
        </div>

        {/* Initiator Badge */}
        <div className="p-4 bg-muted/20 rounded-xl border border-border/20">
          <div className="flex items-center gap-3 mb-2">
            <Send className="w-5 h-5 text-coral" />
            <span className="font-display font-semibold">Initiations</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Conversations started after 24h+ silence
          </p>
          
          <div className="h-4 bg-muted rounded-full overflow-hidden flex w-full">
            {initiatorStats.map((stat, i) => (
                stat.percent > 0 && (
                    <div 
                        key={stat.name}
                        className={`bg-gradient-to-r ${getGradient(i)} transition-all duration-1000`}
                        style={{ width: `${stat.percent}%` }}
                        title={`${stat.name}: ${stat.count} (${stat.percent}%)`}
                    />
                )
            ))}
          </div>
          <div className="flex flex-wrap justify-between text-xs text-muted-foreground mt-2 gap-2">
             {initiatorStats.map(stat => (
                 <span key={stat.name}>{stat.name}: {stat.count}</span>
             ))}
          </div>
        </div>

        {/* Double Text Ratio */}
        <div className="p-4 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <MessagesSquare className="w-5 h-5 text-amber" />
            <span className="font-display font-semibold">Double-Texting</span>
          </div>
          <p className="text-xs text-muted-foreground/80 mb-3 leading-relaxed">
             How often you send 2+ msgs in a row compared to single msgs.
          </p>
          <div className="space-y-2 mt-2">
            {participants.map(p => (
                 <div key={p} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground truncate max-w-[120px]" title={p}>{p}</span>
                    <span className="font-bold text-amber">
                        {(doubleTextRatios[p] || 0).toFixed(1)}%
                    </span>
                 </div>
            ))}
          </div>
        </div>
        
        {/* Spicy Insight */}
        <p className="text-center text-sm text-muted-foreground italic border-t border-border/50 pt-4">
             {(() => {
                const fastest = fastestResponder;
                const slowest = sortedByResponseTime[sortedByResponseTime.length - 1];
                const fastTime = avgResponseTimes[fastest] || 0;
                const slowTime = avgResponseTimes[slowest] || 0;
                const ratio = slowTime && fastTime ? slowTime / fastTime : 1;

                if (participants.length > 2) {
                    if (ratio > 5) return `${fastest} replies like their phone is glued to their hand. Everyone else? On their own schedule.`;
                    return `${fastest} is the group's fastest replier. The rest of you... take notes.`;
                }
                if (ratio > 10) return `${fastest} replies instantly. ${slowest} replies... eventually. The audacity.`;
                if (ratio > 4) return `${fastest} is clearly more invested in replying fast. ${slowest}, we see you taking your sweet time.`;
                if (ratio > 2) return `${fastest} replies faster, but ${slowest} isn't far behind. Healthy-ish.`;
                return `You both reply at about the same speed. Either you're both obsessed or both unbothered.`;
             })()}
        </p>

      </div>
    </div>
  );
};
