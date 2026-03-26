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
      if (senderCount > 0) {
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
    // Sort by usage count descending so the "signature" emoji is the most used unique one
    uniqueEmojis[sender].sort((a, b) => (emojiUsage[sender][b] || 0) - (emojiUsage[sender][a] || 0));
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

// ==========================================
// Wavelength Score (0-100)
// ==========================================
export interface WavelengthScoreResult {
  score: number;
  tier: string;
  description: string;
}

export function calculateWavelengthScore(
  totalMessages: number,
  sentimentDays: { tag: string }[],
  laughterCounts: Record<string, number>,
  initiatorCounts: Record<string, number>,
  streakData: StreakData,
  avgResponseTimes: Record<string, number | null>,
  doubleTextRatios: Record<string, number>,
  participantCount: number,
): WavelengthScoreResult {
  let score = 0;

  const totalDays = Math.max(sentimentDays.length, 1);
  const avgMsgsPerDay = totalMessages / totalDays;
  const happyDays = sentimentDays.filter(d => d.tag === 'happy').length;
  const happyRatio = happyDays / totalDays;
  const totalLaughs = Object.values(laughterCounts).reduce((a, b) => a + b, 0);
  const laughRatio = totalLaughs / Math.max(totalMessages, 1);

  // 1. Activity (0-20)
  if (avgMsgsPerDay > 80) score += 20;
  else if (avgMsgsPerDay > 40) score += 16;
  else if (avgMsgsPerDay > 20) score += 12;
  else if (avgMsgsPerDay > 10) score += 8;
  else if (avgMsgsPerDay > 3) score += 4;

  // 2. Positivity / Sentiment (0-20)
  score += Math.round(happyRatio * 20);

  // 3. Laughter (0-15)
  if (laughRatio > 0.12) score += 15;
  else if (laughRatio > 0.08) score += 12;
  else if (laughRatio > 0.04) score += 8;
  else if (laughRatio > 0.02) score += 4;

  // 4. Balance / Initiation symmetry (0-15)
  const initValues = Object.values(initiatorCounts);
  if (initValues.length >= 2) {
    const maxInit = Math.max(...initValues, 1);
    const minInit = Math.min(...initValues, 1);
    const ratio = maxInit / minInit;
    if (ratio < 1.3) score += 15;
    else if (ratio < 1.8) score += 10;
    else if (ratio < 2.5) score += 5;
  } else {
    score += 8; // Single person, neutral
  }

  // 5. Streak (0-15)
  const streakDays = streakData.longestStreak.days;
  if (streakDays > 180) score += 15;
  else if (streakDays > 90) score += 12;
  else if (streakDays > 30) score += 8;
  else if (streakDays > 7) score += 4;

  // 6. Response time symmetry (0-10)
  const times = Object.values(avgResponseTimes).filter(t => t !== null) as number[];
  if (times.length >= 2) {
    const maxT = Math.max(...times);
    const minT = Math.min(...times);
    const timeRatio = maxT / Math.max(minT, 0.1);
    if (timeRatio < 1.5) score += 10;
    else if (timeRatio < 2.5) score += 6;
    else if (timeRatio < 4) score += 3;
  } else {
    score += 5;
  }

  // 7. Double text penalty (-5 if very imbalanced)
  const dtValues = Object.values(doubleTextRatios);
  if (dtValues.length >= 2) {
    const maxDt = Math.max(...dtValues);
    const minDt = Math.min(...dtValues, 0);
    if (maxDt > 15 && maxDt - minDt > 10) score -= 5;
  }

  // 8. Bonus for longevity
  if (totalDays > 365) score += 5;
  else if (totalDays > 180) score += 3;

  // Clamp 0-100
  score = Math.min(Math.max(Math.round(score), 0), 100);

  // Tier
  let tier: string, description: string;
  if (score >= 90) {
    tier = "Soulmates";
    description = "This is the kind of chat people write songs about. Perfectly in sync.";
  } else if (score >= 75) {
    tier = "On the Same Wavelength";
    description = "You get each other. The balance, the laughs, the effort — it's all there.";
  } else if (score >= 60) {
    tier = "Vibing";
    description = "Solid connection with room to grow. You're doing better than most.";
  } else if (score >= 40) {
    tier = "It's Complicated";
    description = "Some things click, some things don't. It's a work in progress.";
  } else if (score >= 20) {
    tier = "On Different Frequencies";
    description = "The effort gap is showing. Someone's carrying this chat.";
  } else {
    tier = "Stranger Danger";
    description = participantCount > 2 ? "Are you sure this group actually talks?" : "Are you sure you two actually know each other?";
  }

  return { score, tier, description };
}

// ==========================================
// Red Flag / Green Flag
// ==========================================
export interface Flag {
  emoji: string;
  label: string;
  detail: string;
}

export function computeFlags(
  initiatorCounts: Record<string, number>,
  avgResponseTimes: Record<string, number | null>,
  laughterCounts: Record<string, number>,
  streakData: StreakData,
  deleterStats: Record<string, { deleted: number; total: number; ratio: number }>,
  curiosityStats: { dryTextRatio: Record<string, number> },
  convoKillerData: ConvoKillerData,
  doubleTextRatios: Record<string, number>,
  totalMessages: number,
  sentimentDays: { tag: string }[],
  participants: string[],
): { green: Flag[]; red: Flag[] } {
  const green: Flag[] = [];
  const red: Flag[] = [];

  // --- Initiation balance ---
  const initValues = Object.values(initiatorCounts);
  if (initValues.length >= 2) {
    const maxInit = Math.max(...initValues);
    const minInit = Math.min(...initValues);
    const ratio = maxInit / Math.max(minInit, 1);
    if (ratio < 1.5) green.push({ emoji: "⚖️", label: "Balanced initiators", detail: participants.length > 2 ? "Everyone starts conversations fairly equally" : "You both start conversations equally" });
    else if (ratio > 3) {
      const chaser = Object.entries(initiatorCounts).sort((a, b) => b[1] - a[1])[0][0];
      red.push({ emoji: "📱", label: "One-sided initiator", detail: `${chaser} starts ${Math.round((maxInit / (maxInit + minInit)) * 100)}% of conversations` });
    }
  }

  // --- Response time ---
  const times = Object.values(avgResponseTimes).filter(t => t !== null) as number[];
  if (times.length >= 2) {
    const fastest = Math.min(...times);
    const slowest = Math.max(...times);
    if (fastest < 5) green.push({ emoji: "⚡", label: "Lightning replies", detail: `Average reply in under 5 minutes` });
    if (slowest / Math.max(fastest, 0.1) > 4) {
      red.push({ emoji: "🐌", label: "Reply time gap", detail: `${Math.round(slowest / Math.max(fastest, 1))}x difference in reply speed` });
    }
  }

  // --- Laughter ---
  const totalLaughs = Object.values(laughterCounts).reduce((a, b) => a + b, 0);
  const laughRatio = totalLaughs / Math.max(totalMessages, 1);
  if (laughRatio > 0.08) green.push({ emoji: "😂", label: "High laughter ratio", detail: `${Math.round(laughRatio * 100)}% of messages contain laughter` });
  if (laughRatio < 0.01) red.push({ emoji: "😐", label: "Low laughter", detail: "Less than 1% of messages have any laughs" });

  // --- Streaks ---
  if (streakData.longestStreak.days > 90) green.push({ emoji: "🔥", label: `${streakData.longestStreak.days}-day streak`, detail: "Impressive daily commitment" });

  // --- Sentiment ---
  const happyDays = sentimentDays.filter(d => d.tag === 'happy').length;
  const totalDays = Math.max(sentimentDays.length, 1);
  const happyPct = happyDays / totalDays;
  if (happyPct > 0.5) green.push({ emoji: "☀️", label: "Mostly positive vibes", detail: `${Math.round(happyPct * 100)}% happy days` });
  const tensionDays = sentimentDays.filter(d => d.tag === 'tension').length;
  if (tensionDays / totalDays > 0.3) red.push({ emoji: "⚡", label: "High tension days", detail: `${Math.round((tensionDays / totalDays) * 100)}% of days have tension` });

  // --- Deleter ratio ---
  const deleteRatios = Object.values(deleterStats).map(d => d.ratio);
  const maxDelete = Math.max(...deleteRatios, 0);
  if (maxDelete > 5) {
    const deleter = Object.entries(deleterStats).sort((a, b) => b[1].ratio - a[1].ratio)[0][0];
    red.push({ emoji: "🗑️", label: "Serial deleter detected", detail: `${deleter} deletes ${maxDelete.toFixed(1)}% of messages` });
  }

  // --- Dry texting ---
  const dryRatios = Object.values(curiosityStats.dryTextRatio);
  const maxDry = Math.max(...dryRatios, 0);
  if (maxDry > 20) {
    const dryer = Object.entries(curiosityStats.dryTextRatio).sort((a, b) => b[1] - a[1])[0][0];
    red.push({ emoji: "🏜️", label: "Dry texter alert", detail: `${dryer} sends ${Math.round(maxDry)}% one-word replies` });
  }
  if (maxDry < 8 && dryRatios.length >= 2) green.push({ emoji: "💬", label: "Both put in effort", detail: "Low dry-texting rate from everyone" });

  // --- Convo killer imbalance ---
  if (convoKillerData.totalConvosEnded > 10) {
    const killValues = Object.values(convoKillerData.killCounts);
    if (killValues.length >= 2) {
      const maxKill = Math.max(...killValues);
      const pct = Math.round((maxKill / convoKillerData.totalConvosEnded) * 100);
      if (pct > 70) {
        const killer = Object.entries(convoKillerData.killCounts).sort((a, b) => b[1] - a[1])[0][0];
        red.push({ emoji: "💀", label: "Conversation killer", detail: `${killer} ends ${pct}% of conversations` });
      }
    }
  }

  // --- Double text imbalance ---
  const dtValues = Object.values(doubleTextRatios);
  if (dtValues.length >= 2) {
    const maxDt = Math.max(...dtValues);
    const minDt = Math.min(...dtValues);
    if (maxDt > 15 && maxDt - minDt > 10) {
      red.push({ emoji: "📩", label: "Double-text imbalance", detail: "One person double-texts way more than the other" });
    }
  }

  // Sort by relevance (flags with more specific detail first) and limit
  return { green: green.slice(0, 5), red: red.slice(0, 5) };
}

// ==========================================
// Who Said It? Quiz
// ==========================================
export interface QuizMessage {
  text: string;
  sender: string;
  date: Date;
}

export function generateQuizMessages(messages: Message[], count = 8): QuizMessage[] {
  // Filter for interesting messages: not too short, not too long, no media, no links
  const candidates = messages.filter(m => {
    const t = m.text.trim();
    if (t.length < 15 || t.length > 300) return false;
    if (/omitted|<Media|http[s]?:\/\//i.test(t)) return false;
    if (/^(haha|lol|ok|yes|no|yeah|hmm|nice|cool|true|sure)\s*$/i.test(t)) return false;
    if (t.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\s]/gu, '').length < 5) return false;
    return true;
  });

  if (candidates.length < count) return candidates.map(m => ({ text: m.text, sender: m.sender, date: m.date }));

  // Fully shuffle candidates so every play is different
  const shuffled = [...candidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Pick `count` messages while balancing senders as much as possible
  const parts = Array.from(new Set(messages.map(m => m.sender)));
  const selected: QuizMessage[] = [];
  const senderCounts: Record<string, number> = {};
  const maxPerSender = Math.ceil(count / parts.length) + 1;

  for (const m of shuffled) {
    if (selected.length >= count) break;
    const sc = senderCounts[m.sender] || 0;
    if (sc >= maxPerSender) continue; // Don't over-represent one sender
    selected.push({ text: m.text, sender: m.sender, date: m.date });
    senderCounts[m.sender] = sc + 1;
  }

  // Final shuffle of selected
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return selected.slice(0, count);
}

// ==========================================
// Streak Tracker
// ==========================================
export interface StreakData {
  longestStreak: { days: number; start: Date; end: Date };
  currentStreak: { days: number; start: Date };
  streakBrokenOn: Date | null;
  totalActiveDays: number;
  totalDays: number;
}

export function streakTracker(messages: Message[]): StreakData {
  if (messages.length === 0) {
    return {
      longestStreak: { days: 0, start: new Date(), end: new Date() },
      currentStreak: { days: 0, start: new Date() },
      streakBrokenOn: null,
      totalActiveDays: 0,
      totalDays: 0,
    };
  }

  const daySet = new Set<string>();
  for (const m of messages) {
    const d = m.date;
    daySet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }

  const sortedDays = Array.from(daySet).sort();
  const totalActiveDays = sortedDays.length;

  const firstDay = new Date(sortedDays[0]);
  const lastDay = new Date(sortedDays[sortedDays.length - 1]);
  const totalDays = Math.round((lastDay.getTime() - firstDay.getTime()) / 86400000) + 1;

  let longestStart = 0, longestLen = 1;
  let curStart = 0, curLen = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);

    if (diffDays === 1) {
      curLen++;
    } else {
      if (curLen > longestLen) {
        longestLen = curLen;
        longestStart = curStart;
      }
      curStart = i;
      curLen = 1;
    }
  }
  if (curLen > longestLen) {
    longestLen = curLen;
    longestStart = curStart;
  }

  // Current streak from today/yesterday backwards
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  let currentStreakDays = 0;
  let currentStreakStart = today;

  const lastSortedDay = sortedDays[sortedDays.length - 1];
  if (lastSortedDay === todayKey || lastSortedDay === yesterdayKey) {
    currentStreakDays = 1;
    currentStreakStart = new Date(sortedDays[sortedDays.length - 1]);
    for (let i = sortedDays.length - 2; i >= 0; i--) {
      const curr = new Date(sortedDays[i + 1]);
      const prev = new Date(sortedDays[i]);
      if (Math.round((curr.getTime() - prev.getTime()) / 86400000) === 1) {
        currentStreakDays++;
        currentStreakStart = prev;
      } else break;
    }
  }

  const longestEnd = new Date(sortedDays[longestStart + longestLen - 1]);
  const brokenOn = new Date(longestEnd);
  brokenOn.setDate(brokenOn.getDate() + 1);

  return {
    longestStreak: { days: longestLen, start: new Date(sortedDays[longestStart]), end: longestEnd },
    currentStreak: { days: currentStreakDays, start: currentStreakStart },
    streakBrokenOn: longestLen > 1 ? brokenOn : null,
    totalActiveDays,
    totalDays,
  };
}

