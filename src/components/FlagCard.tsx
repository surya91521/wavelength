import { Flag as FlagIcon, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Flag } from "@/lib/analytics";

interface FlagCardProps {
  flags: { green: Flag[]; red: Flag[] };
}

export const FlagCard = ({ flags }: FlagCardProps) => {
  const { green, red } = flags;

  if (green.length === 0 && red.length === 0) return null;

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FlagIcon className="w-5 h-5 text-primary" />
          <CardTitle>The Flag Report</CardTitle>
        </div>
        <CardDescription>Green flags and red flags from your chat</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Green Flags */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Green Flags</span>
            </div>
            {green.length > 0 ? (
              <div className="space-y-3">
                {green.map((f, i) => (
                  <div key={i} className="p-3 bg-green-500/5 rounded-lg border border-green-500/10">
                    <div className="flex items-start gap-2">
                      <span className="text-lg shrink-0">{f.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold">{f.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{f.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic p-3">No green flags detected. Yikes.</p>
            )}
          </div>

          {/* Red Flags */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Red Flags</span>
            </div>
            {red.length > 0 ? (
              <div className="space-y-3">
                {red.map((f, i) => (
                  <div key={i} className="p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                    <div className="flex items-start gap-2">
                      <span className="text-lg shrink-0">{f.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold">{f.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{f.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic p-3">No red flags. Suspicious, but congratulations.</p>
            )}
          </div>
        </div>

        {/* Summary */}
        <p className="text-center text-sm text-muted-foreground italic border-t border-border/50 pt-4 mt-6">
          {red.length === 0 && green.length > 0
            ? "All green. Either you're perfect or we're not looking hard enough."
            : red.length > green.length
            ? "More red than green. Not great, not terrible. Okay, maybe a little terrible."
            : green.length > red.length
            ? "More green than red. The vibes are mostly immaculate."
            : "Equal flags. A perfectly balanced mess."}
        </p>
      </CardContent>
    </Card>
  );
};
