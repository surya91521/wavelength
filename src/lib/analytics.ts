import { format } from 'date-fns';
import type { Message, SentimentDay, FirstMessage, OnThisDayMessage } from './types';

export function participants(messages: Message[]): string[] {
  const set = new Set(messages.map(m => m.sender));
  return Array.from(set);
}

export function averageResponseTimes(messages: Message[]): Record<string, number | null> {
  const parts = participants(messages);
  const times: Record<string, number> = {};
  const counts: Record<string, number> = {};
  
  // Initialize for all participants
  parts.forEach(p => {
      times[p] = 0;
      counts[p] = 0;
  });

  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1];
    const curr = messages[i];
    if (prev.sender !== curr.sender) {
      const delta = (curr.date.getTime() - prev.date.getTime()) / 60000; // minutes
      // Filter out conversations overlaps (too short) or long breaks (sleep/work)
      // Responses usually > 5 seconds and < 8 hours
      if (delta > 0.1 && delta < 480) { 
        const key = curr.sender;
        times[key] = (times[key] || 0) + delta;
        counts[key] = (counts[key] || 0) + 1;
      }
    }
  }
  const result: Record<string, number | null> = {};
  parts.forEach(p => {
    result[p] = counts[p] > 0 ? times[p] / counts[p] : null;
  });
  return result;
}

export function initiatorAfterSilence(messages: Message[], thresholdHours = 24): Record<string, number> {
  const counts: Record<string, number> = {};
  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1];
    const curr = messages[i];
    const gapHrs = (curr.date.getTime() - prev.date.getTime()) / 3600000;
    if (gapHrs >= thresholdHours) {
      counts[curr.sender] = (counts[curr.sender] || 0) + 1;
    }
  }
  return counts;
}

export function doubleTextRatio(messages: Message[]): Record<string, number> {
  // sequences of same sender length >= 2
  const seqs: Record<string, number> = {};
  let i = 0;
  while (i < messages.length) {
    const sender = messages[i].sender;
    let len = 1;
    let j = i + 1;
    while (j < messages.length && messages[j].sender === sender) {
      len++;
      j++;
    }
    if (len >= 2) seqs[sender] = (seqs[sender] || 0) + 1;
    i = j;
  }
  const totals: Record<string, number> = {};
  for (const m of messages) totals[m.sender] = (totals[m.sender] || 0) + 1;
  const ratios: Record<string, number> = {};
  Object.keys(seqs).forEach(k => {
    // per 100 messages for comparability
    ratios[k] = (seqs[k] / (totals[k] || 1)) * 100;
  });
  return ratios;
}

export function wordUsageOverTime(messages: Message[], word: string): { month: string; count: number }[] {
  const lower = word.toLowerCase();
  const map: Record<string, { total: number }> = {};
  for (const m of messages) {
    const key = format(m.date, 'yyyy-MM');
    const cnt = (m.text.toLowerCase().match(new RegExp(`\\b${lower}\\b`, 'g')) || []).length;
    if (!map[key]) map[key] = { total: 0 };
    map[key].total += cnt;
  }
  return Object.entries(map).map(([month, data]) => ({ month, count: data.total }));
}

const sentimentKeywords = {
  happy: [
    /\b(lol|lmao|rofl|haha)\b/gi,
    /(😂|🤣|😹|😆|😉|😊|😍|🥰|😻|❤️|💕|💓|💗|💖|💘|💝|💞|💟)/g
  ],
  tension: [
    /\b(sorry|ugh|stop|mad|angry|fight|annoyed|hate)\b/gi,
    /(😡|😠|🤬|👎|😤|😒|🙄|💔|😢|😭|😓|😔)/g
  ],
};

