import { useState, useCallback } from "react";
import { Upload, FileText, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
}

export const UploadZone = ({ onFileUpload }: UploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileUpload(file);
  }, [onFileUpload]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-72 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300",
          isDragging
            ? "border-primary bg-primary/10 scale-[1.02]"
            : "border-border hover:border-primary/50 hover:bg-card/50 glass"
        )}
      >
        <input
          type="file"
          className="hidden"
          accept=".txt,.zip"
          onChange={handleFileInput}
        />
        
        <div className={cn(
          "flex flex-col items-center gap-4 transition-transform duration-300",
          isDragging && "scale-110"
        )}>
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-slow" />
            <div className="relative p-5 rounded-full bg-gradient-to-br from-coral to-rose">
              <Upload className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">
              Drop your chat export here
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              WhatsApp (.txt) or iMessage export
            </p>
          </div>
        </div>

        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            .txt or .zip files
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            Processed locally
          </span>
        </div>
      </label>
    </div>
  );
};
