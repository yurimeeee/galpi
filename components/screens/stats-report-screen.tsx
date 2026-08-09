import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import {
  BookCheck,
  Bookmark,
  Share2,
  Sparkles,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Grid2x2,
  CalendarDays,
  Quote,
  type LucideIcon,
} from 'lucide-react-native';
import { Skeleton } from '../galpi/skeleton';
import { BottomSheet } from '../galpi/bottom-sheet';
import { GalpiHeaderLogo } from '../galpi/galpi-logo';
import { colors, type Accent, ACCENT_BG_CLASS } from '../../lib/theme';
import type { Book } from '../../lib/data/books';
import type { Sentence } from '../../lib/data/sentences';

type Period = 'month' | 'year';
type MonthView = 'date' | 'cover';
type Ratio = '1:1' | '9:16';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const INTENSITY_CLASS = ['bg-secondary', 'bg-galpi-green/50', 'bg-galpi-green', 'bg-galpi-blue', 'bg-galpi-ink'];

/** "YYYY.MM.DD" → Date, used for both Sentence.date and Book.completedAt. Returns null if unparsable. */
function parseDotDate(dateStr: string): Date | null {
  const [y, m, d] = dateStr.split('.').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function seasonOf(month0: number): '봄' | '여름' | '가을' | '겨울' {
  if (month0 === 11 || month0 <= 1) return '겨울';
  if (month0 <= 4) return '봄';
  if (month0 <= 7) return '여름';
  return '가을';
}

function intensityFromCount(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

/** GitHub-style weekly-column grid of activity intensity for a given year; -1 marks days outside the year. */
function buildYearHeatmap(sentences: Sentence[], year: number): number[][] {
  const dayCounts = new Map<string, number>();
  for (const s of sentences) {
    const d = parseDotDate(s.date);
    if (!d || d.getFullYear() !== year) continue;
    const key = dateKey(d);
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }

  const start = new Date(year, 0, 1);
  const gridStart = new Date(start);
  gridStart.setDate(gridStart.getDate() - start.getDay());
  const end = new Date(year, 11, 31);
  const gridEnd = new Date(end);
  gridEnd.setDate(gridEnd.getDate() + (6 - end.getDay()));

  const grid: number[][] = [];
  const day = new Date(gridStart);
  while (day <= gridEnd) {
    const col: number[] = [];
    for (let i = 0; i < 7; i++) {
      col.push(day.getFullYear() === year ? intensityFromCount(dayCounts.get(dateKey(day)) ?? 0) : -1);
      day.setDate(day.getDate() + 1);
    }
    grid.push(col);
  }
  return grid;
}

function getYearMetrics(books: Book[], sentences: Sentence[], year: number) {
  const doneCount = books.filter((b) => {
    const d = b.completedAt ? parseDotDate(b.completedAt) : null;
    return d && d.getFullYear() === year;
  }).length;
  const uniqueDays = new Set<string>();
  let galpiCount = 0;
  for (const s of sentences) {
    const d = parseDotDate(s.date);
    if (!d || d.getFullYear() !== year) continue;
    galpiCount += 1;
    uniqueDays.add(dateKey(d));
  }
  return { doneCount, galpiCount, readDaysCount: uniqueDays.size };
}

function getMonthMetrics(books: Book[], sentences: Sentence[], year: number, month: number) {
  const completedBooks = books.filter((b) => {
    const d = b.completedAt ? parseDotDate(b.completedAt) : null;
    return d && d.getFullYear() === year && d.getMonth() === month;
  });
  const uniqueDays = new Set<string>();
  let galpiCount = 0;
  for (const s of sentences) {
    const d = parseDotDate(s.date);
    if (!d || d.getFullYear() !== year || d.getMonth() !== month) continue;
    galpiCount += 1;
    uniqueDays.add(dateKey(d));
  }
  return { doneCount: completedBooks.length, galpiCount, readDaysCount: uniqueDays.size, completedBooks };
}

export function StatsReportScreen({ books, sentences }: { books: Book[]; sentences: Sentence[] }) {
  const [period, setPeriod] = useState<Period>('month');
  const [shareOpen, setShareOpen] = useState(false);
  const [cursor, setCursor] = useState(() => new Date());

  const bookById = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);

  function shiftMonth(delta: number) {
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }
  function shiftYear(delta: number) {
    setCursor((d) => new Date(d.getFullYear() + delta, d.getMonth(), 1));
  }

  return (
    <SafeAreaView edges={['top']} className="relative flex-1 min-h-0 bg-background">
      <View className="flex-row items-center justify-between px-6 pb-2 pt-1">
        <Text className="text-xl font-black tracking-tight text-foreground">독서 통계</Text>
        <Pressable
          onPress={() => setShareOpen(true)}
          accessibilityLabel="리포트 발행"
          className="web:cursor-pointer h-9 w-9 items-center justify-center rounded-full bg-galpi-ink"
        >
          <Share2 size={16} color={colors.galpiPaper} />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerClassName={period === 'month' ? 'pb-28' : 'pb-6'}>
        {/* 기간 선택 */}
        <View className="mt-2 flex-row gap-1 rounded-2xl bg-secondary p-1">
          {(['month', 'year'] as Period[]).map((key) => {
            const label = key === 'month' ? '월간' : '연간';
            const active = period === key;
            return (
              <Pressable
                key={key}
                onPress={() => setPeriod(key)}
                className={`web:cursor-pointer flex-1 rounded-xl py-2.5 ${active ? 'bg-card' : ''}`}
              >
                <Text className={`text-center text-sm font-bold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {period === 'month' ? (
          <MonthlyView cursor={cursor} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} sentences={sentences} bookById={bookById} />
        ) : (
          <YearlyView cursor={cursor} onPrev={() => shiftYear(-1)} onNext={() => shiftYear(1)} books={books} sentences={sentences} />
        )}
      </ScrollView>

      {period === 'month' ? (
        <View className="absolute inset-x-0 bottom-0 items-center px-6 pb-6">
          <Pressable
            onPress={() => setShareOpen(true)}
            className="web:cursor-pointer w-full flex-row items-center justify-center gap-2 rounded-2xl bg-galpi-ink py-4"
            style={({ pressed }) => [
              {
                shadowColor: colors.galpiInk,
                shadowOpacity: 0.25,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
              },
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <Sparkles size={15} color={colors.galpiPaper} />
            <Text className="text-sm font-bold text-galpi-paper">이달의 독서 리포트 발행하기</Text>
          </Pressable>
        </View>
      ) : null}

      {shareOpen ? (
        <ReportPublishModal onClose={() => setShareOpen(false)} period={period} cursor={cursor} books={books} sentences={sentences} />
      ) : null}
    </SafeAreaView>
  );
}

export function StatsReportSkeleton() {
  return (
    <SafeAreaView edges={['top']} className="relative flex-1 min-h-0 bg-background">
      <View className="flex-row items-center justify-between px-6 pb-2 pt-1">
        <Text className="text-xl font-black tracking-tight text-foreground">독서 통계</Text>
        <View className="items-center justify-center rounded-full h-9 w-9 bg-galpi-ink">
          <Share2 size={16} color={colors.galpiPaper} />
        </View>
      </View>

      <View className="flex-1 px-6">
        <View className="mt-2 flex-row gap-1 rounded-2xl bg-secondary p-1">
          {(['월간', '연간'] as const).map((label, i) => (
            <View key={label} className={`flex-1 rounded-xl py-2.5 ${i === 0 ? 'bg-card' : ''}`}>
              <Text className={`text-center text-sm font-bold ${i === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        <View className="mt-6 flex-row items-center justify-between">
          <Skeleton className="h-8 w-32 rounded-lg" />
        </View>

        <Skeleton className="mt-4 h-64 w-full rounded-3xl" />

        <View className="mt-6 gap-2.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ---------- 월간 뷰 ---------- */
function MonthlyView({
  cursor,
  onPrev,
  onNext,
  sentences,
  bookById,
}: {
  cursor: Date;
  onPrev: () => void;
  onNext: () => void;
  sentences: Sentence[];
  bookById: Map<string, Book>;
}) {
  const [view, setView] = useState<MonthView>('date');
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const { readDays, booksThisMonth } = useMemo(() => {
    const days = new Map<number, Accent>();
    const galpiByBook = new Map<string, number>();
    for (const s of sentences) {
      const d = parseDotDate(s.date);
      if (!d || d.getFullYear() !== year || d.getMonth() !== month) continue;
      const book = bookById.get(s.bookId);
      if (!days.has(d.getDate())) {
        days.set(d.getDate(), book?.accent ?? 'ink');
      }
      galpiByBook.set(s.bookId, (galpiByBook.get(s.bookId) ?? 0) + 1);
    }
    const list = Array.from(galpiByBook.entries())
      .map(([bookId, count]) => ({ book: bookById.get(bookId), count }))
      .filter((entry): entry is { book: Book; count: number } => Boolean(entry.book))
      .sort((a, b) => b.count - a.count);
    return { readDays: days, booksThisMonth: list };
  }, [sentences, bookById, year, month]);

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const readCount = readDays.size;

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <>
      {/* 월 네비게이터 */}
      <View className="mt-6 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={onPrev} accessibilityLabel="이전 달" className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <ChevronLeft size={16} color={colors.foreground} />
          </Pressable>
          <View>
            <Text className="text-base font-black text-foreground">{year}년 {month + 1}월</Text>
            <Text className="text-[11px] font-medium text-muted-foreground">읽은 날 · {readCount}일</Text>
          </View>
          <Pressable onPress={onNext} accessibilityLabel="다음 달" className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <ChevronRight size={16} color={colors.foreground} />
          </Pressable>
        </View>

        {/* 서브 뷰 토글 */}
        <View className="flex-row gap-1 rounded-full bg-secondary p-1">
          <Pressable
            onPress={() => setView('date')}
            accessibilityLabel="날짜 뷰"
            className={`web:cursor-pointer flex-row items-center gap-1 rounded-full px-3 py-1.5 ${view === 'date' ? 'bg-card' : ''}`}
          >
            <CalendarDays size={14} color={view === 'date' ? colors.foreground : colors.mutedForeground} />
            <Text className={`text-[11px] font-bold ${view === 'date' ? 'text-foreground' : 'text-muted-foreground'}`}>날짜</Text>
          </Pressable>
          <Pressable
            onPress={() => setView('cover')}
            accessibilityLabel="표지 뷰"
            className={`web:cursor-pointer flex-row items-center gap-1 rounded-full px-3 py-1.5 ${view === 'cover' ? 'bg-card' : ''}`}
          >
            <Grid2x2 size={14} color={view === 'cover' ? colors.foreground : colors.mutedForeground} />
            <Text className={`text-[11px] font-bold ${view === 'cover' ? 'text-foreground' : 'text-muted-foreground'}`}>표지</Text>
          </Pressable>
        </View>
      </View>

      {/* 달력 */}
      <View className="mt-4 rounded-3xl bg-card p-4">
        <View className="mb-2 flex-row">
          {WEEKDAY_LABELS.map((d) => (
            <Text key={d} className="w-[14.28%] text-center text-[10px] font-semibold text-muted-foreground">
              {d}
            </Text>
          ))}
        </View>
        <View className="flex-row flex-wrap">
          {cells.map((day, i) => {
            if (day === null) {
              return <View key={`e-${i}`} className="aspect-square w-[14.28%]" />;
            }
            const accent = readDays.get(day);
            const read = Boolean(accent);

            if (view === 'cover') {
              return (
                <View key={day} className="aspect-square w-[14.28%] p-[3px]">
                  <View
                    className={`flex-1 items-center justify-center rounded-lg ${
                      read ? ACCENT_BG_CLASS[accent!] : ''
                    }`}
                  >
                    {read ? (
                      <Bookmark size={14} color={accent === 'ink' ? colors.galpiPaper : colors.galpiInk} />
                    ) : (
                      <Text className="text-[10px] font-bold text-muted-foreground/40">{day}</Text>
                    )}
                  </View>
                </View>
              );
            }

            return (
              <View key={day} className="aspect-square w-[14.28%] p-[3px]">
                <View className={`flex-1 items-center justify-center rounded-lg ${read ? 'bg-galpi-ink' : ''}`}>
                  <Text className={`text-[11px] font-bold ${read ? 'text-galpi-paper' : 'text-muted-foreground/50'}`}>
                    {day}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* 이달 갈피를 남긴 책 */}
      <View className="mt-6">
        <View className="mb-3 flex-row items-baseline justify-between">
          <Text className="text-base font-black tracking-tight text-foreground">이달 갈피를 남긴 책</Text>
          <Text className="text-xs font-medium text-muted-foreground">{booksThisMonth.length}권</Text>
        </View>
        {booksThisMonth.length === 0 ? (
          <View className="rounded-2xl border border-dashed border-border bg-card px-6 py-8">
            <Text className="text-center text-sm leading-relaxed text-muted-foreground">
              이달 남긴 갈피가 아직 없어요.{'\n'}책장을 펼쳐 첫 문장을 담아보세요.
            </Text>
          </View>
        ) : (
          <View className="gap-2.5">
            {booksThisMonth.map(({ book, count }) => (
              <View key={book.id} className="flex-row items-center gap-3 rounded-2xl bg-card p-3">
                <View className={`h-12 w-9 shrink-0 items-center justify-center rounded-md ${ACCENT_BG_CLASS[book.accent]}`}>
                  <Bookmark size={14} color={book.accent === 'ink' ? colors.galpiPaper : colors.galpiInk} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text numberOfLines={1} className="text-sm font-bold text-foreground">{book.title}</Text>
                  <Text numberOfLines={1} className="text-xs text-muted-foreground">{book.author}</Text>
                </View>
                <View className="shrink-0 flex-row items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
                  <Bookmark size={11} color={colors.mutedForeground} />
                  <Text className="text-[11px] font-bold text-foreground">{count}개</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </>
  );
}

/* ---------- 연간 뷰 ---------- */
function YearlyView({
  cursor,
  onPrev,
  onNext,
  books,
  sentences,
}: {
  cursor: Date;
  onPrev: () => void;
  onNext: () => void;
  books: Book[];
  sentences: Sentence[];
}) {
  const year = cursor.getFullYear();

  const grid = useMemo(() => buildYearHeatmap(sentences, year), [sentences, year]);

  const { seasonLabel, topBook, topQuote } = useMemo(() => {
    const inYear = sentences
      .map((s) => ({ s, d: parseDotDate(s.date) }))
      .filter((x): x is { s: Sentence; d: Date } => Boolean(x.d) && x.d!.getFullYear() === year);

    const seasonCounts: Record<string, number> = { 봄: 0, 여름: 0, 가을: 0, 겨울: 0 };
    const bookCounts = new Map<string, number>();

    for (const { s, d } of inYear) {
      seasonCounts[seasonOf(d.getMonth())] += 1;
      bookCounts.set(s.bookId, (bookCounts.get(s.bookId) ?? 0) + 1);
    }

    let seasonLabel: string | null = null;
    let seasonMax = 0;
    for (const [season, count] of Object.entries(seasonCounts)) {
      if (count > seasonMax) {
        seasonMax = count;
        seasonLabel = season;
      }
    }

    let topBook: Book | undefined;
    let topCount = 0;
    for (const [bookId, count] of bookCounts) {
      if (count > topCount) {
        topCount = count;
        topBook = books.find((b) => b.id === bookId);
      }
    }
    const topQuote = topBook
      ? inYear
          .filter((x) => x.s.bookId === topBook!.id)
          .sort((a, b) => b.d.getTime() - a.d.getTime())[0]?.s
      : undefined;

    return { seasonLabel, topBook, topQuote };
  }, [sentences, books, year]);

  const { doneCount, galpiCount, readDaysCount } = useMemo(() => getYearMetrics(books, sentences, year), [books, sentences, year]);

  return (
    <>
      {/* 연 네비게이터 */}
      <View className="mt-6 flex-row items-center gap-3">
        <Pressable onPress={onPrev} accessibilityLabel="이전 해" className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-secondary">
          <ChevronLeft size={16} color={colors.foreground} />
        </Pressable>
        <Text className="text-base font-black text-foreground">{year}년</Text>
        <Pressable onPress={onNext} accessibilityLabel="다음 해" className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-secondary">
          <ChevronRight size={16} color={colors.foreground} />
        </Pressable>
      </View>

      {/* 핵심 지표 카드 */}
      <View className="mt-5 flex-row gap-3">
        <MetricCard Icon={BookCheck} value={String(doneCount)} unit="권" label="완독한 책" toneClass="bg-galpi-green" />
        <MetricCard Icon={Bookmark} value={String(galpiCount)} unit="개" label="남긴 갈피" toneClass="bg-galpi-yellow" />
        <MetricCard Icon={CalendarDays} value={String(readDaysCount)} unit="일" label="읽은 날" toneClass="bg-galpi-blue" />
      </View>

      {/* 활동 히트맵 */}
      <View className="mt-6 rounded-3xl bg-card p-5">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-sm font-black text-foreground">연간 독서 활동</Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-[10px] text-muted-foreground">적음</Text>
            {INTENSITY_CLASS.map((c, i) => (
              <View key={i} className={`h-2.5 w-2.5 rounded-[3px] ${c}`} />
            ))}
            <Text className="text-[10px] text-muted-foreground">많음</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1">
          {grid.map((col, w) => (
            <View key={w} className="gap-1">
              {col.map((v, d) => (
                <View key={d} className={`h-3 w-3 rounded-[3px] ${v >= 0 ? INTENSITY_CLASS[v] : ''}`} />
              ))}
            </View>
          ))}
        </ScrollView>

        <Text className="mt-4 text-xs leading-relaxed text-muted-foreground">
          {seasonLabel ? (
            <>
              {year}년, 가장 활발했던 계절은{' '}
              <Text className="font-bold text-foreground">{seasonLabel}</Text>이에요.
            </>
          ) : (
            `아직 ${year}년의 독서 기록이 없어요.`
          )}
        </Text>
      </View>

      {/* 올해 가장 많이 담은 책 */}
      <View className="mt-5 rounded-3xl bg-galpi-ink p-5">
        <View className="flex-row items-center gap-1.5">
          <Quote size={12} color={colors.galpiPaper} opacity={0.6} />
          <Text className="text-[11px] font-bold text-galpi-paper/60">올해 가장 많이 담은 책</Text>
        </View>
        {topBook && topQuote ? (
          <>
            <Text className="mt-3 text-base font-bold leading-relaxed text-galpi-paper">
              "{topQuote.quote}"
            </Text>
            <Text className="mt-3 text-xs text-galpi-paper/50">{topBook.title} · P.{topQuote.page}</Text>
          </>
        ) : (
          <Text className="mt-3 text-sm leading-relaxed text-galpi-paper/70">
            아직 이 해에 남긴 문장이 없어요.
          </Text>
        )}
      </View>
    </>
  );
}

function MetricCard({
  Icon,
  value,
  unit,
  label,
  toneClass,
}: {
  Icon: LucideIcon;
  value: string;
  unit: string;
  label: string;
  toneClass: string;
}) {
  return (
    <View className="flex-1 rounded-2xl bg-card p-3.5">
      <View className={`h-8 w-8 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon size={16} color={colors.galpiInk} />
      </View>
      <View className="mt-3 flex-row items-baseline gap-0.5">
        <Text className="text-xl font-black text-foreground">{value}</Text>
        <Text className="text-[11px] font-semibold text-muted-foreground">{unit}</Text>
      </View>
      <Text className="mt-0.5 text-[11px] font-medium text-muted-foreground">{label}</Text>
    </View>
  );
}

/* ---------- 독서 리포트 발행 모달 ---------- */
function ReportPublishModal({
  onClose,
  period,
  cursor,
  books,
  sentences,
}: {
  onClose: () => void;
  period: Period;
  cursor: Date;
  books: Book[];
  sentences: Sentence[];
}) {
  const [ratio, setRatio] = useState<Ratio>('1:1');
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);
  const [realCardWidth, setRealCardWidth] = useState(0);
  const cardRef = useRef<View>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const monthData = useMemo(() => getMonthMetrics(books, sentences, year, month), [books, sentences, year, month]);
  const yearData = useMemo(() => getYearMetrics(books, sentences, year), [books, sentences, year]);
  const heatmap = useMemo(() => buildYearHeatmap(sentences, year), [sentences, year]);

  const metrics = period === 'month' ? monthData : yearData;
  const dateLabel =
    period === 'month'
      ? `${year}.${pad2(month + 1)}.${pad2(new Date(year, month + 1, 0).getDate())}`
      : `${year}.12.31`;
  const title = period === 'month' ? `${year}년 ${month + 1}월 독서 리포트` : `${year} 연간 독서 리포트`;

  /**
   * react-native-view-shot's cross-platform captureRef() always resolves
   * the ref through RN's findNodeHandle, which react-native-web throws on
   * ("use the ref property instead") — so the web path renders the card
   * with html2canvas directly against the DOM node instead.
   */
  async function capture(): Promise<string> {
    if (Platform.OS === 'web') {
      const { default: html2canvas } = await import('html2canvas');
      const node = cardRef.current as unknown as HTMLElement;
      const canvas = await html2canvas(node, { backgroundColor: null });
      return canvas.toDataURL('image/png', 1);
    }
    return captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
  }

  async function handleSaveImage() {
    if (busy) return;
    setBusy('save');
    try {
      const uri = await capture();
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = `galpi-report-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('권한이 필요해요', '사진 보관함 접근 권한을 허용해주세요.');
          return;
        }
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('저장 완료', '독서 리포트 이미지를 사진 보관함에 저장했어요.');
      }
    } catch {
      Alert.alert('저장 실패', '이미지를 저장하는 중 문제가 발생했어요.');
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    if (busy) return;
    setBusy('share');
    try {
      const uri = await capture();
      if (Platform.OS === 'web') {
        const nav = navigator as Navigator & {
          share?: (data: ShareData) => Promise<void>;
          canShare?: (data: ShareData) => boolean;
        };
        if (nav.share) {
          const blob = await (await fetch(uri)).blob();
          const file = new File([blob], 'galpi-report.png', { type: 'image/png' });
          if (!nav.canShare || nav.canShare({ files: [file] })) {
            await nav.share({ files: [file], title: '갈피 독서 리포트' });
            return;
          }
        }
        Alert.alert('공유하기', '이 브라우저에서는 공유가 지원되지 않아요. 이미지 저장 후 직접 공유해주세요.');
      } else {
        if (!(await Sharing.isAvailableAsync())) {
          Alert.alert('공유 불가', '이 기기에서는 공유 기능을 사용할 수 없어요.');
          return;
        }
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '독서 리포트 공유하기' });
      }
    } catch {
      Alert.alert('공유 실패', '리포트를 공유하는 중 문제가 발생했어요.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <BottomSheet
      onClose={onClose}
      maxHeight="94%"
      header={
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Reading Report
            </Text>
            <Text className="mt-0.5 text-lg font-black tracking-tight text-foreground">독서 리포트 발행</Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityLabel="닫기"
            className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-secondary"
          >
            <X size={16} color={colors.foreground} />
          </Pressable>
        </View>
      }
    >
      {/* 비율 선택 */}
      <View className="mb-4 flex-row gap-1 rounded-2xl bg-secondary p-1">
        {([
          { key: '1:1' as Ratio, label: '1:1 인스타 피드' },
          { key: '9:16' as Ratio, label: '9:16 스토리' },
        ]).map(({ key, label }) => {
          const active = ratio === key;
          return (
            <Pressable
              key={key}
              onPress={() => setRatio(key)}
              className={`web:cursor-pointer flex-1 rounded-xl py-2.5 ${active ? 'bg-card' : ''}`}
            >
              <Text className={`text-center text-xs font-bold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 발행 카드 미리보기 — 화면엔 작게 보여주고, 캡처는 실제 크기(전체 너비)로 별도 렌더링 */}
      <View className="items-center rounded-2xl bg-secondary p-4">
        {/* 실제 크기 측정용 스페이서: 시각적으로는 차지하는 공간이 없음 */}
        <View className="h-0 w-full" onLayout={(e) => setRealCardWidth(e.nativeEvent.layout.width)} />

        <View
          className={`justify-between overflow-hidden rounded-3xl bg-card p-5 ${ratio === '1:1' ? 'w-full' : 'w-[58%]'}`}
          style={{ aspectRatio: ratio === '1:1' ? 1 : 9 / 16 }}
        >
          <ReportCardBody
            dateLabel={dateLabel}
            title={title}
            metrics={metrics}
            period={period}
            monthData={monthData}
            heatmap={heatmap}
          />
        </View>

        {/* 캡처 전용 실제 크기 카드: 화면 밖에 렌더링되어 보이지 않음 */}
        {realCardWidth > 0 ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: -99999, top: 0 }}>
            <View
              ref={cardRef}
              collapsable={false}
              className="justify-between overflow-hidden rounded-3xl bg-card p-5"
              style={{ width: realCardWidth, aspectRatio: ratio === '1:1' ? 1 : 9 / 16 }}
            >
              <ReportCardBody
                dateLabel={dateLabel}
                title={title}
                metrics={metrics}
                period={period}
                monthData={monthData}
                heatmap={heatmap}
              />
            </View>
          </View>
        ) : null}
      </View>

      {/* 액션 버튼 */}
      <View className="mt-5 flex-row gap-3">
        <Pressable
          onPress={handleSaveImage}
          disabled={busy !== null}
          className={`web:cursor-pointer flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-galpi-ink py-3.5 ${busy ? 'opacity-60' : ''}`}
        >
          {busy === 'save' ? <ActivityIndicator color={colors.galpiPaper} /> : <Download size={16} color={colors.galpiPaper} />}
          <Text className="text-sm font-bold text-galpi-paper">이미지 저장하기</Text>
        </Pressable>
        <Pressable
          onPress={handleShare}
          disabled={busy !== null}
          className={`web:cursor-pointer flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 ${busy ? 'opacity-60' : ''}`}
        >
          {busy === 'share' ? <ActivityIndicator color={colors.foreground} /> : <Share2 size={16} color={colors.foreground} />}
          <Text className="text-sm font-bold text-foreground">SNS 공유하기</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

/** 발행 카드의 실제 내용. 작은 미리보기와 실제 크기 캡처 대상 양쪽에서 그대로 재사용한다. */
function ReportCardBody({
  dateLabel,
  title,
  metrics,
  period,
  monthData,
  heatmap,
}: {
  dateLabel: string;
  title: string;
  metrics: { doneCount: number; galpiCount: number; readDaysCount: number };
  period: Period;
  monthData: ReturnType<typeof getMonthMetrics>;
  heatmap: number[][];
}) {
  return (
    <>
      <View>
        <View className="flex-row items-center justify-between">
          <GalpiHeaderLogo markSize={16} wordClassName="text-xs text-foreground" />
          <Text className="text-[11px] font-semibold text-muted-foreground">{dateLabel}</Text>
        </View>

        <Text className="mt-4 text-lg font-black leading-tight text-foreground">{title}</Text>

        <View className="mt-5 flex-row items-center">
          <ReportMetric Icon={BookCheck} value={metrics.doneCount} unit="권" label="완독한 책" />
          <View className="h-9 w-px bg-border" />
          <ReportMetric Icon={Bookmark} value={metrics.galpiCount} unit="개" label="수집한 갈피" />
          <View className="h-9 w-px bg-border" />
          <ReportMetric Icon={CalendarDays} value={metrics.readDaysCount} unit="일" label="읽은 날" />
        </View>
      </View>

      {period === 'month' ? (
        <View>
          <Text className="mb-2.5 text-xs font-bold text-foreground">이달 완독한 책</Text>
          {monthData.completedBooks.length > 0 ? (
            <View className="flex-row gap-2">
              {monthData.completedBooks.slice(0, 5).map((book) => (
                <View
                  key={book.id}
                  className={`aspect-square flex-1 items-start justify-end rounded-xl p-2 ${ACCENT_BG_CLASS[book.accent]}`}
                >
                  <Bookmark size={13} color={book.accent === 'ink' ? colors.galpiPaper : colors.galpiInk} />
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-[11px] leading-relaxed text-muted-foreground">
              이달 완독한 책이 아직 없어요.
            </Text>
          )}
        </View>
      ) : (
        <View className="rounded-2xl bg-galpi-ink p-3.5">
          <Text className="mb-2.5 text-[11px] font-bold text-galpi-paper/60">연간 독서 활동</Text>
          <ReportHeatmap grid={heatmap} />
        </View>
      )}
    </>
  );
}

function ReportMetric({ Icon, value, unit, label }: { Icon: LucideIcon; value: number; unit: string; label: string }) {
  return (
    <View className="flex-1 items-center gap-1.5">
      <Icon size={16} color={colors.mutedForeground} />
      <View className="flex-row items-baseline gap-0.5">
        <Text className="text-lg font-black text-foreground">{value}</Text>
        <Text className="text-[10px] font-bold text-muted-foreground">{unit}</Text>
      </View>
      <Text className="text-[10px] font-medium text-muted-foreground">{label}</Text>
    </View>
  );
}

/**
 * The report card is a static export, not a scrollable page, so the full
 * year must always be visible — cell size is derived from the measured
 * container width instead of a fixed pixel size, which would overflow (and
 * get clipped by the card's overflow-hidden) once the year has ~52 columns.
 */
function ReportHeatmap({ grid }: { grid: number[][] }) {
  const [width, setWidth] = useState(0);
  const gap = 2;
  const cols = grid.length;
  const cellSize = width > 0 ? Math.max(1.5, (width - (cols - 1) * gap) / cols) : 0;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <View className="flex-row" style={{ gap }}>
          {grid.map((col, w) => (
            <View key={w} style={{ gap }}>
              {col.map((v, d) => (
                <View
                  key={d}
                  className={v >= 0 ? INTENSITY_CLASS[v] : 'opacity-0'}
                  style={{ width: cellSize, height: cellSize, borderRadius: Math.max(0.5, cellSize * 0.3) }}
                />
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
