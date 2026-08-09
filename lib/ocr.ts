import { Platform } from 'react-native';

// Deployed backend origin, used when running as a native app (Expo Go / standalone),
// where relative fetch("/api/...") has no same-origin page to resolve against.
const NATIVE_API_ORIGIN = 'https://galpi-book.vercel.app';

const API_BASE = Platform.OS === 'web' ? '' : NATIVE_API_ORIGIN;

export type ScanResult = {
  sentence: string;
  tokens: string[];
};

export async function scanBookText(imageDataUrl: string): Promise<ScanResult> {
  const response = await fetch(`${API_BASE}/api/ocr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageDataUrl }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? '문장 인식에 실패했어요. 다시 시도해주세요.');
  }

  return response.json();
}
