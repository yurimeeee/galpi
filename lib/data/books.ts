export type ReadingStatus = 'reading' | 'done' | 'wish';

export type Book = {
  id: string;
  title: string;
  author: string;
  rating: number; // 0 ~ 5
  galpiCount: number; // 저장한 문장(갈피) 수
  status: ReadingStatus;
  progress: number; // 0 ~ 100
  accent: 'blue' | 'green' | 'yellow' | 'ink';
  quote?: string;
  /** Cover thumbnail URL, e.g. from Kakao book search. */
  coverUrl?: string;
  /** Date the book was marked "done", as "YYYY.MM.DD". Set/cleared by updateBookDoc when status changes. */
  completedAt?: string;
};

export const STATUS_LABEL: Record<ReadingStatus, string> = {
  reading: '읽는 중',
  done: '완독',
  wish: '읽고 싶은',
};
