export type ReadingStatus = 'reading' | 'done' | 'wish';

export type Book = {
  id: string;
  title: string;
  author: string;
  rating: number; // 0 ~ 5
  galpiCount: number; // 저장한 문장(갈피) 수
  status: ReadingStatus;
  /** 0 ~ 100. Auto-derived from furthestPage/totalPages by addSentenceDoc/updateSentenceDoc when totalPages is known; stays 0 otherwise. */
  progress: number;
  accent: 'blue' | 'green' | 'yellow' | 'ink';
  quote?: string;
  /** Cover thumbnail URL, e.g. from Aladin book search. */
  coverUrl?: string;
  /** Date the book was marked "done", as "YYYY.MM.DD". Set/cleared by updateBookDoc when status changes. */
  completedAt?: string;
  /** Total page count, from Aladin's ItemLookUp when the book was added. */
  totalPages?: number;
  /** Category path from Aladin, e.g. "국내도서>소설/시/희곡>한국소설". */
  genre?: string;
  /** Furthest page a saved 갈피 references — drives `progress` alongside totalPages. */
  furthestPage?: number;
};

export const STATUS_LABEL: Record<ReadingStatus, string> = {
  reading: '읽는 중',
  done: '완독',
  wish: '읽고 싶은',
};