export function sentimentByDay(messages: Message[]): SentimentDay[] {
  const days: Record<string, { happy: number; tension: number }> = {};
  for (const m of messages) {
    const day = format(m.date, 'yyyy-MM-dd');
    if (!days[day]) days[day] = { happy: 0, tension: 0 };
    for (const k of Object.keys(sentimentKeywords) as (keyof typeof sentimentKeywords)[]) {
      const rules = sentimentKeywords[k];
      for (const r of rules) {
        const matches = m.text.match(r);
        if (matches) days[day][k] += matches.length;
      }
    }
  }
  const result = Object.entries(days).map(([day, s]) => {
    let tag: 'happy' | 'tension' | 'neutral' = 'neutral';
    if (s.tension > s.happy && s.tension > 0) tag = 'tension';
    else if (s.happy > 0) tag = 'happy';
    return { day, happy: s.happy, tension: s.tension, tag };
  });
  return result;
}

export function laughterScore(messages: Message[]): Record<string, number> {
  const lrx = /(haha+|lol+|lmao+|rofl+|😂|🤣|😹|😆)/gi;
  const count: Record<string, number> = {};
  for (const m of messages) {
    const n = (m.text.match(lrx) || []).length;
    count[m.sender] = (count[m.sender] || 0) + n;
  }
  return count;
}

export function circadianEmotional(messages: Message[]): { hour: number; count: number }[] {
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  const emotional = /(lol|lmao|rofl|haha|sorry|ugh|stop|mad|angry|fight|annoyed|hate)/i;
  for (const m of messages) {
    if (emotional.test(m.text)) {
      const h = m.date.getHours();
      hours[h].count += 1;
    }
  }
  return hours;
}

export function attachmentStyle(messages: Message[]): { avgWords: Record<string, number>; labels: Record<string, string> } {
  const totals: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const m of messages) {
    const words = m.text.trim().split(/\s+/).filter(Boolean).length;
    totals[m.sender] = (totals[m.sender] || 0) + words;
    counts[m.sender] = (counts[m.sender] || 0) + 1;
  }
  const avg: Record<string, number> = {};
  Object.keys(totals).forEach(k => {
    avg[k] = counts[k] ? totals[k] / counts[k] : 0;
  });
  const labels: Record<string, string> = {};
  Object.keys(avg).forEach(k => {
    labels[k] = avg[k] >= 12 ? 'Storyteller' : 'Editor';
  });
  return { avgWords: avg, labels };
}

// Additional analytics for UI
export function messagesByMonth(messages: Message[]): { month: string; [key: string]: number | string }[] {
  if (messages.length === 0) return [];

  // Filter out invalid historical dates (WhatsApp launched 2009) and future dates
  const now = new Date();
  const validMessages = messages.filter(m => {
    const y = m.date.getFullYear();
    return y >= 2009 && m.date <= now;
  });

  if (validMessages.length === 0) return [];

  const participantsSet = new Set(validMessages.map(m => m.sender));
  const participants = Array.from(participantsSet);

  // Determine range from first message to today
  const sorted = [...validMessages].sort((a, b) => a.date.getTime() - b.date.getTime());
  const start = new Date(sorted[0].date.getFullYear(), sorted[0].date.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);

  // Precompute counts per sender per month key 'yyyy-MM'
  const counts: Record<string, Record<string, number>> = {};
  for (const m of validMessages) {
    const key = `${m.date.getFullYear().toString().padStart(4, '0')}-${(m.date.getMonth()+1).toString().padStart(2, '0')}`;
    if (!counts[key]) counts[key] = {};
    counts[key][m.sender] = (counts[key][m.sender] || 0) + 1;
  }

  // Build contiguous month list from start to end
  const result: { month: string; [key: string]: number | string }[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = `${cursor.getFullYear().toString().padStart(4, '0')}-${(cursor.getMonth()+1).toString().padStart(2, '0')}`;
    const pretty = format(cursor, 'MMM yyyy');
    const entry: { month: string; [key: string]: number | string } = { month: pretty };
    for (const p of participants) {
      entry[p] = (counts[key]?.[p] || 0);
    }
    result.push(entry);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return result;
}

export function messagesByYear(messages: Message[]): { year: string; [key: string]: number | string }[] {
  if (messages.length === 0) return [];

  const participantsSet = new Set(messages.map(m => m.sender));
  const participants = Array.from(participantsSet);

  const sorted = [...messages].sort((a, b) => a.date.getTime() - b.date.getTime());
  const startYear = sorted[0].date.getFullYear();
  const endYear = new Date().getFullYear();

  // counts per year
  const counts: Record<string, Record<string, number>> = {};
  for (const m of messages) {
    const key = `${m.date.getFullYear()}`;
    if (!counts[key]) counts[key] = {};
    counts[key][m.sender] = (counts[key][m.sender] || 0) + 1;
  }

  const result: { year: string; [key: string]: number | string }[] = [];
  for (let y = startYear; y <= endYear; y++) {
    const key = `${y}`;
    const entry: { year: string; [key: string]: number | string } = { year: key };
    for (const p of participants) {
      entry[p] = counts[key]?.[p] || 0;
    }
    result.push(entry);
  }
  return result;
}

export function heatmapByDayHour(messages: Message[]): { day: string; hours: { hour: number; value: number }[] }[] {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const grid: Record<string, number[]> = {};
  for (const dayName of dayNames) {
    grid[dayName] = Array(24).fill(0);
  }
  for (const m of messages) {
    const dayIndex = m.date.getDay();
    const dayName = dayNames[dayIndex];
    const hour = m.date.getHours();
    grid[dayName][hour]++;
  }
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
    day,
    hours: grid[day].map((value, hour) => ({ hour, value })),
  }));
}

