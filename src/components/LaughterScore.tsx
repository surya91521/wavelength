import { Laugh } from "lucide-react";

interface LaughterScoreProps {
  laughterCounts: Record<string, number>;
  participants: string[];
}

export const LaughterScore = ({ laughterCounts, participants }: LaughterScoreProps) => {
  const totalLaughs = Object.values(laughterCounts).reduce((a, b) => a + b, 0) || 1;
  const sortedParticipants = [...participants].map(p => ({
    name: p,
    count: laughterCounts[p] || 0,
    percent: Math.round(((laughterCounts[p] || 0) / totalLaughs) * 100)
  })).sort((a, b) => b.count - a.count);

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

  const winner = sortedParticipants[0];

  return (
    <div className="glass rounded-2xl p-6 animate-slide-up-delay-3">
      <div className="flex items-center gap-2 mb-2">
        <Laugh className="w-5 h-5 text-amber" />
        <h3 className="font-display text-xl font-semibold">The Laughter Score</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Who brings the comedy?
      </p>

      {/* Stats List */}
      <div className="space-y-4 mb-6">
        {sortedParticipants.map((p) => (
            <div key={p.name} className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="font-semibold text-lg">{p.count.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[100px]" title={p.name}>{p.name}</span>
                </div>
                <div className="text-xs text-coral">haha, 😂, lol...</div>
            </div>
        ))}
      </div>

      {/* Distribution bar */}
      <div className="h-4 bg-muted rounded-full overflow-hidden flex mb-4">
        {sortedParticipants.map((p, i) => (
             p.percent > 0 && (
                <div 
                    key={p.name}
                    className={`bg-gradient-to-r ${getGradient(i)} transition-all duration-1000`}
                    style={{ width: `${p.percent}%` }}
                    title={`${p.name}: ${p.percent}%`}
                />
             )
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground italic">
        {participants.length > 2
          ? `"${winner.name} seems to be the happiest one properly!"`
          : sortedParticipants[0].count > sortedParticipants[1]?.count * 1.2
            ? `"${sortedParticipants[0].name} gets way more laughs (${sortedParticipants[0].percent}%). The funny one!"`
            : `"Pretty even! You both bring joy to the chat."`
        }
      </p>
    </div>
  );
};
