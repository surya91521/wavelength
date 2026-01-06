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
    regex: /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}(?::\d{2})?)(?:\s([AaPp][Mm]))?\]\s([^:]+):\s([\s\S]*)$/,
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

function parseWithFormats(d: string, t: string, ampm?: string): Date | null {
  const sfx = ampm ? ` ${ampm}` : '';
  const base = `${d} ${t}${sfx}`;
  const fmts = [
    // no seconds
    'MM/dd/yy HH:mm',
    'MM/dd/yyyy HH:mm',
    'MM/dd/yy hh:mm a',
    'MM/dd/yyyy hh:mm a',
    'dd/MM/yy HH:mm',
    'dd/MM/yyyy HH:mm',
    'dd/MM/yy hh:mm a',
    'dd/MM/yyyy hh:mm a',
    'dd.MM.yy HH:mm',
    'dd.MM.yyyy HH:mm',
    'dd.MM.yy hh:mm a',
    'dd.MM.yyyy hh:mm a',
    // with seconds
    'MM/dd/yy HH:mm:ss',
    'MM/dd/yyyy HH:mm:ss',
    'MM/dd/yy hh:mm:ss a',
    'MM/dd/yyyy hh:mm:ss a',
    'dd/MM/yy HH:mm:ss',
    'dd/MM/yyyy HH:mm:ss',
    'dd/MM/yy hh:mm:ss a',
    'dd/MM/yyyy hh:mm:ss a',
    'dd.MM.yy HH:mm:ss',
    'dd.MM.yyyy HH:mm:ss',
    'dd.MM.yy hh:mm:ss a',
    'dd.MM.yyyy hh:mm:ss a',
  ];
  for (const fmt of fmts) {
    const dt = parse(base, fmt, new Date());
    if (isValid(dt)) return dt;
  }
  return null;
}

function tryParseLine(line: string): Message | null {
  for (const p of patterns) {
    const m = line.match(p.regex);
    if (m) {
      const [, d, t, ampm, sender, msg] = m;
      const date = parseWithFormats(d, t, ampm);
      if (!date) continue;
      return { date, sender: sender.trim(), text: (msg || '').trim() };
    }
  }
  return null;
}

export function parseWhatsAppText(text: string): Message[] {
  const lines = text.split(/\r?\n/);
  const messages: Message[] = [];
  let current: Message | null = null;
  for (const line of lines) {
    const parsed = tryParseLine(line);
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

  // Filter out system messages like "Messages to this chat and calls are now secured..."
  const filtered = messages.filter(m => !m.text.match(/^Messages to this chat|^\u200e/));
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
