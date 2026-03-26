import { Mic } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PodcastModeProps {
  stats: Record<string, { count: number; estimatedHours: number }>;
  participants: string[];
}

export const PodcastMode = ({ stats, participants }: PodcastModeProps) => {
  const getPodcaster = () => {
    let maxCount = 0;
    let maxSender = '';
    for (const [sender, data] of Object.entries(stats)) {
      if (data.count > maxCount) {
        maxCount = data.count;
        maxSender = sender;
      }
    }
    return { sender: maxSender, count: maxCount, hours: stats[maxSender]?.estimatedHours || 0 };
  };

  const podcaster = getPodcaster();
  const totalVoiceNotes = Object.values(stats).reduce((sum, data) => sum + data.count, 0);

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary" />
          <CardTitle>The "Podcaster" Stat</CardTitle>
        </div>
        <CardDescription>Voice note analysis</CardDescription>
      </CardHeader>
      <CardContent>
        {podcaster.sender && podcaster.count > 0 ? (
          <div className="space-y-4">
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-medium mb-2">
                <span className="font-bold text-primary">{podcaster.sender}</span> sent {podcaster.count} voice notes.
              </p>
              <p className="text-sm text-muted-foreground">
                That's roughly a{' '}
                <span className="font-semibold">{podcaster.hours.toFixed(1)}-hour podcast</span> nobody subscribed to.
              </p>
              <p className="text-xs text-muted-foreground mt-2 italic">
                {podcaster.count > 200
                  ? "At this point, just start a Spotify podcast. You've got the content."
                  : podcaster.count > 50
                  ? "A true voice note enthusiast. Typing is for amateurs apparently."
                  : "A casual podcaster. Dips into voice notes when typing feels like too much effort."}
              </p>
            </div>
            <div className="space-y-2">
              {participants.map(p => {
                const data = stats[p] || { count: 0, estimatedHours: 0 };
                return (
                  <div key={p} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{p}</span>
                    <span className="text-muted-foreground">
                      {data.count} voice notes ({data.estimatedHours.toFixed(1)}h)
                    </span>
                  </div>
                );
              })}
            </div>
            {totalVoiceNotes > 0 && (
              <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                Total: {totalVoiceNotes} voice notes across all participants
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No voice notes found. You prefer typing!</p>
        )}
      </CardContent>
    </Card>
  );
};
