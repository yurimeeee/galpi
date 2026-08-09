export type EntryType = 'text' | 'scan' | 'photo';

export const ENTRY_LABEL: Record<EntryType, string> = {
  text: '직접 입력',
  scan: '카메라 스캔',
  photo: '페이지 사진',
};

export type Sentence = {
  id: string;
  bookId: string;
  page: number;
  quote: string;
  memo?: string;
  photoUrl?: string;
  type: EntryType;
  date: string;
};

export function sentencesByBook(
  allSentences: Sentence[],
  bookId: string,
): Sentence[] {
  return allSentences.filter((s) => s.bookId === bookId);
}
