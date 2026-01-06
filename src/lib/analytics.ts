import { format } from 'date-fns';
import type { Message, SentimentDay } from './types';

export function participants(messages: Message[]): string[] {
  const set = new Set(messages.map(m => m.sender));
  return Array.from(set);
}

export function averageResponseTimes(messages: Message[]): Record<string, number | null> {
  // compute response time per replier when sender switches
  const times: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1];
    const curr = messages[i];
    if (prev.sender !== curr.sender) {
      const delta = (curr.date.getTime() - prev.date.getTime()) / 60000; // minutes
      const key = curr.sender;
      times[key] = (times[key] || 0) + delta;
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  const result: Record<string, number | null> = {};
  Object.keys({ ...times, ...counts }).forEach(k => {
    result[k] = counts[k] ? times[k] / counts[k] : null;
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
  happy: [/\b(lol|lmao|rofl|haha|😂|🤣)\b/gi],
  tension: [/\b(sorry|ugh|stop|mad|angry|fight|annoyed|hate)\b/gi],
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
  const lrx = /(haha+|lol+|lmao+|rofl+)/gi;
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
    labels[k] = avg[k] >= 20 ? 'Storyteller' : 'Editor';
  });
  return { avgWords: avg, labels };
}

// Additional analytics for UI
export function messagesByMonth(messages: Message[]): { month: string; [key: string]: number | string }[] {
  const map: Record<string, Record<string, number>> = {};
  for (const m of messages) {
    const key = format(m.date, 'MMM yyyy');
    if (!map[key]) map[key] = {};
    map[key][m.sender] = (map[key][m.sender] || 0) + 1;
  }
  return Object.entries(map).map(([month, senders]) => ({ month, ...senders }));
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