// ==========================================
// Conversation Killer
// ==========================================
export interface ConvoKillerData {
  killCounts: Record<string, number>;
  topKillerMessages: Record<string, { text: string; count: number }[]>;
  totalConvosEnded: number;
}

export function conversationKiller(messages: Message[], silenceHours = 6): ConvoKillerData {
  const killCounts: Record<string, number> = {};
  const killerMessages: Record<string, Record<string, number>> = {};

  for (let i = 0; i < messages.length - 1; i++) {
    const curr = messages[i];
    const next = messages[i + 1];
    const gapHrs = (next.date.getTime() - curr.date.getTime()) / 3600000;

    if (gapHrs >= silenceHours) {
      killCounts[curr.sender] = (killCounts[curr.sender] || 0) + 1;
      if (!killerMessages[curr.sender]) killerMessages[curr.sender] = {};
      const normalized = curr.text.trim().toLowerCase().slice(0, 50);
      if (normalized.length > 0) {
        killerMessages[curr.sender][normalized] = (killerMessages[curr.sender][normalized] || 0) + 1;
      }
    }
  }

  // Last message is always a convo ender
  if (messages.length > 0) {
    const last = messages[messages.length - 1];
    killCounts[last.sender] = (killCounts[last.sender] || 0) + 1;
  }

  const topKillerMessages: Record<string, { text: string; count: number }[]> = {};
  for (const [sender, msgMap] of Object.entries(killerMessages)) {
    topKillerMessages[sender] = Object.entries(msgMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text, count]) => ({ text, count }));
  }

  return {
    killCounts,
    topKillerMessages,
    totalConvosEnded: Object.values(killCounts).reduce((a, b) => a + b, 0),
  };
}

