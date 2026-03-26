import { Flame, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import type { StreakData } from "@/lib/analytics";

interface StreakTrackerProps {
  data: StreakData;
  participants: string[];
}

export const StreakTracker = ({ data }: StreakTrackerProps) => {
  const { longestStreak, currentStreak, streakBrokenOn, totalActiveDays, totalDays } = data;
  const activityPercent = totalDays > 0 ? Math.round((totalActiveDays / totalDays) * 100) : 0;

  const getStreakVerdict = () => {
    if (longestStreak.days > 365) return "Over a year of daily texting. That's not a streak, that's a lifestyle.";
    if (longestStreak.days > 180) return "Half a year straight. Snapchat streaks could never.";
    if (longestStreak.days > 90) return "Three months without missing a day. That's commitment, not a chat.";
    if (longestStreak.days > 30) return "A solid month+ streak. You two don't do 'space'.";
    if (longestStreak.days > 7) return "A week+ of nonstop texting. Respectable.";
    if (longestStreak.days > 1) return "A brief streak. Life got in the way. It happens.";
    return "No streak detected. You text when the mood strikes.";
  };

  const getFireEmojis = () => {
    if (longestStreak.days > 365) return "🔥🔥🔥🔥🔥";
    if (longestStreak.days > 90) return "🔥🔥🔥🔥";
    if (longestStreak.days > 30) return "🔥🔥🔥";
    if (longestStreak.days > 7) return "🔥🔥";
    return "🔥";
  };

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <CardTitle>The Streak Tracker</CardTitle>
        </div>
        <CardDescription>How many days in a row did you text?</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Longest Streak - Hero */}
          <div className="text-center p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl border border-orange-500/20">
            <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Longest Streak</p>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-5xl font-black font-display">{longestStreak.days}</span>
              <span className="text-2xl font-bold text-muted-foreground">days</span>
            </div>
            <p className="text-lg mb-1">{getFireEmojis()}</p>
            <p className="text-xs text-muted-foreground">
              {format(longestStreak.start, 'MMM d, yyyy')} → {format(longestStreak.end, 'MMM d, yyyy')}
            </p>
            {streakBrokenOn && longestStreak.days > 1 && (
              <p className="text-xs text-red-500/80 mt-2 font-medium">
                Streak died on {format(streakBrokenOn, 'MMMM d, yyyy')} 💀
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Current Streak */}
            <div className="p-4 bg-muted/30 rounded-xl text-center">
              <Flame className={`w-5 h-5 mx-auto mb-2 ${currentStreak.days > 0 ? 'text-orange-500 animate-pulse' : 'text-muted-foreground'}`} />
              <p className="text-2xl font-bold font-display">{currentStreak.days}</p>
              <p className="text-xs text-muted-foreground">Current Streak</p>
              {currentStreak.days > 0 ? (
                <p className="text-xs text-orange-500 font-medium mt-1">Still going!</p>
              ) : (
                <p className="text-xs text-muted-foreground/60 mt-1">Inactive</p>
              )}
            </div>

            {/* Activity Rate */}
            <div className="p-4 bg-muted/30 rounded-xl text-center">
              <Calendar className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold font-display">{activityPercent}%</p>
              <p className="text-xs text-muted-foreground">Days Active</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {totalActiveDays.toLocaleString()} / {totalDays.toLocaleString()} days
              </p>
            </div>
          </div>

          {/* Activity bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Activity rate</span>
              <span>{activityPercent}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-1000"
                style={{ width: `${activityPercent}%` }}
              />
            </div>
          </div>

          {/* Verdict */}
          <p className="text-center text-sm text-muted-foreground italic border-t border-border/50 pt-4">
            {getStreakVerdict()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
