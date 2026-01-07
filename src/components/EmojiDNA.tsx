import { Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EmojiDNAProps {
  stats: {
    emojiUsage: Record<string, Record<string, number>>;
    uniqueEmojis: Record<string, string[]>;
    redFlags: Record<string, number>;
  };
  participants: string[];
}

export const EmojiDNA = ({ stats, participants }: EmojiDNAProps) => {
  const getTopUniqueEmoji = (sender: string) => {
    const unique = stats.uniqueEmojis[sender] || [];
    if (unique.length === 0) return null;
    
    // Get the one with highest usage
    let maxCount = 0;
    let topEmoji = '';
    for (const emoji of unique) {
      const count = stats.emojiUsage[sender]?.[emoji] || 0;
      if (count > maxCount) {
        maxCount = count;
        topEmoji = emoji;
      }
    }
    return topEmoji || unique[0];
  };

  return (
    <Card className="glass h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <CardTitle>The "Emoji Signature"</CardTitle>
        </div>
        <CardDescription>Your unique emoji DNA</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {participants.map(p => {
            const signature = getTopUniqueEmoji(p);
            const unique = stats.uniqueEmojis[p] || [];
            return (
              <div key={p} className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-medium mb-2">
                  <span className="font-bold">{p}</span>'s signature emoji:
                </p>
                {signature ? (
                  <>
                    <div className="text-4xl mb-2">{signature}</div>
                    <p className="text-xs text-muted-foreground">
                      Used {stats.emojiUsage[p]?.[signature] || 0} times (unique to {p})
                    </p>
                    {unique.length > 1 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {unique.length - 1} other unique emoji{unique.length > 2 ? 's' : ''}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No unique emoji signature found</p>
                )}
              </div>
            );
          })}
          {participants.length === 2 && 
           getTopUniqueEmoji(participants[0]) && 
           getTopUniqueEmoji(participants[1]) && (
            <p className="text-xs text-muted-foreground italic text-center pt-2 border-t">
              A classic dynamic: {getTopUniqueEmoji(participants[0])} vs {getTopUniqueEmoji(participants[1])}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
