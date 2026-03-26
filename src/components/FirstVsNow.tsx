import { GitCompareArrows, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { FirstVsNowData } from "@/lib/analytics";

interface FirstVsNowProps {
  data: FirstVsNowData;
  participants: string[];
}

type TrendDirection = "up" | "down" | "same";

const TrendIcon = ({ dir, goodIfUp = true }: { dir: TrendDirection; goodIfUp?: boolean }) => {
  if (dir === "same") return <Minus className="w-4 h-4 text-muted-foreground" />;
  const isGood = goodIfUp ? dir === "up" : dir === "down";
  if (dir === "up") return <TrendingUp className={`w-4 h-4 ${isGood ? 'text-green-500' : 'text-red-500'}`} />;
  return <TrendingDown className={`w-4 h-4 ${isGood ? 'text-green-500' : 'text-red-500'}`} />;
};

function trend(before: number, after: number, threshold = 0.15): TrendDirection {
  if (before === 0 && after === 0) return "same";
  const change = before > 0 ? (after - before) / before : after > 0 ? 1 : 0;
  if (Math.abs(change) < threshold) return "same";
  return change > 0 ? "up" : "down";
}

function formatTime(minutes: number | null): string {
  if (minutes === null) return '—';
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  return `${(minutes / 60).toFixed(1)}h`;
}

function changeLabel(before: number, after: number): string {
  if (before === 0) return after > 0 ? "new" : "—";
  const pct = Math.round(((after - before) / before) * 100);
  if (Math.abs(pct) < 5) return "same";
  return `${pct > 0 ? '+' : ''}${pct}%`;
}

export const FirstVsNow = ({ data, participants }: FirstVsNowProps) => {
  const { first, now } = data;

  // Aggregate stats across all participants
  const avgFirst = {
    responseTime: Object.values(first.avgResponseTime).filter(v => v !== null).reduce((a, b) => (a || 0) + (b || 0), 0) as number / Math.max(Object.values(first.avgResponseTime).filter(v => v !== null).length, 1),
    msgLength: Object.values(first.avgMessageLength).reduce((a, b) => a + b, 0) / Math.max(participants.length, 1),
    emoji: Object.values(first.emojiPerMessage).reduce((a, b) => a + b, 0) / Math.max(participants.length, 1),
    laughter: Object.values(first.laughterPerMessage).reduce((a, b) => a + b, 0) / Math.max(participants.length, 1),
    activity: first.messagesPerDay,
  };

  const avgNow = {
    responseTime: Object.values(now.avgResponseTime).filter(v => v !== null).reduce((a, b) => (a || 0) + (b || 0), 0) as number / Math.max(Object.values(now.avgResponseTime).filter(v => v !== null).length, 1),
    msgLength: Object.values(now.avgMessageLength).reduce((a, b) => a + b, 0) / Math.max(participants.length, 1),
    emoji: Object.values(now.emojiPerMessage).reduce((a, b) => a + b, 0) / Math.max(participants.length, 1),
    laughter: Object.values(now.laughterPerMessage).reduce((a, b) => a + b, 0) / Math.max(participants.length, 1),
    activity: now.messagesPerDay,
  };

  const metrics = [
    {
      label: "Reply Speed",
      firstVal: formatTime(avgFirst.responseTime),
      nowVal: formatTime(avgNow.responseTime),
      trend: trend(avgNow.responseTime, avgFirst.responseTime), // Faster is better, so invert
      goodIfUp: true,
      icon: "⚡",
    },
    {
      label: "Message Length",
      firstVal: `${avgFirst.msgLength.toFixed(1)} words`,
      nowVal: `${avgNow.msgLength.toFixed(1)} words`,
      trend: trend(avgFirst.msgLength, avgNow.msgLength),
      goodIfUp: true,
      icon: "📝",
      change: changeLabel(avgFirst.msgLength, avgNow.msgLength),
    },
    {
      label: "Emoji Usage",
      firstVal: `${avgFirst.emoji.toFixed(2)}/msg`,
      nowVal: `${avgNow.emoji.toFixed(2)}/msg`,
      trend: trend(avgFirst.emoji, avgNow.emoji),
      goodIfUp: true,
      icon: "😊",
      change: changeLabel(avgFirst.emoji, avgNow.emoji),
    },
    {
      label: "Laughter",
      firstVal: `${(avgFirst.laughter * 100).toFixed(1)}%`,
      nowVal: `${(avgNow.laughter * 100).toFixed(1)}%`,
      trend: trend(avgFirst.laughter, avgNow.laughter),
      goodIfUp: true,
      icon: "😂",
      change: changeLabel(avgFirst.laughter, avgNow.laughter),
    },
    {
      label: "Msgs/Day",
      firstVal: `${avgFirst.activity.toFixed(0)}`,
      nowVal: `${avgNow.activity.toFixed(0)}`,
      trend: trend(avgFirst.activity, avgNow.activity),
      goodIfUp: true,
      icon: "💬",
      change: changeLabel(avgFirst.activity, avgNow.activity),
    },
  ];

  // Overall verdict
  const improvements = metrics.filter(m => m.trend === "up").length;
  const declines = metrics.filter(m => m.trend === "down").length;

  const getVerdict = () => {
    if (improvements >= 4) return "Glow-up alert. You've leveled up in almost every way. The growth is real.";
    if (improvements >= 3 && declines <= 1) return "Mostly trending up. Your chat game has improved with time.";
    if (declines >= 4) return "Interesting trajectory. Either you've gotten comfortable or... something shifted.";
    if (declines >= 3) return "The honeymoon phase might be over. Response times up, message length down. Classic.";
    if (Math.abs(improvements - declines) <= 1) return "Some things changed, some stayed the same. You've evolved, not devolved.";
    return "A mixed bag. Growth in some areas, chill in others. That's just how relationships work.";
  };

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center gap-2">
          <GitCompareArrows className="w-5 h-5 text-primary" />
          <CardTitle>First vs. Now</CardTitle>
        </div>
        <CardDescription>
          How your texting evolved: {first.period} → {now.period}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Header Row */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center text-xs font-bold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border/50">
            <span>Metric</span>
            <span className="text-right w-20">{first.period.split(' ')[0]}</span>
            <span className="w-6" />
            <span className="text-right w-20">{now.period.split(' ')[0]}</span>
          </div>

          {/* Metrics */}
          {metrics.map(m => (
            <div key={m.label} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
              <span className="text-sm font-medium flex items-center gap-2">
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </span>
              <span className="text-sm text-muted-foreground text-right w-20 font-mono">{m.firstVal}</span>
              <span className="w-6 flex justify-center">
                <TrendIcon dir={m.trend} goodIfUp={m.goodIfUp} />
              </span>
              <span className="text-sm font-semibold text-right w-20 font-mono">{m.nowVal}</span>
            </div>
          ))}

          {/* Per-person breakdown for response times */}
          {participants.length === 2 && (
            <div className="p-4 bg-muted/20 rounded-xl border border-border/20 mt-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Reply Speed Breakdown</p>
              {participants.map(p => {
                const firstTime = first.avgResponseTime[p];
                const nowTime = now.avgResponseTime[p];
                const dir = firstTime && nowTime ? trend(nowTime, firstTime) : "same";
                return (
                  <div key={p} className="flex items-center justify-between text-sm py-1.5">
                    <span className="text-muted-foreground truncate max-w-[100px]">{p}</span>
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground w-12 text-right">{formatTime(firstTime)}</span>
                      <TrendIcon dir={dir} goodIfUp={true} />
                      <span className="font-mono text-xs font-bold w-12 text-right">{formatTime(nowTime)}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Verdict */}
          <p className="text-center text-sm text-muted-foreground italic border-t border-border/50 pt-4">
            {getVerdict()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
