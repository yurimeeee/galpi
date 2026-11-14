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
  /** Cover thumbnail URL, e.g. from YES24 book search. */
  coverUrl?: string;
  /** Date the book was marked "done", as "YYYY.MM.DD". Set/cleared by updateBookDoc when status changes. */
  completedAt?: string;
  /** Total page count, entered by the user (older books carry the value Aladin's lookup returned before that API shut down). */
  totalPages?: number;
  /** Category path with ">" separators, e.g. "국내도서>소설/시/희곡". YES24 results are normalized to this shape by api/yes24-book-search.ts. */
  genre?: string;
  /** Furthest page a saved 갈피 references — drives `progress` alongside totalPages. */
  furthestPage?: number;
  /** Short overall review, written after finishing the book. */
  review?: string;
};

export const STATUS_LABEL: Record<ReadingStatus, string> = {
  reading: '읽는 중',
  done: '완독',
  wish: '읽고 싶은',
};
