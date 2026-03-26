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
  // 1. Identify senders who send system-like messages (encryption, group events, etc.)
  // 2. If a sender sends mostly system messages, mark as system sender
  // 3. Group names typically only send system notifications

  // Comprehensive regex to identify system event messages
  const systemMsgRegex = [
      /^Messages (to this chat|and calls) are end-to-end encrypted/,
      /^‎?Messages (to this chat|and calls) are end-to-end encrypted/,
      /added you$/,
      /created group/i,
      /created this group/i,
      /changed the (group |)subject to/,
      /changed the group (name|description|icon|settings)/,
      /changed this group/i,
      /changed following settings/,
      /changed their phone number/,
      /security code changed/,
      /added .+ to the group/,
      /removed .+ from the group/,
      /You added/,
      /You removed/,
      /You were added/,
      /You were removed/,
      /left the group/,
      /left$/,
      /joined using this group's invite link/,
      /joined this group/i,
      /was added$/,
      /was removed$/,
      /Disappearing messages were turned/,
      /disappeared message timer/i,
      /You're now an admin/,
      /is now an admin/,
      /started a call/,
      /ended a call/,
      /video call ended/,
      /missed voice call/,
      /missed video call/,
      /^This chat is with/,
      /^Tap for more info/,
      /^‎?image omitted$/,
      /^‎?video omitted$/,
      /^‎?audio omitted$/,
      /^‎?sticker omitted$/,
      /^‎?GIF omitted$/,
      /^‎?document omitted$/,
      /^‎?Contact card omitted$/,
      /^‎?Location:/,
      /^‎?Live location shared/,
      /^‎?<Media omitted>$/,
      /^Waiting for this message/,
      /admin changed/i,
      /pinned a message/i,
      /unpinned a message/i,
      /turned on disappearing messages/i,
      /turned off disappearing messages/i,
      /reset this group's invite link/i,
      /changed the group's invite link/i,
      /only admins can (send messages|edit)/i,
      /opened to all participants/i,
      /restricted this group/i,
  ];

  const isSystemMessage = (text: string) => systemMsgRegex.some(r => r.test(text));

  // Count system vs non-system messages per sender
  const senderStats = new Map<string, { total: number; system: number }>();

  messages.forEach(m => {
    const stats = senderStats.get(m.sender) || { total: 0, system: 0 };
    stats.total++;
    if (isSystemMessage(m.text)) {
      stats.system++;
    }
    senderStats.set(m.sender, stats);
  });

  // Determine if this is a group chat (>2 unique senders before filtering)
  const uniqueSenders = new Set(messages.map(m => m.sender));
  const isGroupChat = uniqueSenders.size > 2;

  // Identify system senders (likely group chat names):
  // - In group chats: 50%+ system messages is enough to flag (group names send mostly notifications)
  // - In DMs: keep higher threshold (80%) to avoid false positives
  // - Also flag senders with ALL system messages regardless of count
  const verifiedSystemSenders = new Set<string>();
  senderStats.forEach((stats, sender) => {
    const systemRatio = stats.system / stats.total;

    // 100% system messages = definitely a system sender
    if (stats.total === stats.system && stats.system > 0) {
      verifiedSystemSenders.add(sender);
      return;
    }

    if (isGroupChat) {
      // In group chats, lower threshold: group name typically sends mostly system msgs
      // Also check if this sender has very few non-system messages relative to others
      if (stats.system > 0 && systemRatio >= 0.5) {
        verifiedSystemSenders.add(sender);
      }
    } else {
      // In DMs, higher threshold to avoid false positives
      if (stats.system > 0 && systemRatio >= 0.8) {
        verifiedSystemSenders.add(sender);
      }
    }
  });

  // Filter out system messages and messages from confirmed system senders
  const filtered = messages.filter(m => {
    // 1. Always remove system messages regardless of sender
    if (isSystemMessage(m.text)) return false;

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

  // Prefer _chat.txt (standard WhatsApp export name), then any .txt
  let txtFile = validFiles.find(f => {
    const name = f.name.split('/').pop()?.toLowerCase() || '';
    return name.endsWith('_chat.txt') || name.startsWith('whatsapp chat');
  });
  if (!txtFile && validFiles.length > 0) {
    // Pick the largest .txt file (most likely the chat, not a small metadata file)
    txtFile = validFiles.sort((a, b) => ((b as any)._data?.uncompressedSize || 0) - ((a as any)._data?.uncompressedSize || 0))[0];
  }

  if (!txtFile) throw new Error('No .txt chat file found in ZIP (ignored __MACOSX/hidden files)');

  // Read as raw bytes first to detect encoding
  const rawBytes = await txtFile.async('uint8array');
  const content = decodeTextContent(rawBytes);
  return parseWhatsAppText(content);
}

/**
 * Detect encoding (UTF-16 LE/BE BOM or UTF-8) and decode accordingly.
 * iOS WhatsApp exports often use UTF-16 LE encoding.
 */
function decodeTextContent(bytes: Uint8Array): string {
  // Check for UTF-16 LE BOM (FF FE)
  if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
    return new TextDecoder('utf-16le').decode(bytes);
  }
  // Check for UTF-16 BE BOM (FE FF)
  if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
    return new TextDecoder('utf-16be').decode(bytes);
  }
  // Check for UTF-8 BOM (EF BB BF)
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return new TextDecoder('utf-8').decode(bytes);
  }

  // Heuristic: if many null bytes are interspersed, it's likely UTF-16 without BOM
  // Sample first 200 bytes and check for alternating null bytes
  const sampleSize = Math.min(200, bytes.length);
  let nullCount = 0;
  for (let i = 0; i < sampleSize; i++) {
    if (bytes[i] === 0) nullCount++;
  }
  // If >20% null bytes in ASCII-range text, likely UTF-16
  if (nullCount > sampleSize * 0.2) {
    // Check if odd positions are mostly null (LE) or even positions (BE)
    let oddNulls = 0, evenNulls = 0;
    for (let i = 0; i < sampleSize; i++) {
      if (bytes[i] === 0) {
        if (i % 2 === 0) evenNulls++;
        else oddNulls++;
      }
    }
    return new TextDecoder(oddNulls > evenNulls ? 'utf-16le' : 'utf-16be').decode(bytes);
  }

  // Default to UTF-8
  return new TextDecoder('utf-8').decode(bytes);
}