export function findTopSlangWords(messages: Message[]): { word: string; firstUsedBy: string; firstDate: Date; adopted: boolean }[] {
  const slangWords = ['lowkey', 'highkey', 'slay', 'bet', 'fr', 'no cap', 'goat', 'bussin', 'vibe', 'sus', 'lit', 'fam', 'bruh', 'periodt', 'oof', 'yeet', 'stan', 'simp', 'snatched'];
  const results: { word: string; firstUsedBy: string; firstDate: Date; adopted: boolean }[] = [];
  
  for (const word of slangWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    const usageByPerson: Record<string, Date[]> = {};
    
    for (const m of messages) {
      if (regex.test(m.text)) {
        if (!usageByPerson[m.sender]) usageByPerson[m.sender] = [];
        usageByPerson[m.sender].push(m.date);
      }
    }
    
    const users = Object.keys(usageByPerson);
    if (users.length > 0) {
      // Find who used it first
      let firstUser = users[0];
      let firstDate = usageByPerson[firstUser][0];
      for (const user of users) {
        if (usageByPerson[user][0] < firstDate) {
          firstUser = user;
          firstDate = usageByPerson[user][0];
        }
      }
      results.push({
        word,
        firstUsedBy: firstUser,
        firstDate,
        adopted: users.length > 1,
      });
    }
  }
  return results.sort((a, b) => a.firstDate.getTime() - b.firstDate.getTime()).slice(0, 5);
}

export function getTopWords(messages: Message[], limit = 20): { word: string; count: number }[] {
  const stopWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
      'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
      'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
      'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well',
      'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'are', 'is', 'was', 'were', 'had', 'has', 'been',
      'omitted', 'image', 'video', 'gif', 'sticker', 'audio', 'media'
  ]);

  const counts: Record<string, number> = {};
  
  for (const m of messages) {
      // split by non-word characters, allow apostrophes inside words? simplified:
      const words = m.text.toLowerCase().split(/[^\w']+/);
      for (const w of words) {
          if (w.length > 2 && !stopWords.has(w) && !/^\d+$/.test(w)) {
              counts[w] = (counts[w] || 0) + 1;
          }
      }
  }

  return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word, count]) => ({ word, count }));
}

