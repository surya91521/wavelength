import { BookOpen, Scissors } from "lucide-react";

interface AttachmentStyleProps {
  attachmentStyle: { avgWords: Record<string, number>; labels: Record<string, string> };
  participants: string[];
}

export const AttachmentStyle = ({ attachmentStyle, participants }: AttachmentStyleProps) => {
  const [you, them] = participants.length >= 2 ? participants : ['You', 'Them'];
  
  const yourAvg = Math.round(attachmentStyle.avgWords[you] || 0);
  const theirAvg = Math.round(attachmentStyle.avgWords[them] || 0);
  const yourLabel = attachmentStyle.labels[you] || 'Unknown';
  const theirLabel = attachmentStyle.labels[them] || 'Unknown';

  const maxAvg = Math.max(yourAvg, theirAvg, 1);

  return (
    <div className="glass rounded-2xl p-6 animate-slide-up-delay-3">
      <h3 className="font-display text-xl font-semibold mb-2">Attachment Style Detector</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Who writes novels vs. who edits to the point?
      </p>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* You */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center">
            {yourLabel === 'Storyteller' ? (
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            ) : (
              <Scissors className="w-8 h-8 text-primary-foreground" />
            )}
          </div>
          <p className="font-display font-bold text-lg gradient-text">{yourLabel}</p>
          <p className="text-sm text-muted-foreground">You</p>
          <div className="mt-2">
            <p className="text-2xl font-display font-bold">{yourAvg}</p>
            <p className="text-xs text-muted-foreground">avg words/msg</p>
          </div>
        </div>

        {/* Them */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-rose to-amber flex items-center justify-center">
            {theirLabel === 'Storyteller' ? (
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            ) : (
              <Scissors className="w-8 h-8 text-primary-foreground" />
            )}
          </div>
          <p className="font-display font-bold text-lg gradient-warm-text">{theirLabel}</p>
          <p className="text-sm text-muted-foreground">Them</p>
          <div className="mt-2">
            <p className="text-2xl font-display font-bold">{theirAvg}</p>
            <p className="text-xs text-muted-foreground">avg words/msg</p>
          </div>
        </div>
      </div>

      {/* Comparison bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-12">You</span>
          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-coral to-rose transition-all duration-1000"
              style={{ width: `${(yourAvg / maxAvg) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-12">Them</span>
          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-rose to-amber transition-all duration-1000"
              style={{ width: `${(theirAvg / maxAvg) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground italic mt-4">
        {yourLabel === 'Storyteller' && theirLabel === 'Editor' 
          ? `"You're the ${yourLabel} (${yourAvg} words/msg), they're the ${theirLabel} (${theirAvg} words/msg)"`
          : yourLabel === 'Editor' && theirLabel === 'Storyteller'
          ? `"They're the ${theirLabel} (${theirAvg} words/msg), you're the ${yourLabel} (${yourAvg} words/msg)"`
          : yourLabel === theirLabel
          ? `"You're both ${yourLabel}s! You match each other's energy."`
          : `"Interesting dynamic between you two!"`
        }
      </p>
    </div>
  );
};
