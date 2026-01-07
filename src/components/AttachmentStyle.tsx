import { BookOpen, Scissors } from "lucide-react";

interface AttachmentStyleProps {
  attachmentStyle: { avgWords: Record<string, number>; labels: Record<string, string> };
  participants: string[];
}

export const AttachmentStyle = ({ attachmentStyle, participants }: AttachmentStyleProps) => {

  const getGradient = (index: number) => {
    const gradients = [
        "from-coral to-rose",
        "from-rose to-amber",
        "from-amber to-orange",
        "from-blue-400 to-blue-600",
        "from-purple-400 to-purple-600"
    ];
    return gradients[index % gradients.length];
  }

  return (
    <div className="glass rounded-2xl p-6 animate-slide-up-delay-3">
      <h3 className="font-display text-xl font-semibold mb-2">Attachment Style Detector</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Who writes novels vs. who edits to the point?
      </p>

      <div className={`grid gap-6 mb-6 ${participants.length > 2 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}`}>
        {participants.map((p, i) => {
            const avg = Math.round(attachmentStyle.avgWords[p] || 0);
            const label = attachmentStyle.labels[p] || 'Unknown';
            return (
                <div key={p} className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br ${getGradient(i)} flex items-center justify-center`}>
                        {label === 'Storyteller' ? (
                        <BookOpen className="w-8 h-8 text-primary-foreground" />
                        ) : (
                        <Scissors className="w-8 h-8 text-primary-foreground" />
                        )}
                    </div>
                    <p className="font-display font-bold text-lg gradient-text truncate px-1" title={p}>{label}</p>
                    <p className="text-sm text-muted-foreground truncate px-1">{p}</p>
                    <div className="mt-2">
                        <p className="text-2xl font-display font-bold">{avg}</p>
                        <p className="text-xs text-muted-foreground">avg words/msg</p>
                    </div>
                </div>
            );
        })}
      </div>

      <div className="space-y-3">
        {participants.map((p, i) => {
             const avg = Math.round(attachmentStyle.avgWords[p] || 0);
             // Just relative comparison bar
             const maxAvg = Math.max(...participants.map(part => attachmentStyle.avgWords[part] || 0), 1);
             const percent = (avg / maxAvg) * 100;
             
             return (
                 <div key={p} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20 truncate text-right">{p}</span>
                     <div className="h-2 bg-muted rounded-full flex-1 overflow-hidden">
                        <div 
                        className={`bg-gradient-to-r ${getGradient(i)} h-full transition-all duration-1000`}
                        style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>
             );
        })}
      </div>
    </div>
  );
};