// ==========================================
// First vs Now Comparison
// ==========================================
export interface PeriodStats {
  avgResponseTime: Record<string, number | null>;
  avgMessageLength: Record<string, number>;
  emojiPerMessage: Record<string, number>;
  laughterPerMessage: Record<string, number>;
  messagesPerDay: number;
  period: string;
}

export interface FirstVsNowData {
  first: PeriodStats;
  now: PeriodStats;
}

function computePeriodStats(msgs: Message[], label: string): PeriodStats {
  const parts = Array.from(new Set(msgs.map(m => m.sender)));
  const emojiPattern = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu;
  const laughPattern = /(haha+|lol+|lmao+|rofl+|😂|🤣|😹|😆)/gi;

  const counts: Record<string, number> = {};
  const totalLength: Record<string, number> = {};
  const emojiCounts: Record<string, number> = {};
  const laughCounts: Record<string, number> = {};

  for (const m of msgs) {
    counts[m.sender] = (counts[m.sender] || 0) + 1;
    totalLength[m.sender] = (totalLength[m.sender] || 0) + m.text.trim().split(/\s+/).filter(Boolean).length;
    const emojis = m.text.match(emojiPattern);
    emojiCounts[m.sender] = (emojiCounts[m.sender] || 0) + (emojis ? emojis.length : 0);
    const laughs = m.text.match(laughPattern);
    laughCounts[m.sender] = (laughCounts[m.sender] || 0) + (laughs ? laughs.length : 0);
  }

  // Response times
  const responseTimes: Record<string, number[]> = {};
  for (let i = 1; i < msgs.length; i++) {
    if (msgs[i - 1].sender !== msgs[i].sender) {
      const delta = (msgs[i].date.getTime() - msgs[i - 1].date.getTime()) / 60000;
      if (delta > 0.1 && delta < 480) {
        if (!responseTimes[msgs[i].sender]) responseTimes[msgs[i].sender] = [];
        responseTimes[msgs[i].sender].push(delta);
      }
    }
  }

  const avgResponseTime: Record<string, number | null> = {};
  const avgMessageLength: Record<string, number> = {};
  const emojiPerMessage: Record<string, number> = {};
  const laughterPerMessage: Record<string, number> = {};

  for (const p of parts) {
    const times = responseTimes[p];
    avgResponseTime[p] = times?.length ? times.reduce((a, b) => a + b, 0) / times.length : null;
    const c = counts[p] || 1;
    avgMessageLength[p] = (totalLength[p] || 0) / c;
    emojiPerMessage[p] = (emojiCounts[p] || 0) / c;
    laughterPerMessage[p] = (laughCounts[p] || 0) / c;
  }

  const daySet = new Set(msgs.map(m => format(m.date, 'yyyy-MM-dd')));

  return {
    avgResponseTime,
    avgMessageLength,
    emojiPerMessage,
    laughterPerMessage,
    messagesPerDay: msgs.length / Math.max(daySet.size, 1),
    period: label,
  };
}

export function firstVsNow(messages: Message[]): FirstVsNowData | null {
  if (messages.length < 50) return null;

  const sorted = [...messages].sort((a, b) => a.date.getTime() - b.date.getTime());
  const firstDate = sorted[0].date;
  const lastDate = sorted[sorted.length - 1].date;

  const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + (lastDate.getMonth() - firstDate.getMonth());
  if (monthsDiff < 2) return null;

  const firstMonthKey = `${firstDate.getFullYear()}-${String(firstDate.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthKey = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`;

  const firstMsgs = sorted.filter(m => `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, '0')}` === firstMonthKey);
  const lastMsgs = sorted.filter(m => `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, '0')}` === lastMonthKey);

  if (firstMsgs.length < 10 || lastMsgs.length < 10) return null;

  return {
    first: computePeriodStats(firstMsgs, format(firstDate, 'MMM yyyy')),
    now: computePeriodStats(lastMsgs, format(lastDate, 'MMM yyyy')),
  };
}
