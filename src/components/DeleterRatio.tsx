import { Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DeleterRatioProps {
  stats: Record<string, { deleted: number; total: number; ratio: number }>;
  participants: string[];
}

export const DeleterRatio = ({ stats, participants }: DeleterRatioProps) => {
  const getHighestDeleter = () => {
    let maxRatio = 0;
    let maxSender = '';
    for (const [sender, data] of Object.entries(stats)) {
      if (data.ratio > maxRatio) {
        maxRatio = data.ratio;
        maxSender = sender;
      }
    }
    return { sender: maxSender, ratio: maxRatio, deleted: stats[maxSender]?.deleted || 0, total: stats[maxSender]?.total || 0 };
  };

  const highest = getHighestDeleter();
  const ratioPer50 = Math.round(highest.ratio / 2); // Approximate per 50 messages

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-primary" />
          <CardTitle>The "Deleter" Ratio</CardTitle>
        </div>
        <CardDescription>Who's the revisionist?</CardDescription>
      </CardHeader>
      <CardContent>
        {highest.sender && highest.ratio > 0 ? (
          <div className="space-y-4">
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-medium mb-2">
                You are the <span className="font-bold text-primary">"Revisionist"</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="text-xs opacity-80 mt-1 block">
                  Total: {highest.deleted} deleted out of {highest.total} messages ({highest.ratio.toFixed(1)}%)
                </span>
              </p>
            </div>
            <div className="space-y-2">
              {participants.map(p => {
                const data = stats[p] || { deleted: 0, total: 0, ratio: 0 };
                return (
                  <div key={p} className="flex justify-between items-center text-sm p-3 border rounded-lg bg-white/5">
                    <span className="font-medium">{p}</span>
                    <span className="text-muted-foreground">
                      {data.deleted} deleted ({data.ratio.toFixed(1)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No deleted messages found. You're both honest!</p>
        )}
      </CardContent>
    </Card>
  );
};