export function getBestMonth(sentimentDays: { day: string; tag: string }[]): { month: string; happyDays: number } | null {
  const byMonth: Record<string, number> = {};
  for (const d of sentimentDays) {
    const month = d.day.slice(0, 7); // yyyy-MM
    if (d.tag === 'happy') {
      byMonth[month] = (byMonth[month] || 0) + 1;
    }
  }
  const entries = Object.entries(byMonth);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return { month: entries[0][0], happyDays: entries[0][1] };
}

// Nostalgia Trip Analytics

export function findTheFirsts(messages: Message[], participants: string[]): FirstMessage[] {
  const firsts: FirstMessage[] = [];
  
  if (messages.length === 0) return firsts;
  
  // The First Message
  const firstMessage = messages[0];
  firsts.push({
    type: 'first',
    message: firstMessage,
    label: 'The First Message',
    yearsAgo: getYearsAgo(firstMessage.date)
  });
  
  // Find messages that made people laugh (the message BEFORE the laughter response)
  const laughterPattern = /(haha+|lol+|lmao+|rofl+|😂|🤣|😹|😆|😭|💀|pfft|hahaha)/gi;
  const isOnlyLaughter = (text: string) => {
    // Check if message is ONLY laughter (no meaningful text)
    const textWithoutLaughter = text.replace(laughterPattern, '').trim();
    return textWithoutLaughter.length < 3; // Less than 3 characters of actual text
  };
  
  const messagesThatMadePeopleLaugh: Array<{ message: Message; score: number }> = [];
  
  for (let i = 1; i < messages.length; i++) {
    const currentMsg = messages[i];
    
    // If current message is a laughter response, look backwards for what triggered it
    if (isOnlyLaughter(currentMsg.text) || laughterPattern.test(currentMsg.text)) {
      // Look backwards to find the message that triggered this laughter
      for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
        const previousMsg = messages[j];
        const timeDiff = (currentMsg.date.getTime() - previousMsg.date.getTime()) / 60000; // minutes
        
        // Must be from different person and within 15 minutes
        if (timeDiff <= 15 && previousMsg.sender !== currentMsg.sender) {
          // Don't count if the previous message is also just laughter
          if (!isOnlyLaughter(previousMsg.text)) {
            const laughterMatches = currentMsg.text.match(laughterPattern);
            const score = laughterMatches ? laughterMatches.length : 1;
            
            // Check if subsequent messages also have laughter (chain reaction)
            let chainScore = score;
            for (let k = i + 1; k < Math.min(i + 3, messages.length); k++) {
              const nextMsg = messages[k];
              const nextTimeDiff = (nextMsg.date.getTime() - currentMsg.date.getTime()) / 60000;
              if (nextTimeDiff <= 5 && (isOnlyLaughter(nextMsg.text) || laughterPattern.test(nextMsg.text))) {
                const nextLaughter = nextMsg.text.match(laughterPattern);
                if (nextLaughter) chainScore += nextLaughter.length;
              } else {
                break;
              }
            }
            
            messagesThatMadePeopleLaugh.push({ message: previousMsg, score: chainScore });
            break; // Found the trigger, stop looking backwards
          }
        } else {
          break; // Time gap too large, stop looking
        }
      }
    }
  }
  
  // Get the message that triggered the most laughter (but not the first message)
  if (messagesThatMadePeopleLaugh.length > 0) {
    const sorted = messagesThatMadePeopleLaugh.sort((a, b) => b.score - a.score);
    const bestLaugh = sorted.find(m => m.message !== firstMessage) || sorted[0];
    firsts.push({
      type: 'firstSorry', // Reusing type for "made them laugh"
      message: bestLaugh.message,
      label: 'Made Them Laugh',
      yearsAgo: getYearsAgo(bestLaugh.message.date)
    });
  }
  
  // Find highly emotional/vulnerable messages
  const emotionalPatterns = [
    /\b(i feel|i'm feeling|i've been|i was|i am|i think|i believe|i hope|i wish|i want|i need)\b/i,
    /\b(thank you|thanks|grateful|appreciate|means a lot|so much|forever|always|never)\b/i,
    /\b(miss you|thinking of you|care about|worry about|concerned|sorry|apologize)\b/i,
    /(❤️|💕|💖|💗|💘|💝|💞|💟|😍|🥰|😊|😌|😢|😭|🥺)/,
  ];
  
  const emotionalMessages: Array<{ message: Message; score: number }> = [];
  
  for (const msg of messages) {
    let emotionalScore = 0;
    const text = msg.text;
    
    // Check for emotional patterns
    for (const pattern of emotionalPatterns) {
      const matches = text.match(pattern);
      if (matches) emotionalScore += matches.length;
    }
    
    // Bonus for longer messages (more thoughtful)
    if (text.length > 50) emotionalScore += 1;
    if (text.length > 100) emotionalScore += 1;
    
    // Bonus for messages with multiple sentences (more thoughtful)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 2) emotionalScore += 1;
    
    // Only include if it's meaningful (score >= 2)
    if (emotionalScore >= 2) {
      emotionalMessages.push({ message: msg, score: emotionalScore });
    }
  }
  
  // Get the most emotional message (but not the first one, get a meaningful one)
  if (emotionalMessages.length > 0) {
    const sortedEmotional = emotionalMessages.sort((a, b) => b.score - a.score);
    // Skip the first message if it's the very first one, get the next best
    const bestEmotional = sortedEmotional.find(m => m.message !== firstMessage) || sortedEmotional[0];
    firsts.push({
      type: 'firstLove', // Reusing type for "emotional"
      message: bestEmotional.message,
      label: 'An Emotional Moment',
      yearsAgo: getYearsAgo(bestEmotional.message.date)
    });
  }
  
  // Find messages with lots of laughter BUT exclude messages that are ONLY emojis
  // We want actual funny text, not just emoji reactions
  const funnyMessages: Array<{ message: Message; score: number }> = [];
  
  for (const msg of messages) {
    // Skip if message is only laughter/emojis
    if (isOnlyLaughter(msg.text)) continue;
    
    const laughterMatches = msg.text.match(laughterPattern);
    // Message should have some laughter but also actual text content
    if (laughterMatches && laughterMatches.length >= 1) {
      const textWithoutLaughter = msg.text.replace(laughterPattern, '').trim();
      // Must have at least 10 characters of actual text (not just emojis)
      if (textWithoutLaughter.length >= 10) {
        funnyMessages.push({ message: msg, score: laughterMatches.length + textWithoutLaughter.length });
      }
    }
  }
  
  if (funnyMessages.length > 0) {
    const funniest = funnyMessages.sort((a, b) => b.score - a.score)[0];
    firsts.push({
      type: 'firstNickname', // Reusing type for "funny"
      message: funniest.message,
      label: 'The Funniest Message',
      yearsAgo: getYearsAgo(funniest.message.date)
    });
  }
  
  return firsts;
}

