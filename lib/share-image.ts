import { Platform } from 'react-native';
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

/**
 * react-native-view-shot's cross-platform captureRef() always resolves the
 * ref through RN's findNodeHandle, which react-native-web throws on ("use
 * the ref property instead") — so the web path renders the card with
 * html2canvas directly against the DOM node instead.
 */
export async function captureViewAsImage(ref: RefObject<View | null>): Promise<string> {
  if (Platform.OS === 'web') {
    const { default: html2canvas } = await import('html2canvas');
    const node = ref.current as unknown as HTMLElement;
    const canvas = await html2canvas(node, { backgroundColor: null, useCORS: true });
    return canvas.toDataURL('image/png', 1);
  }
  return captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
}

export class MediaPermissionError extends Error {}

/**
 * Downloads the PNG on web; saves to the photo library on native.
 * Throws MediaPermissionError if photo library access is denied.
 */
export async function saveImageToDevice(uri: string, filename: string): Promise<void> {
  if (Platform.OS === 'web') {
    const link = document.createElement('a');
    link.href = uri;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new MediaPermissionError('사진 보관함 접근 권한을 허용해주세요.');
  }
  await MediaLibrary.saveToLibraryAsync(uri);
}

export class ShareUnavailableError extends Error {}

/**
 * Opens the platform share sheet for the PNG at `uri` — the Web Share API
 * on web (falling back if the browser can't share files), expo-sharing on
 * native. Throws ShareUnavailableError if neither is available.
 */
export async function shareImage(
  uri: string,
  options: { filename: string; title: string; dialogTitle: string },
): Promise<void> {
  if (Platform.OS === 'web') {
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
  if (!(await Sharing.isAvailableAsync())) {
    throw new ShareUnavailableError('이 기기에서는 공유 기능을 사용할 수 없어요.');
  }
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: options.dialogTitle });
}
