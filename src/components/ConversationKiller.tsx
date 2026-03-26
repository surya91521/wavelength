import { Skull, MessageSquareOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ConvoKillerData } from "@/lib/analytics";

interface ConversationKillerProps {
  data: ConvoKillerData;
  participants: string[];
}

export const ConversationKiller = ({ data, participants }: ConversationKillerProps) => {
  const { killCounts, topKillerMessages, totalConvosEnded } = data;

  if (totalConvosEnded === 0) return null;

  // Sort by kill count descending
  const sorted = [...participants]
    .map(p => ({ name: p, kills: killCounts[p] || 0 }))
    .sort((a, b) => b.kills - a.kills);

  const topKiller = sorted[0];
  const topKillerPercent = totalConvosEnded > 0 ? Math.round((topKiller.kills / totalConvosEnded) * 100) : 0;

  const getKillerTitle = () => {
    if (topKillerPercent > 70) return "The Serial Conversation Killer";
    if (topKillerPercent > 55) return "The Conversation Ender";
    return "Mutual Destruction";
  };

  const getKillerVerdict = () => {
    if (participants.length > 2) {
      if (topKillerPercent > 60) return `${topKiller.name} has a gift for killing conversations. Nobody replies after them.`;
      return "Conversations die equally across the group. Democracy in action.";
    }
    if (topKillerPercent > 70) return `${topKiller.name} ends ${topKillerPercent}% of conversations. Their last message enters the chat and the chat enters the morgue.`;
    if (topKillerPercent > 55) return `${topKiller.name} tends to have the last word. Make of that what you will.`;
    return "Everyone kills conversations equally. Perfectly balanced, as all things should be.";
  };

  const getGradient = (index: number) => {
    const gradients = ["from-red-500 to-red-600", "from-slate-400 to-slate-500", "from-zinc-400 to-zinc-500", "from-stone-400 to-stone-500"];
    return gradients[index % gradients.length];
  };

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skull className="w-5 h-5 text-red-500" />
          <CardTitle>{getKillerTitle()}</CardTitle>
        </div>
        <CardDescription>Which message killed the conversation? (6+ hours of silence after)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {/* Kill Count Bar */}
          <div className="space-y-3">
            {sorted.map((p, i) => {
              const percent = totalConvosEnded > 0 ? (p.kills / totalConvosEnded) * 100 : 0;
              return (
                <div key={p.name}>
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <span className="font-medium flex items-center gap-2">
                      {i === 0 && <Skull className="w-3.5 h-3.5 text-red-500" />}
                      <span className="truncate max-w-[150px]">{p.name}</span>
                    </span>
                    <span className="text-muted-foreground font-mono text-xs">
                      {p.kills} kills ({Math.round(percent)}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getGradient(i)} rounded-full transition-all duration-1000`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top Conversation-Ending Messages */}
          {topKiller.name && topKillerMessages[topKiller.name]?.length > 0 && (
            <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquareOff className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold">{topKiller.name}'s go-to conversation killers</span>
              </div>
              <div className="space-y-2">
                {topKillerMessages[topKiller.name].slice(0, 4).map((msg, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate max-w-[200px] font-mono text-xs bg-muted/50 px-2 py-1 rounded">
                      "{msg.text}"
                    </span>
                    <span className="text-xs text-red-500/70 font-medium shrink-0 ml-2">
                      {msg.count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verdict */}
          <p className="text-center text-sm text-muted-foreground italic border-t border-border/50 pt-4">
            {getKillerVerdict()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