export function findOnThisDay(messages: Message[]): OnThisDayMessage[] {
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();
  
  const onThisDay: OnThisDayMessage[] = [];
  const seenYears = new Set<number>();
  
  // Find messages from the same month and date in previous years
  for (const msg of messages) {
    const msgMonth = msg.date.getMonth();
    const msgDate = msg.date.getDate();
    const msgYear = msg.date.getFullYear();
    const yearsAgo = today.getFullYear() - msgYear;
    
    // Only include if it's the same month and date, and at least 1 year ago
    if (msgMonth === todayMonth && msgDate === todayDate && yearsAgo >= 1 && !seenYears.has(yearsAgo)) {
      onThisDay.push({
        message: msg,
        yearsAgo,
        date: msg.date
      });
      seenYears.add(yearsAgo);
    }
  }
  
  // Sort by years ago (most recent first)
  return onThisDay.sort((a, b) => a.yearsAgo - b.yearsAgo).slice(0, 5); // Limit to 5
}

function getYearsAgo(date: Date): number {
  const today = new Date();
  const years = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    return years - 1;
  }
  return years;
}

// Petty Metrics Analytics

// 1. Deleter Ratio
export function deleterRatio(messages: Message[]): Record<string, { deleted: number; total: number; ratio: number }> {
  const deletedPattern = /this message was deleted|message deleted|deleted this message/i;
  const stats: Record<string, { deleted: number; total: number }> = {};
  
  for (const msg of messages) {
    if (!stats[msg.sender]) {
      stats[msg.sender] = { deleted: 0, total: 0 };
    }
    stats[msg.sender].total++;
    if (deletedPattern.test(msg.text)) {
      stats[msg.sender].deleted++;
    }
  }
  
  const result: Record<string, { deleted: number; total: number; ratio: number }> = {};
  for (const [sender, data] of Object.entries(stats)) {
    result[sender] = {
      ...data,
      ratio: data.total > 0 ? (data.deleted / data.total) * 100 : 0
    };
  }
  return result;
}

