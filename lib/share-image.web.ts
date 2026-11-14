import type { RefObject } from 'react';
import type { View } from 'react-native';

/**
 * Web implementation of lib/share-image.ts. Kept as a separate platform
 * file (not a Platform.OS branch) on purpose: react-native-view-shot's web
 * build imports html2canvas *statically*, so as long as this module imported
 * view-shot at all, Metro had to inline html2canvas (~200KB gzip) into the
 * entry bundle and the `await import()` below could never become its own
 * chunk. With view-shot gone from the web graph it loads on first share.
 */
export async function captureViewAsImage(ref: RefObject<View | null>): Promise<string> {
  const { default: html2canvas } = await import('html2canvas');
  const node = ref.current as unknown as HTMLElement;
  const canvas = await html2canvas(node, { backgroundColor: null, useCORS: true });
  return canvas.toDataURL('image/png', 1);
}

export class MediaPermissionError extends Error {}

/** Triggers a browser download of the PNG. Never throws MediaPermissionError on web. */
export async function saveImageToDevice(uri: string, filename: string): Promise<void> {
  const link = document.createElement('a');
  link.href = uri;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export class ShareUnavailableError extends Error {}

/**
 * Web Share API with file support; throws ShareUnavailableError when the
 * browser can't share files so the caller can fall back to "save first".
 */
export async function shareImage(
  uri: string,
  options: { filename: string; title: string; dialogTitle: string },
): Promise<void> {
  const nav = navigator as Navigator & {
    share?: (data: ShareData) => Promise<void>;
    canShare?: (data: ShareData) => boolean;
  };
  if (nav.share) {
    const blob = await (await fetch(uri)).blob();
    const file = new File([blob], options.filename, { type: 'image/png' });
    if (!nav.canShare || nav.canShare({ files: [file] })) {
      await nav.share({ files: [file], title: options.title });
      return;
    }
  }
  throw new ShareUnavailableError('이 브라우저에서는 공유가 지원되지 않아요. 이미지 저장 후 직접 공유해주세요.');
}
