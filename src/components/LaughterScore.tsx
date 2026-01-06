import { Laugh } from "lucide-react";

interface LaughterScoreProps {
  laughterCounts: Record<string, number>;
  participants: string[];
}

export const LaughterScore = ({ laughterCounts, participants }: LaughterScoreProps) => {
  const [you, them] = participants.length >= 2 ? participants : ['You', 'Them'];
  
  const yourLaughs = laughterCounts[you] || 0;
  const theirLaughs = laughterCounts[them] || 0;
  const totalLaughs = yourLaughs + theirLaughs;
  
  const yourPercent = totalLaughs > 0 ? Math.round((yourLaughs / totalLaughs) * 100) : 50;
  const difference = yourLaughs > 0 && theirLaughs > 0 
    ? Math.round(((yourLaughs - theirLaughs) / theirLaughs) * 100)
    : 0;

  return (
    <div className="glass rounded-2xl p-6 animate-slide-up-delay-3">
      <div className="flex items-center gap-2 mb-2">
        <Laugh className="w-5 h-5 text-amber" />
        <h3 className="font-display text-xl font-semibold">The Laughter Score</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Who brings the comedy?
      </p>

      <div className="flex items-center justify-center gap-8 mb-6">
        <div className="text-center">
          <p className="text-4xl font-display font-bold gradient-text">{yourLaughs.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Your laughs</p>
          <p className="text-xs text-coral mt-1">haha, lol, lmao...</p>
        </div>
        <div className="text-3xl text-muted-foreground">vs</div>
        <div className="text-center">
          <p className="text-4xl font-display font-bold gradient-warm-text">{theirLaughs.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Their laughs</p>
          <p className="text-xs text-rose mt-1">haha, lol, lmao...</p>
        </div>
      </div>

      {/* Distribution bar */}
      <div className="h-4 bg-muted rounded-full overflow-hidden flex mb-4">
        <div 
          className="bg-gradient-to-r from-coral to-coral/80 transition-all duration-1000"
          style={{ width: `${yourPercent}%` }}
        />
        <div 
          className="bg-gradient-to-r from-rose/80 to-rose transition-all duration-1000"
          style={{ width: `${100 - yourPercent}%` }}
        />
      </div>

      <p className="text-center text-sm text-muted-foreground italic">
        {difference > 0 
          ? `"You make them laugh ${difference}% more than they make you laugh!"`
          : difference < 0
          ? `"They make you laugh ${Math.abs(difference)}% more. They're the funny one!"`
          : `"You both bring equal amounts of joy to each other's lives."`
        }
      </p>
    </div>
  );
};
