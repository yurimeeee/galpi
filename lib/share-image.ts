import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

/**
 * Native implementation. Web resolves to lib/share-image.web.ts instead —
 * see the note there for why the split is a separate file rather than a
 * Platform.OS branch (bundle size).
 */
export async function captureViewAsImage(ref: RefObject<View | null>): Promise<string> {
  return captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
}

export class MediaPermissionError extends Error {}

/**
 * Saves the PNG to the photo library.
 * Throws MediaPermissionError if photo library access is denied.
 */
export async function saveImageToDevice(uri: string, _filename: string): Promise<void> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new MediaPermissionError('사진 보관함 접근 권한을 허용해주세요.');
  }
  await MediaLibrary.saveToLibraryAsync(uri);
}

export class ShareUnavailableError extends Error {}

/**
 * Opens the native share sheet via expo-sharing.
 * Throws ShareUnavailableError if sharing isn't available on the device.
 */
export async function shareImage(
  uri: string,
  options: { filename: string; title: string; dialogTitle: string },
): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new ShareUnavailableError('이 기기에서는 공유 기능을 사용할 수 없어요.');
  }
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: options.dialogTitle });
}
