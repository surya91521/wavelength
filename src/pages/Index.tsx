import { useState } from "react";
import { Heart, Waves } from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { AnalysisLoader } from "@/components/AnalysisLoader";
import { HeartbeatGraph } from "@/components/HeartbeatGraph";
import { PowerDynamic } from "@/components/PowerDynamic";
import { GhostHours } from "@/components/GhostHours";
import { SlangConvergence } from "@/components/SlangConvergence";
import { DeepDiveCTA } from "@/components/DeepDiveCTA";
import { toast } from "sonner";

type Stage = "upload" | "analyzing" | "results";

const Index = () => {
  const [stage, setStage] = useState<Stage>("upload");

  const handleFileUpload = (file: File) => {
    toast.success(`Uploaded: ${file.name}`);
    setStage("analyzing");
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
                onClick={() => setStage("upload")}
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
                    Upload your chat history and discover hidden patterns in how 
                    you communicate with the people you love.
                  </p>
                </div>

                <UploadZone onFileUpload={handleFileUpload} />

                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  {[
                    { 
                      title: "Power Dynamics",
                      description: "See who texts first and puts in more effort",
                    },
                    { 
                      title: "Ghost Hours",
                      description: "Discover when you really talk (2 AM vs 2 PM)",
                    },
                    { 
                      title: "Language Sync",
                      description: "Find out how your vocabulary has merged",
                    },
                  ].map((feature, i) => (
                    <div 
                      key={feature.title}
                      className="text-center p-6 glass rounded-2xl"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <h3 className="font-display font-semibold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stage === "analyzing" && (
              <AnalysisLoader onComplete={handleAnalysisComplete} />
            )}

            {stage === "results" && (
              <div className="py-12 space-y-8">
                <div className="text-center mb-12 animate-slide-up">
                  <p className="text-sm text-muted-foreground mb-2">Analysis complete</p>
                  <h2 className="font-display text-3xl md:text-4xl font-bold">
                    Your <span className="gradient-text">Wavelength</span> Report
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <HeartbeatGraph />
                  <PowerDynamic />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GhostHours />
                  <SlangConvergence />
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
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
