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
  messagesByYear: { year: string; [key: string]: number | string }[];
  
  // Ghost Hours
  heatmapData: { day: string; hours: { hour: number; value: number }[] }[];
  
  // Extra
  topWords: { word: string; count: number }[];
  slangWords: { word: string; firstUsedBy: string; firstDate: Date; adopted: boolean }[];
  
  // Nostalgia Trip
  theFirsts: FirstMessage[];
  onThisDay: OnThisDayMessage[];
  
  // Petty Metrics
  deleterStats: Record<string, { deleted: number; total: number; ratio: number }>;
  curiosityStats: {
    questions: Record<string, number>;
    dryTexts: Record<string, number>;
    questionRatio: Record<string, number>;
    dryTextRatio: Record<string, number>;
  };
  podcastStats: Record<string, { count: number; estimatedHours: number }>;
  emojiStats: {
    emojiUsage: Record<string, Record<string, number>>;
    uniqueEmojis: Record<string, string[]>;
    redFlags: Record<string, number>;
  };
  profanityStats: Record<string, { total: number; topWords: { word: string; count: number }[] }>;

  // New Features
  streakData: import('./analytics').StreakData;
  convoKillerData: import('./analytics').ConvoKillerData;
  firstVsNowData: import('./analytics').FirstVsNowData | null;
  wavelengthScore: import('./analytics').WavelengthScoreResult;
  flagData: { green: import('./analytics').Flag[]; red: import('./analytics').Flag[] };
}

export interface SentimentDay {
  day: string;
  happy: number;
  tension: number;
  tag: 'happy' | 'tension' | 'neutral';
}

// Nostalgia Trip Types
export interface FirstMessage {
  type: 'first' | 'firstSorry' | 'firstLove' | 'firstNickname';
  message: Message;
  label: string;
  yearsAgo?: number;
  description?: string;
}

export interface OnThisDayMessage {
  message: Message;
  yearsAgo: number;
  date: Date;
}

// Re-export analytics types for convenience
export type { QuizMessage, StreakData, ConvoKillerData, FirstVsNowData, PeriodStats, WavelengthScoreResult, Flag } from './analytics';
