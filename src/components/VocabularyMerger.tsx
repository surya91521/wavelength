import { Sparkles, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface VocabularyMergerProps {
  slangWords: { word: string; firstUsedBy: string; firstDate: Date; adopted: boolean }[];
  wordUsage: { month: string; count: number }[];
  participants: string[];
}

export const VocabularyMerger = ({ slangWords, wordUsage, participants }: VocabularyMergerProps) => {
  const [you] = participants.length >= 2 ? participants : ['You', 'Them'];
  
  const adoptedWords = slangWords.filter(w => w.adopted);
  const syncScore = slangWords.length > 0 
    ? Math.round((adoptedWords.length / slangWords.length) * 100) 
    : 0;

  return (
    <div className="glass rounded-2xl p-6 animate-slide-up-delay-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-amber" />
        <h3 className="font-display text-xl font-semibold">The Vocabulary Merger</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Shared language patterns (a sign of deep bonding)
      </p>

      {/* Word Usage Chart */}
      {wordUsage.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Slang usage over time
          </p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={wordUsage.slice(-12)}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickFormatter={(v) => v.slice(-2)}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--coral))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Shared Words List */}
      <div className="space-y-2 mb-6">
        {slangWords.slice(0, 5).map((item, index) => (
          <div
            key={item.word}
            className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-display font-semibold gradient-text">
                "{item.word}"
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                Started by {item.firstUsedBy === you ? 'you' : 'them'}
              </span>
              {item.adopted && (
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-500">
                  ✓ Adopted
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {format(item.firstDate, 'MMM yyyy')}
            </span>
          </div>
        ))}
        
        {slangWords.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No common slang detected yet. Keep chatting!
          </p>
        )}
      </div>

      {/* Sync Score */}
      <div className="p-4 bg-gradient-to-r from-coral/10 via-rose/10 to-amber/10 rounded-xl border border-primary/20">
        <p className="text-sm text-center">
          <span className="text-foreground font-medium">Linguistic sync score:</span>
          <span className="text-2xl font-display font-bold gradient-text ml-2">{syncScore}%</span>
        </p>
        <p className="text-xs text-muted-foreground text-center mt-1">
          {syncScore >= 80
            ? participants.length > 2 ? "This group is linguistically inseparable!" : "You two are linguistically inseparable!"
            : syncScore >= 50
            ? "You're picking up on each other's vibe"
            : "Your vocabularies are still unique"
          }
        </p>
      </div>
    </div>
  );
};
