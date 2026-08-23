import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

export class BackupFileUnavailableError extends Error {}

/**
 * Writes `json` to a real `.json` file and hands it off to the platform —
 * the native share sheet (whose "파일에 저장" target only works against an
 * actual file, unlike `Share.share({ message })`'s plain text) or an
 * immediate browser download on web, mirroring `saveImageToDevice`'s web
 * branch in lib/share-image.ts.
 */
export async function exportBackupFile(json: string, filename: string): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }
  if (!(await Sharing.isAvailableAsync())) {
    throw new BackupFileUnavailableError('이 기기에서는 파일 공유 기능을 사용할 수 없어요.');
  }
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: '갈피 백업 파일 저장' });
}

/**
 * Opens the native document picker (web: a file input) restricted to JSON,
 * and returns the picked file's text content — or null if the user canceled.
 */
export async function pickBackupFileText(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];

  if (Platform.OS === 'web') {
    if (asset.file) return asset.file.text();
    if (asset.base64) return atob(asset.base64.split(',').pop() ?? asset.base64);
    throw new Error('파일을 읽을 수 없어요.');
  }
  return new File(asset.uri).text();
}
