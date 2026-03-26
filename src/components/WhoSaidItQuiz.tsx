import { useState } from "react";
import { MessageCircleQuestion, CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as analytics from "@/lib/analytics";
import type { Message } from "@/lib/types";

interface WhoSaidItQuizProps {
  messages: Message[];
  participants: string[];
}

export const WhoSaidItQuiz = ({ messages, participants }: WhoSaidItQuizProps) => {
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [quizMessages, setQuizMessages] = useState<analytics.QuizMessage[]>([]);

  const handleAnswer = (sender: string) => {
    if (answered) return;
    setAnswered(sender);
    if (sender === quizMessages[currentIndex].sender) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= quizMessages.length) {
      setFinished(true);
    } else {
      setCurrentIndex(i => i + 1);
      setAnswered(null);
    }
  };

  const startQuiz = () => {
    setQuizMessages(analytics.generateQuizMessages(messages));
    setCurrentIndex(0);
    setScore(0);
    setAnswered(null);
    setFinished(false);
    setQuizStarted(true);
  };

  const handleRestart = () => {
    setQuizStarted(false);
    setFinished(false);
  };

  // Check if we have enough messages for a quiz
  const hasEnough = messages.filter(m => {
    const t = m.text.trim();
    return t.length >= 15 && t.length <= 300 && !/omitted|<Media|http/i.test(t);
  }).length >= 3;

  if (!hasEnough) return null;

  const current = quizMessages[currentIndex];
  const isCorrect = answered === current?.sender;
  const scorePercent = Math.round((score / quizMessages.length) * 100);

  const getScoreVerdict = () => {
    if (scorePercent === 100) return { title: "Psychic Level", desc: "You know them better than they know themselves. Honestly terrifying." };
    if (scorePercent >= 80) return { title: "Bestie Brain", desc: "You could ghost-write their texts and nobody would notice." };
    if (scorePercent >= 60) return { title: "Solid Read", desc: "You know their vibe. Not perfect, but you're paying attention." };
    if (scorePercent >= 40) return { title: "Coin Flip Energy", desc: "50/50 at best. Do you actually read their messages or just react?" };
    return { title: "Complete Stranger", desc: "Are you sure you're in the right chat? This is embarrassing." };
  };

  return (
    <Card className="glass overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircleQuestion className="w-5 h-5 text-primary" />
          <CardTitle>Who Said It?</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Guess who sent these real messages from your chat
        </p>
      </CardHeader>
      <CardContent>
        {!quizStarted && !finished && (
          <div className="text-center space-y-6 py-6">
            <div className="text-6xl">🤔</div>
            <div>
              <p className="text-lg font-semibold mb-2">Think you know who said what?</p>
              <p className="text-sm text-muted-foreground">
                {quizMessages.length} real messages from your chat. Guess the sender.
              </p>
            </div>
            <button
              onClick={startQuiz}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:opacity-90 transition-all hover:scale-105 active:scale-95"
            >
              Start Quiz
            </button>
          </div>
        )}

        {quizStarted && !finished && current && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Question {currentIndex + 1} / {quizMessages.length}</span>
              <span className="font-bold text-primary">{score} correct</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${((currentIndex + (answered ? 1 : 0)) / quizMessages.length) * 100}%` }}
              />
            </div>

            {/* Message bubble */}
            <div className="relative">
              <div className="bg-muted/50 border border-border/50 rounded-2xl p-6 text-center">
                <p className="text-lg leading-relaxed font-medium">"{current.text}"</p>
              </div>
            </div>

            {/* Answer buttons */}
            <div className="grid grid-cols-2 gap-3">
              {participants.map(p => {
                let btnClass = "p-4 rounded-xl border-2 text-center font-semibold transition-all duration-300 ";
                if (!answered) {
                  btnClass += "border-border hover:border-primary hover:bg-primary/5 cursor-pointer active:scale-95";
                } else if (p === current.sender) {
                  btnClass += "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400";
                } else if (p === answered && !isCorrect) {
                  btnClass += "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400";
                } else {
                  btnClass += "border-border/30 opacity-50";
                }

                return (
                  <button key={p} onClick={() => handleAnswer(p)} className={btnClass} disabled={!!answered}>
                    <span className="flex items-center justify-center gap-2">
                      {answered && p === current.sender && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {answered && p === answered && !isCorrect && <XCircle className="w-4 h-4 text-red-500" />}
                      <span className="truncate">{p}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Feedback + Next */}
            {answered && (
              <div className="text-center space-y-3 animate-slide-up">
                <p className={`text-lg font-bold ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                  {isCorrect ? '✓ Nailed it!' : `✗ It was ${current.sender}`}
                </p>
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-all"
                >
                  {currentIndex + 1 >= quizMessages.length ? 'See Results' : 'Next →'}
                </button>
              </div>
            )}
          </div>
        )}

        {finished && (
          <div className="text-center space-y-6 py-4 animate-slide-up">
            <Trophy className="w-16 h-16 mx-auto text-amber" />
            <div>
              <p className="text-5xl font-black font-display mb-2">{score}/{quizMessages.length}</p>
              <p className="text-sm text-muted-foreground">{scorePercent}% accuracy</p>
            </div>

            <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
              <p className="font-bold text-lg text-primary mb-1">{getScoreVerdict().title}</p>
              <p className="text-sm text-muted-foreground">{getScoreVerdict().desc}</p>
            </div>

            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-muted hover:bg-muted/80 rounded-lg font-semibold transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