// 2. Curiosity Gap (Questions and Dry Text)
export function curiosityGap(messages: Message[]): {
  questions: Record<string, number>;
  dryTexts: Record<string, number>;
  questionRatio: Record<string, number>;
  dryTextRatio: Record<string, number>;
} {
  const questionPattern = /\?/g;
  const dryTextPattern = /^\s*(k|ok|okay|yeah|yep|yup|nice|cool|lol|lmao|haha|hmm|hmmm|y|n|yes|no|sure|alright|alrighty|aight|bet|fr|true|facts)\s*$/i;
  
  const questions: Record<string, number> = {};
  const dryTexts: Record<string, number> = {};
  const totals: Record<string, number> = {};
  
  for (const msg of messages) {
    if (!totals[msg.sender]) {
      totals[msg.sender] = 0;
      questions[msg.sender] = 0;
      dryTexts[msg.sender] = 0;
    }
    totals[msg.sender]++;
    
    const questionMatches = msg.text.match(questionPattern);
    if (questionMatches) {
      questions[msg.sender] += questionMatches.length;
    }
    
    if (dryTextPattern.test(msg.text.trim())) {
      dryTexts[msg.sender]++;
    }
  }
  
  const questionRatio: Record<string, number> = {};
  const dryTextRatio: Record<string, number> = {};
  
  for (const sender of Object.keys(totals)) {
    questionRatio[sender] = totals[sender] > 0 ? (questions[sender] / totals[sender]) * 100 : 0;
    dryTextRatio[sender] = totals[sender] > 0 ? (dryTexts[sender] / totals[sender]) * 100 : 0;
  }
  
  return { questions, dryTexts, questionRatio, dryTextRatio };
}

// 3. Podcast Mode (Voice Notes)
export function podcastMode(messages: Message[]): Record<string, { count: number; estimatedHours: number }> {
  const voicePattern = /voice message|audio omitted|ptt-|\.opus|\.ogg|\.m4a|voice note/i;
  const stats: Record<string, number> = {};
  
  for (const msg of messages) {
    if (voicePattern.test(msg.text)) {
      stats[msg.sender] = (stats[msg.sender] || 0) + 1;
    }
  }
  
  const result: Record<string, { count: number; estimatedHours: number }> = {};
  for (const [sender, count] of Object.entries(stats)) {
    // Assume average 30 seconds per voice note
    const estimatedSeconds = count * 30;
    const estimatedHours = estimatedSeconds / 3600;
    result[sender] = { count, estimatedHours };
  }
  return result;
}

