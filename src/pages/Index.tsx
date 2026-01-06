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
import { VocabularyMerger } from "@/components/VocabularyMerger";
import { DeepDiveCTA } from "@/components/DeepDiveCTA";
import { toast } from "sonner";
import { parseWhatsAppText, parseWhatsAppZip } from "@/lib/whatsappParser";
import * as analytics from "@/lib/analytics";
import type { AnalysisData, Message } from "@/lib/types";

type Stage = "upload" | "analyzing" | "results";

const Index = () => {
  const [stage, setStage] = useState<Stage>("upload");
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

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
      heatmapData: analytics.heatmapByDayHour(messages),
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

  const slangWords = analysisData ? analytics.findTopSlangWords([]) : [];

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
                onClick={() => { setStage("upload"); setAnalysisData(null); }}
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
                    See the <span className="gradient-text">heartbeat</span> of
                    <br />your relationship
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                    Upload your WhatsApp chat export and discover hidden patterns in how 
                    you communicate with the people you love.
                  </p>
                </div>

                <UploadZone onFileUpload={handleFileUpload} />

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
              <div className="py-12 space-y-8">
                <div className="text-center mb-12 animate-slide-up">
                  <p className="text-sm text-muted-foreground mb-2">
                    Analyzed {analysisData.totalMessages.toLocaleString()} messages
                  </p>
                  <h2 className="font-display text-3xl md:text-4xl font-bold">
                    Your <span className="gradient-text">Wavelength</span> Report
                  </h2>
                </div>

                {/* Module 1: Power Dynamics */}
                <div className="space-y-2">
                  <h3 className="text-lg font-display font-semibold text-muted-foreground">Module 1: Power Dynamics</h3>
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

                {/* Module 2: Emotional Timeline */}
                <div className="space-y-2">
                  <h3 className="text-lg font-display font-semibold text-muted-foreground">Module 2: Emotional Timeline</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SentimentHeatmap sentimentDays={analysisData.sentimentDays} />
                    <LaughterScore laughterCounts={analysisData.laughterCounts} participants={analysisData.participants} />
                  </div>
                  <VocabularyMerger 
                    slangWords={analytics.findTopSlangWords([])} 
                    wordUsage={analysisData.wordUsage}
                    participants={analysisData.participants}
                  />
                </div>

                {/* Module 3: Deep Patterns */}
                <div className="space-y-2">
                  <h3 className="text-lg font-display font-semibold text-muted-foreground">Module 3: Deep Patterns</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <GhostHours data={analysisData.heatmapData} />
                    <CircadianRhythm circadianData={analysisData.circadianData} />
                  </div>
                  <AttachmentStyle attachmentStyle={analysisData.attachmentStyle} participants={analysisData.participants} />
                </div>

                <DeepDiveCTA />
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-border/50">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2024 Wavelength. All chats are processed locally.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
