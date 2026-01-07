import { parse, isValid } from 'date-fns';
import type { Message } from './types';

// Attempt to parse common WhatsApp export formats across locales
// Examples:
// "12/31/20, 9:50 PM - Alice: Happy New Year!"
// "[12/31/20, 21:50] Bob: Thanks!"
// "31/12/2020, 21:50 - Alice: msg" (DD/MM/YYYY)

// Support multiple separators and AM/PM variants
const patterns = [
  {
    // US style with dash or en/em dash, optional seconds
    regex: /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}(?::\d{2})?)(?:\s([AaPp][Mm]))?\s[\-–—]\s([^:]+):\s([\s\S]*)$/,
  },
  {
    // Bracket style, optional seconds (common in iOS exports: [1/1/21, 10:00:00 AM])
    regex: /^\[(\d{1,2}\/\d{1,2}\/\d{2,4})(?:,)?\s(\d{1,2}:\d{2}(?::\d{2})?)(?:\s([AaPp][Mm]))?\]\s([^:]+):\s([\s\S]*)$/,
  },
  {
    // EU style DD/MM/YYYY with dash or en/em dash, optional seconds
    regex: /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}(?::\d{2})?)(?:\s([AaPp][Mm]))?\s[\-–—]\s([^:]+):\s([\s\S]*)$/,
  },
  {
    // EU style with dots, optional seconds
    regex: /^(\d{1,2}\.\d{1,2}\.\d{2,4}),\s(\d{1,2}:\d{2}(?::\d{2})?)(?:\s([AaPp][Mm]))?\s[\-–—]\s([^:]+):\s([\s\S]*)$/,
  },
];

function determineDateFormat(lines: string[]): string[] {
  let firstPartMax = 0;
  let secondPartMax = 0;

  for (const line of lines) {
    for (const p of patterns) {
      const m = line.match(p.regex);
      if (m) {
        const dStr = m[1];
        // Handle dots or slashes
        const parts = dStr.split(/[\/\.]/);
        if (parts.length >= 2) {
          const p1 = parseInt(parts[0], 10);
          const p2 = parseInt(parts[1], 10);
          if (!isNaN(p1)) firstPartMax = Math.max(firstPartMax, p1);
          if (!isNaN(p2)) secondPartMax = Math.max(secondPartMax, p2);
        }
        break; // Found a match for this line
      }
    }
    // Optimization: if we already found a clear indicator, stop
    if (firstPartMax > 12 || secondPartMax > 12) break;
  }

  // If first part > 12, it MUST be day (dd/mm)
  if (firstPartMax > 12) {
    return [
      'dd/MM/yy HH:mm', 'dd/MM/yyyy HH:mm', 'dd/MM/yy hh:mm a', 'dd/MM/yyyy hh:mm a',
      'dd.MM.yy HH:mm', 'dd.MM.yyyy HH:mm', 'dd.MM.yy hh:mm a', 'dd.MM.yyyy hh:mm a',
      'dd/MM/yy HH:mm:ss', 'dd/MM/yyyy HH:mm:ss', 'dd/MM/yy hh:mm:ss a', 'dd/MM/yyyy hh:mm:ss a',
      'dd.MM.yy HH:mm:ss', 'dd.MM.yyyy HH:mm:ss', 'dd.MM.yy hh:mm:ss a', 'dd.MM.yyyy hh:mm:ss a',
    ];
  }
  
  // If second part > 12, it MUST be day (mm/dd)
  if (secondPartMax > 12) {
    return [
      'MM/dd/yy HH:mm', 'MM/dd/yyyy HH:mm', 'MM/dd/yy hh:mm a', 'MM/dd/yyyy hh:mm a',
      'MM/dd/yy HH:mm:ss', 'MM/dd/yyyy HH:mm:ss', 'MM/dd/yy hh:mm:ss a', 'MM/dd/yyyy hh:mm:ss a',
    ];
  }

  // Default / Ambiguous -> Prefer DD/MM as it is more common globally (and matches user case)
  // But include both sets just in case, prioritizing DD/MM
  return [
    'dd/MM/yy HH:mm', 'dd/MM/yyyy HH:mm', 'dd/MM/yy hh:mm a', 'dd/MM/yyyy hh:mm a',
    'dd.MM.yy HH:mm', 'dd.MM.yyyy HH:mm', 'dd.MM.yy hh:mm a', 'dd.MM.yyyy hh:mm a',
    'MM/dd/yy HH:mm', 'MM/dd/yyyy HH:mm', 'MM/dd/yy hh:mm a', 'MM/dd/yyyy hh:mm a',
    'dd/MM/yy HH:mm:ss', 'dd/MM/yyyy HH:mm:ss', 'dd/MM/yy hh:mm:ss a', 'dd/MM/yyyy hh:mm:ss a',
    'dd.MM.yy HH:mm:ss', 'dd.MM.yyyy HH:mm:ss', 'dd.MM.yy hh:mm:ss a', 'dd.MM.yyyy hh:mm:ss a',
    'MM/dd/yy HH:mm:ss', 'MM/dd/yyyy HH:mm:ss', 'MM/dd/yy hh:mm:ss a', 'MM/dd/yyyy hh:mm:ss a',
  ];
}

