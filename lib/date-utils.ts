/** "YYYY.MM.DD" → Date, used for both Sentence.date and Book.completedAt. Returns null if unparsable. */
export function parseDotDate(dateStr: string): Date | null {
  const [y, m, d] = dateStr.split('.').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Today as "YYYY.MM.DD", matching the format Sentence.date/Book.completedAt are stored in. */
export function todayLabel(): string {
  const d = new Date();
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
}

/** 24h hour (0-23) as a Korean 12h label, e.g. 21 → "오후 9시", 0 → "오전 12시". */
export function formatHourKorean(hour: number): string {
  const period = hour < 12 ? '오전' : '오후';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${display}시`;
}
