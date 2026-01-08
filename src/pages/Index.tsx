import { useState } from "react";
import { Heart, Waves } from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { AnalysisLoader } from "@/components/AnalysisLoader";
import { HeartbeatGraph } from "@/components/HeartbeatGraph";
import { PowerDynamic } from "@/components/PowerDynamic";
import { GhostHours } from "@/components/GhostHours";
import { SentimentHeatmap } from "@/components/SentimentHeatmap";
import { LaughterScore } from "@/components/LaughterScore";
import { CircadianRhythm } from "@/components/CircadianRhythm";
import { AttachmentStyle } from "@/components/AttachmentStyle";
import { WrappedShareables } from "@/components/WrappedShareables";
import { DeleterRatio } from "@/components/DeleterRatio";
import { CuriosityGap } from "@/components/CuriosityGap";
import { PodcastMode } from "@/components/PodcastMode";
import { EmojiDNA } from "@/components/EmojiDNA";
import { SearchParty } from "@/components/SearchParty";
import { ProfanityFilter } from "@/components/ProfanityFilter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { parseWhatsAppText, parseWhatsAppZip } from "@/lib/whatsappParser";
import * as analytics from "@/lib/analytics";
import type { AnalysisData, Message } from "@/lib/types";

type Stage = "upload" | "analyzing" | "results";