function parseWithFormats(d: string, t: string, formats: string[], ampm?: string): Date | null {
  const sfx = ampm ? ` ${ampm}` : '';
  const base = `${d} ${t}${sfx}`;
  
  for (const fmt of formats) {
    const dt = parse(base, fmt, new Date());
    if (isValid(dt)) return dt;
  }
  return null;
}

function tryParseLine(line: string, formats: string[]): Message | null {
  for (const p of patterns) {
    const m = line.match(p.regex);
    if (m) {
      const [, d, t, ampm, sender, msg] = m;
      const date = parseWithFormats(d, t, formats, ampm);
      if (!date) continue;
      // Clean visible/invisible directional marks from the message text
      const cleanedText = (msg || '').replace(/[\u200e\u200f\u202a-\u202e]/g, '').trim();
      // Clean sender similarly (stripping LRM, RLM, LRE, PDF, etc. often found in phone numbers)
      const cleanedSender = sender.replace(/[\u200e\u200f\u202a-\u202e]/g, '').trim();

      return { date, sender: cleanedSender, text: cleanedText };
    }
  }
  return null;
}

export function parseWhatsAppText(text: string): Message[] {
  // Split lines and remove common invisible characters that break regex (BOM, LTR/RTL marks)
  const lines = text.split(/\r?\n/).map(line => line.replace(/^[\uFEFF\u200e\u200f]+/, ''));
  const formats = determineDateFormat(lines);
  const messages: Message[] = [];
  let current: Message | null = null;
  for (const line of lines) {
    const parsed = tryParseLine(line, formats);
    if (parsed) {
      // start new message
      if (current) messages.push(current);
      current = { ...parsed };
    } else {
      // continuation of previous multi-line message
      if (current) current.text += (current.text ? '\n' : '') + line;
    }
  }
  if (current) messages.push(current);

  // Identify system/group senders
  // Strategy: 
  // 1. Identify senders who sent the "End-to-end encryption" message.
  // 2. Verify if they *only* send system-like messages (added/left/changed group).
  //    If they send even one "normal" message, they are a real user (1-on-1 chat).
  const encryptionSenders = new Set<string>();
  messages.forEach(m => {
     if (m.text.match(/^Messages (to this chat|and calls) are end-to-end encrypted/)) {
        encryptionSenders.add(m.sender);
     }
  });

  const verifiedSystemSenders = new Set<string>();
  
  // Regex to identify system event messages
  const systemMsgRegex = [
      /^Messages (to this chat|and calls) are end-to-end encrypted/,
      /added you$/,
      /created group/,
      /changed the (group |)subject to/,
      /changed the group (name|description|icon)/,
      /changed following settings/,
      /security code changed/,
      /added .+ to the group/,
      /removed .+ from the group/,
      /You added/, // "Group: You added X"
      /left the group/,
      /joined using this group's invite link/,
      /Disappearing messages were turned/,
      /You're now an admin/,
      /started a call/,
      /video call ended/,
      /missed voice call/
  ];

  encryptionSenders.forEach(sender => {
      const allMsgs = messages.filter(m => m.sender === sender);
      // Check if EVERY message from this sender matches a system regex
      const isBot = allMsgs.every(m => systemMsgRegex.some(r => m.text.match(r)));
      if (isBot) {
          verifiedSystemSenders.add(sender);
      }
  });

  // Filter out system messages and messages from confirmed system senders
  const filtered = messages.filter(m => {
    // 1. Always remove the encryption notification itself
    if (m.text.match(/^Messages (to this chat|and calls) are end-to-end encrypted/)) return false;
    
    // 2. Remove all messages from a confirmed system notification sender (Group Name)
    if (verifiedSystemSenders.has(m.sender)) return false;

    // 3. Remove messages from senders that look like phone numbers (unsaved contacts)
    // Matches patterns like +91 97634 00566, +1 (555) 123-4567, 9876543210
    if (m.sender.match(/^[\+]?[\d\s\-\(\)]+$/) && m.sender.replace(/[^\d]/g, '').length >= 7) return false;
    
    return true;
  });

  return filtered;
}

export async function parseWhatsAppZip(file: File): Promise<Message[]> {
  const JSZip = (await import('jszip')).default;
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const validFiles = Object.values(zip.files).filter(f => 
    !f.dir && 
    f.name.endsWith('.txt') && 
    !f.name.includes('__MACOSX') && 
    !f.name.split('/').pop()?.startsWith('.')
  );

  let txtFile = validFiles.find(f => f.name.endsWith('_chat.txt'));
  if (!txtFile && validFiles.length > 0) {
    txtFile = validFiles[0];
  }

  if (!txtFile) throw new Error('No .txt chat file found in ZIP (ignored __MACOSX/hidden files)');
  const content = await txtFile.async('string');
  return parseWhatsAppText(content);
}
