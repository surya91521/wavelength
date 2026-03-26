import { HelpCircle, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CuriosityGapProps {
  stats: {
    questions: Record<string, number>;
    dryTexts: Record<string, number>;
    questionRatio: Record<string, number>;
    dryTextRatio: Record<string, number>;
  };
  participants: string[];
}

export const CuriosityGap = ({ stats, participants }: CuriosityGapProps) => {
  const getInterviewer = () => {
    let maxRatio = 0;
    let maxSender = '';
    for (const [sender, ratio] of Object.entries(stats.questionRatio)) {
      if (ratio > maxRatio) {
        maxRatio = ratio;
        maxSender = sender;
      }
    }
    return { sender: maxSender, ratio: maxRatio, count: stats.questions[maxSender] || 0 };
  };

  const getDryTexter = () => {
    let maxRatio = 0;
    let maxSender = '';
    for (const [sender, ratio] of Object.entries(stats.dryTextRatio)) {
      if (ratio > maxRatio) {
        maxRatio = ratio;
        maxSender = sender;
      }
    }
    return { sender: maxSender, ratio: maxRatio, count: stats.dryTexts[maxSender] || 0 };
  };

  const interviewer = getInterviewer();
  const dryTexter = getDryTexter();
  const totalQuestions = Object.values(stats.questions).reduce((a, b) => a + b, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <CardTitle>The "Interviewer" Badge</CardTitle>
          </div>
          <CardDescription>Who asks the questions?</CardDescription>
        </CardHeader>
        <CardContent>
          {interviewer.sender && interviewer.ratio > 0 ? (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-medium mb-2">
                  <span className="font-bold text-primary">{interviewer.sender}</span> asks {interviewer.ratio.toFixed(0)}% of the questions.
                </p>
                {totalQuestions > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {interviewer.count} questions out of {totalQuestions} total
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2 italic">
                  {interviewer.ratio > 70
                    ? "Basically running a podcast interview at this point. Someone get them a mic."
                    : interviewer.ratio > 55
                    ? "The curious one. Always asking, always caring, rarely getting the same energy back."
                    : "Slightly more curious than the rest. The question-asker of the group."}
                </p>
              </div>
              {participants.length === 2 && (
                <p className="text-xs text-muted-foreground italic">
                  {participants.find(p => p !== interviewer.sender)} mostly just answers. The mystery remains.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No questions found.</p>
          )}
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <CardTitle>The "Dry Texter" Alert</CardTitle>
          </div>
          <CardDescription>One-word replies detected</CardDescription>
        </CardHeader>
        <CardContent>
          {dryTexter.sender && dryTexter.ratio > 0 ? (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-medium mb-2">
                  {dryTexter.ratio.toFixed(0)}% of <span className="font-bold text-primary">{dryTexter.sender}</span>'s replies are one word.
                </p>
                <p className="text-sm text-muted-foreground">
                  Officially a <span className="font-semibold">
                    {dryTexter.ratio > 25 ? '"Desert Texter" 🏜️' : dryTexter.ratio > 15 ? '"Dry Texter" 🌵' : '"Slightly Dehydrated Texter"'}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {dryTexter.count} one-word messages detected
                </p>
                <p className="text-xs text-muted-foreground mt-1 italic">
                  {dryTexter.ratio > 25
                    ? "k. ok. yeah. cool. This person's keyboard only has 5 keys."
                    : dryTexter.ratio > 15
                    ? "A person of few words. Very few. Concerningly few."
                    : "Not terrible, but there's room to grow. Try a full sentence sometime."}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No dry texting detected. You're both engaging!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