// 4. Emoji DNA
export function emojiDNA(messages: Message[]): {
  emojiUsage: Record<string, Record<string, number>>;
  uniqueEmojis: Record<string, string[]>;
  redFlags: Record<string, number>;
} {
  const emojiPattern = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu;
  const redFlagEmojis = /🚩|😈|🔪|🍆|🍑|💦/g;
  
  const emojiUsage: Record<string, Record<string, number>> = {};
  const redFlags: Record<string, number> = {};
  
  for (const msg of messages) {
    if (!emojiUsage[msg.sender]) {
      emojiUsage[msg.sender] = {};
      redFlags[msg.sender] = 0;
    }
    
    const emojis = msg.text.match(emojiPattern);
    if (emojis) {
      for (const emoji of emojis) {
        emojiUsage[msg.sender][emoji] = (emojiUsage[msg.sender][emoji] || 0) + 1;
      }
    }
    
    const redFlagMatches = msg.text.match(redFlagEmojis);
    if (redFlagMatches) {
      redFlags[msg.sender] += redFlagMatches.length;
    }
  }
  
  // Find unique emojis (used >10 times by one person, 0 by others)
  const uniqueEmojis: Record<string, string[]> = {};
  const allEmojis = new Set<string>();
  
  for (const sender of Object.keys(emojiUsage)) {
    for (const emoji of Object.keys(emojiUsage[sender])) {
      allEmojis.add(emoji);
    }
  }
  
  for (const sender of Object.keys(emojiUsage)) {
    uniqueEmojis[sender] = [];
    for (const emoji of allEmojis) {
      const senderCount = emojiUsage[sender][emoji] || 0;
      if (senderCount > 10) {
        // Check if others use it
        let othersUseIt = false;
        for (const otherSender of Object.keys(emojiUsage)) {
          if (otherSender !== sender && (emojiUsage[otherSender][emoji] || 0) > 0) {
            othersUseIt = true;
            break;
          }
        }
        if (!othersUseIt) {
          uniqueEmojis[sender].push(emoji);
        }
      }
    }
  }
  
  return { emojiUsage, uniqueEmojis, redFlags };
}

// 5. Search Party (Word Search)
export function searchWord(messages: Message[], word: string): Record<string, number> {
  const wordLower = word.toLowerCase();
  const wordPattern = new RegExp(`\\b${wordLower}\\b`, 'gi');
  const counts: Record<string, number> = {};
  
  for (const msg of messages) {
    const matches = msg.text.match(wordPattern);
    if (matches) {
      counts[msg.sender] = (counts[msg.sender] || 0) + matches.length;
    }
  }
  
  return counts;
}

// Profanity Filter
export function profanityCount(messages: Message[]): Record<string, { total: number; topWords: { word: string; count: number }[] }> {
  const profanityPattern = /\b(fuck|shit|damn|bitch|ass|hell|piss|crap|dick|pussy|bastard|motherfucker|fucking|fucked|fucker|shitty|damned|wtf|stfu|mf|omfg|gtfo|bloody|bollocks|bugger|sod|tosser|wanker|twat|prick|cunt|arse|arsehole|asshole|cock|bellend|knob|slag|slut|whore|jackass|dumbass|bullshit|douche|bc|mc|bhenchod|madarchod|behenchod|maderchod|chutiya|chutiye|harami|saala|saale|kutta|kutti|kamina|kamine|gand|gaand|gandu|bhosdike|bsdk|randi|loda|lauda|lawda|lawde|bkl|mkl|tmkc|mkc)\b/gi;
  const totals: Record<string, number> = {};
  const usage: Record<string, Record<string, number>> = {};

  for (const msg of messages) {
    const matches = msg.text.match(profanityPattern);
    if (matches) {
      totals[msg.sender] = (totals[msg.sender] || 0) + matches.length;
      if (!usage[msg.sender]) usage[msg.sender] = {};
      for (const w of matches) {
        const word = w.toLowerCase();
        usage[msg.sender][word] = (usage[msg.sender][word] || 0) + 1;
      }
    }
  }

  const result: Record<string, { total: number; topWords: { word: string; count: number }[] }> = {};
  const senders = Array.from(new Set(messages.map(m => m.sender)));
  for (const s of senders) {
    const entries = Object.entries(usage[s] || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
    result[s] = {
      total: totals[s] || 0,
      topWords: entries.map(([word, count]) => ({ word, count }))
    };
  }
  return result;
}