const Index = () => {
  const [stage, setStage] = useState<Stage>("upload");
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const analyzeMessages = (messages: Message[]): AnalysisData => {
    const parts = analytics.participants(messages);
    const slangWords = analytics.findTopSlangWords(messages);
    const topSlang = slangWords.length > 0 ? slangWords[0].word : 'lol';
    
    return {
      participants: parts,
      totalMessages: messages.length,
      dateRange: {
        start: messages[0]?.date || new Date(),
        end: messages[messages.length - 1]?.date || new Date(),
      },
      avgResponseTimes: analytics.averageResponseTimes(messages),
      initiatorCounts: analytics.initiatorAfterSilence(messages),
      doubleTextRatios: analytics.doubleTextRatio(messages),
      sentimentDays: analytics.sentimentByDay(messages),
      laughterCounts: analytics.laughterScore(messages),
      wordUsage: analytics.wordUsageOverTime(messages, topSlang),
      circadianData: analytics.circadianEmotional(messages),
      attachmentStyle: analytics.attachmentStyle(messages),
      messagesByMonth: analytics.messagesByMonth(messages),
      messagesByYear: analytics.messagesByYear(messages),
      heatmapData: analytics.heatmapByDayHour(messages),
      topWords: analytics.getTopWords(messages),
      slangWords: slangWords,
      theFirsts: [],
      onThisDay: [],
      deleterStats: analytics.deleterRatio(messages),
      curiosityStats: analytics.curiosityGap(messages),
      podcastStats: analytics.podcastMode(messages),
      emojiStats: analytics.emojiDNA(messages),
      profanityStats: analytics.profanityCount(messages),
    };
  };

  const handleFileUpload = async (file: File) => {
    toast.success(`Uploaded: ${file.name}`);
    setStage("analyzing");

    try {
      let messages: Message[];
      if (file.name.endsWith('.zip')) {
        messages = await parseWhatsAppZip(file);
      } else {
        const text = await file.text();
        messages = parseWhatsAppText(text);
      }

      if (messages.length < 10) {
        toast.error("Not enough messages found. Please upload a valid WhatsApp export.");
        setStage("upload");
        return;
      }

      // Filter out messages from "You" if present, as requested to avoid confusion
      messages = messages.filter(m => m.sender !== "You");

      setMessages(messages);
      const data = analyzeMessages(messages);
      setAnalysisData(data);
      toast.success(`Analyzed ${messages.length.toLocaleString()} messages!`);
    } catch (error) {
      console.error("Parse error:", error);
      toast.error("Failed to parse chat. Please check the file format.");
      setStage("upload");
    }
  };

  const handleAnalysisComplete = () => {
    setStage("results");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-coral/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-rose/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-amber/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative">
        {/* Header */}
        <header className="py-8 px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Waves className="w-8 h-8 text-primary" />
                <Heart className="w-3 h-3 text-rose absolute -bottom-0.5 -right-0.5 fill-rose" />
              </div>
              <span className="font-display text-xl font-bold gradient-text">Wavelength</span>
            </div>
            {stage === "results" && (
              <button 
                onClick={() => { setStage("upload"); setAnalysisData(null); setMessages([]); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Analyze another chat
              </button>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            {stage === "upload" && (
              <div className="py-20">
                <div className="text-center mb-12 animate-slide-up">
                  <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
                    See the <span className="gradient-text">wavelength</span> of
                    <br />your relationship
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                    Upload your WhatsApp chat export and discover hidden patterns in how 
                    you communicate with the people you love.
                  </p>
                  <div className="flex justify-center mt-6">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 font-medium text-sm animate-fade-in shadow-sm">
                       <span className="relative flex h-2.5 w-2.5 mr-1">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                       </span>
                       Super Safe: Your chats are processed 100% locally on your device.
                    </div>
                  </div>
                </div>

                <UploadZone onFileUpload={handleFileUpload} />

                <div className="max-w-xl mx-auto mt-12 bg-secondary/30 border border-primary/20 rounded-xl shadow-sm overflow-hidden animate-fade-in">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="item-1" className="border-none px-6">
                      <AccordionTrigger className="text-base font-medium py-4 hover:no-underline hover:text-primary transition-colors">
                        How do I export my chat history?
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 text-sm text-muted-foreground text-left pb-4">
                          <div>
                            <p className="font-semibold text-foreground mb-1">Android</p>
                            <p>Open chat &gt; Tap More options (three dots) &gt; More &gt; Export chat &gt; <span className="font-exuberant text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">Without Media</span></p>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground mb-1">iPhone</p>
                            <p>Open chat &gt; Tap contact name at top &gt; Scroll down &gt; Export Chat &gt; <span className="font-exuberant text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">Without Media</span></p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  {[
                    { title: "Power Dynamics", description: "See who texts first and puts in more effort" },
                    { title: "Emotional Timeline", description: "Track your relationship's sentiment over time" },
                    { title: "Deep Patterns", description: "Discover your communication rhythms" },
                  ].map((feature, i) => (
                    <div 
                      key={feature.title}
                      className="text-center p-6 glass rounded-2xl"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <h3 className="font-display font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stage === "analyzing" && (
              <AnalysisLoader onComplete={handleAnalysisComplete} />
            )}

            {stage === "results" && analysisData && (
              <div className="py-12 space-y-12">
                <div className="text-center mb-12 animate-slide-up">
                  <p className="text-sm text-muted-foreground mb-2">
                    Analyzed {analysisData.totalMessages.toLocaleString()} messages
                  </p>
                  <h2 className="font-display text-3xl md:text-4xl font-bold">
                    Your <span className="gradient-text">Wavelength</span> Report
                  </h2>
                </div>

                {/* Power Dynamics */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <HeartbeatGraph data={analysisData.messagesByMonth} participants={analysisData.participants} />
                    <PowerDynamic 
                      participants={analysisData.participants}
                      avgResponseTimes={analysisData.avgResponseTimes}
                      initiatorCounts={analysisData.initiatorCounts}
                      doubleTextRatios={analysisData.doubleTextRatios}
                      totalMessages={analysisData.totalMessages}
                    />
                  </div>
                </div>

                {/* Petty Metrics: Deleter Ratio */}
                <div className="space-y-6">
                  <DeleterRatio stats={analysisData.deleterStats} participants={analysisData.participants} />
                </div>

                {/* Emotional Timeline */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SentimentHeatmap sentimentDays={analysisData.sentimentDays} />
                    <LaughterScore laughterCounts={analysisData.laughterCounts} participants={analysisData.participants} />
                  </div>
                </div>

                {/* Petty Metrics: Curiosity Gap */}
                <div className="space-y-6">
                  <CuriosityGap stats={analysisData.curiosityStats} participants={analysisData.participants} />
                </div>

                {/* Deep Patterns */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <GhostHours data={analysisData.heatmapData} />
                    <CircadianRhythm circadianData={analysisData.circadianData} />
                  </div>
                  <AttachmentStyle attachmentStyle={analysisData.attachmentStyle} participants={analysisData.participants} />
                </div>

                {/* Petty Metrics: Podcast Mode */}
                <div className="space-y-6">
                  <PodcastMode stats={analysisData.podcastStats} participants={analysisData.participants} />
                </div>

                {/* Petty Metrics: Emoji DNA & Search Party */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <EmojiDNA stats={analysisData.emojiStats} participants={analysisData.participants} />
                    <SearchParty messages={messages} participants={analysisData.participants} />
                  </div>
                  <ProfanityFilter messages={messages} participants={analysisData.participants} />
                </div>

                {/* Wrapped Shareables */}
                <WrappedShareables data={analysisData} />
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-border/50">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
