import { Quote } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SlangWord {
  word: string;
  firstUsedBy: string;
  firstDate: Date | string;
  adopted: boolean;
}

interface WhoSaidItProps {
  slangWords: SlangWord[];
}

export const WhoSaidIt = ({ slangWords }: WhoSaidItProps) => {
  const displayWords = slangWords.filter(w => w.firstUsedBy).slice(0, 5);

  return (
    <Card className="glass h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Quote className="w-5 h-5 text-primary" />
          <CardTitle>The "Who Said It?" Widget</CardTitle>
        </div>
        <CardDescription>The originators of your vocabulary</CardDescription>
      </CardHeader>
      <CardContent>
        {displayWords.length > 0 ? (
          <div className="space-y-3">
            {displayWords.map((item) => (
              <div 
                key={item.word} 
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg capitalize">"{item.word}"</span>
                    {item.adopted && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 pointer-events-none">Adopted</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(item.firstDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-primary block">
                    {item.firstUsedBy}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Originator
                  </span>
                </div>
              </div>
            ))}
             {slangWords.length > 5 && (
               <p className="text-xs text-center text-muted-foreground pt-2">
                  + {slangWords.length - 5} more words detected
               </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No trendy slang detected!</p>
            <p className="text-xs opacity-70 mt-1">You guys are too proper 🧐</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
