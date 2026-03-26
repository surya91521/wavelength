import html2canvas from 'html2canvas';
import { toast } from 'sonner';

const APP_URL = 'https://surya91521.github.io/wavelength/';

/**
 * Capture a DOM element as a PNG Blob using html2canvas.
 */
export async function captureElement(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: null,
  });
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to capture image'));
    }, 'image/png');
  });
}

/**
 * Check if Web Share API with file sharing is available.
 */
export function canShareFiles(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare;
}

/**
 * Share an image blob via native share sheet, clipboard, or download fallback.
 */
export async function shareImage(blob: Blob, text?: string, filename = 'wavelength.png'): Promise<void> {
  const file = new File([blob], filename, { type: 'image/png' });

  // Try native share with file
  if (canShareFiles()) {
    try {
      const shareData = { files: [file], text: text || '', url: APP_URL };
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return; // User cancelled
    }
  }

  // Try clipboard copy
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    toast.success('Image copied to clipboard!');
    return;
  } catch {
    // Clipboard API not available or denied
  }

  // Final fallback: download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
  toast.success('Image saved!');
}

/**
 * Share text via native share sheet or copy to clipboard.
 */
export async function shareText(text: string): Promise<void> {
  // Try native share
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch (e: any) {
      if (e.name === 'AbortError') return;
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  } catch {
    toast.error('Failed to copy');
  }
}

/**
 * Copy text to clipboard with toast notification.
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  } catch {
    toast.error('Failed to copy');
  }
}

export { APP_URL };
