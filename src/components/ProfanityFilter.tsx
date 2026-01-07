import { useState } from "react";
import { Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Message } from "@/lib/types";
import * as analytics from "@/lib/analytics";

interface ProfanityFilterProps {
  messages: Message[];
  participants: string[];
}

export const ProfanityFilter = ({ messages, participants }: ProfanityFilterProps) => {
  const [showProfanity, setShowProfanity] = useState(false);
  const [profanityStats, setProfanityStats] = useState<Record<string, { total: number; topWords: { word: string; count: number }[] }> | null>(null);

  const handleProfanityToggle = (checked: boolean) => {
    setShowProfanity(checked);
    if (checked) {
      const stats = analytics.profanityCount(messages);
      setProfanityStats(stats);
    } else {
      setProfanityStats(null);
    }
  };

  const profanityChartData = profanityStats
    ? participants.map(p => ({
        name: p,
        count: profanityStats[p]?.total || 0,
      }))
    : [];

  const colors = ["hsl(var(--primary))", "hsl(var(--coral))"];

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          <CardTitle>The "Profanity" Filter</CardTitle>
        </div>
        <CardDescription>Who curses more? (NSFW - toggle to view)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="profanity-toggle" className="text-sm">
              Enable NSFW Stats
            </Label>
            <Switch
              id="profanity-toggle"
              checked={showProfanity}
              onCheckedChange={handleProfanityToggle}
            />
          </div>
          {showProfanity && profanityStats && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-medium mb-2">Who curses more?</p>
                {participants.map(p => (
                  <div key={p} className="mb-2">
                    <p className="text-sm">
                      <span className="font-semibold">{p}</span>: {" "}
                      <span className="font-bold text-primary">{profanityStats[p]?.total || 0} swear word{(profanityStats[p]?.total || 0) !== 1 ? 's' : ''}</span>
                    </p>
                    {profanityStats[p]?.topWords?.length ? (
                      <p className="text-xs text-muted-foreground ml-2">
                        Top swear words: {profanityStats[p]!.topWords.map(t => `${t.word} (${t.count})`).join(', ')}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
              {profanityChartData.some(d => d.count > 0) && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profanityChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {profanityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
          {!showProfanity && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Toggle above to view profanity statistics
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
