export interface Message {
  date: Date;
  sender: string;
  text: string;
}

export interface AnalysisData {
  participants: string[];
  totalMessages: number;
  dateRange: { start: Date; end: Date };
  
  // Power Dynamics
  avgResponseTimes: Record<string, number | null>;
  initiatorCounts: Record<string, number>;
  doubleTextRatios: Record<string, number>;
  
  // Emotional Timeline
  sentimentDays: SentimentDay[];
  laughterCounts: Record<string, number>;
  wordUsage: { month: string; count: number }[];
  
  // Deep Patterns
  circadianData: { hour: number; count: number }[];
  attachmentStyle: { avgWords: Record<string, number>; labels: Record<string, string> };
  
  // Heartbeat / Message frequency
  messagesByMonth: { month: string; [key: string]: number | string }[];
  
  // Ghost Hours
  heatmapData: { day: string; hours: { hour: number; value: number }[] }[];
}

export interface SentimentDay {
  day: string;
  happy: number;
  tension: number;
  tag: 'happy' | 'tension' | 'neutral';
}
