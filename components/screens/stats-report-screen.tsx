import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { RemoteImage } from '../galpi/remote-image';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  BookCheck,
  Bookmark,
  Share2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Grid2x2,
  CalendarDays,
  Quote,
  PartyPopper,
  ArrowUp,
  ArrowDown,
  type LucideIcon,
} from '../../lib/icons';
import { Skeleton } from '../galpi/skeleton';
import { BookCover } from '../galpi/book-cover';
import { Button } from '../galpi/button';
import { IconButton } from '../galpi/icon-button';
import { ReportPublishModal } from '../galpi/report-publish-modal';
import { useCoverFallback } from '../../lib/hooks/use-cover-fallback';
import { useThemeColors, ACCENT_BG_CLASS, INTENSITY_CLASS } from '../../lib/theme';
import { parseDotDate } from '../../lib/date-utils';
import { getTopBookOfYear } from '../../lib/reading-goals';
import type { Book } from '../../lib/data/books';
import type { Sentence } from '../../lib/data/sentences';
import {
  HOUR_BUCKET_LABELS,
  WEEKDAY_LABELS,
  buildYearHeatmap,
  getGenrePattern,
  getMonthMetrics,
  getTimePattern,
  getYearMetrics,
  maxIndex,
  seasonOf,
} from '../../lib/stats';

type Period = 'month' | 'year';
type MonthView = 'date' | 'cover';

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
      <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
        <Text className="text-xl font-black tracking-tight text-foreground">독서 통계</Text>
        <IconButton Icon={Share2} label="리포트 발행" onPress={() => setShareOpen(true)} variant="primary" />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8">
        {/* 기간 선택 */}
        <PeriodToggle period={period} onChange={setPeriod} />

        {period === 'month' ? (
          <MonthlyView cursor={cursor} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} books={books} sentences={sentences} bookById={bookById} />
        ) : (
          <YearlyView cursor={cursor} onPrev={() => shiftYear(-1)} onNext={() => shiftYear(1)} books={books} sentences={sentences} />
        )}

        {/* 리포트 발행: 플로팅 대신 콘텐츠 끝에 — 헤더 공유 버튼과 함께 두 번째 진입점 */}
        <Button
          label={period === 'month' ? '이달의 독서 리포트 발행하기' : '올해의 독서 리포트 발행하기'}
          Icon={Sparkles}
          onPress={() => setShareOpen(true)}
          className="mt-8"
        />
      </ScrollView>

      {shareOpen ? (
        <ReportPublishModal onClose={() => setShareOpen(false)} period={period} cursor={cursor} books={books} sentences={sentences} />
      ) : null}
    </SafeAreaView>
  );
}

export function StatsReportSkeleton() {
  const colors = useThemeColors();
  return (
    <SafeAreaView edges={['top']} className="relative flex-1 min-h-0 bg-background">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
        <Text className="text-xl font-black tracking-tight text-foreground">독서 통계</Text>
        <View className="items-center justify-center rounded-full h-9 w-9 bg-primary">
          <Share2 size={16} color={colors.primaryForeground} />
        </View>
      </View>

      <View className="flex-1 px-5">
        <View className="mt-2 flex-row gap-1 rounded-xl bg-secondary p-1">
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

        <Skeleton className="mt-4 h-64 w-full rounded-2xl" />

        <View className="mt-6 gap-2.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

function PeriodToggle({ period, onChange }: { period: Period; onChange: (period: Period) => void }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const segmentWidth = trackWidth > 0 ? (trackWidth - 8 - 4) / 2 : 0; // p-1 (4px * 2) + gap-1 (4px) between 2 segments
  const index = period === 'month' ? 0 : 1;
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    if (segmentWidth > 0) {
      indicatorX.value = withTiming(index * (segmentWidth + 4), { duration: 220, easing: Easing.out(Easing.cubic) });
    }
  }, [index, segmentWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    height: '100%',
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View
      className="mt-2 flex-row gap-1 rounded-xl bg-secondary p-1"
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      {segmentWidth > 0 && (
        <View className="absolute bottom-1 left-1 right-1 top-1" style={{ pointerEvents: 'none' }}>
          <Animated.View style={indicatorStyle}>
            <View className="h-full rounded-xl bg-card" />
          </Animated.View>
        </View>
      )}
      {(['month', 'year'] as Period[]).map((key) => {
        const label = key === 'month' ? '월간' : '연간';
        const active = period === key;
        return (
          <Pressable key={key} onPress={() => onChange(key)} className="web:cursor-pointer flex-1 rounded-xl py-2.5">
            <Text className={`text-center text-sm font-bold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- 월간 뷰 ---------- */
function MonthlyView({
  cursor,
  onPrev,
  onNext,
  books,
  sentences,
  bookById,
}: {
  cursor: Date;
  onPrev: () => void;
  onNext: () => void;
  books: Book[];
  sentences: Sentence[];
  bookById: Map<string, Book>;
}) {
  const [view, setView] = useState<MonthView>('date');
  const colors = useThemeColors();
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const monthMetrics = useMemo(() => getMonthMetrics(books, sentences, year, month), [books, sentences, year, month]);
  const prevMonthMetrics = useMemo(() => {
    const prev = new Date(year, month - 1, 1);
    return getMonthMetrics(books, sentences, prev.getFullYear(), prev.getMonth());
  }, [books, sentences, year, month]);

  const { readDays, booksThisMonth } = useMemo(() => {
    const days = new Map<number, Book | undefined>();
    const galpiByBook = new Map<string, number>();
    for (const s of sentences) {
      const d = parseDotDate(s.date);
      if (!d || d.getFullYear() !== year || d.getMonth() !== month) continue;
      const book = bookById.get(s.bookId);
      if (!days.has(d.getDate())) {
        days.set(d.getDate(), book);
      }
      galpiByBook.set(s.bookId, (galpiByBook.get(s.bookId) ?? 0) + 1);
    }
    const list = Array.from(galpiByBook.entries())
      .map(([bookId, count]) => ({ book: bookById.get(bookId), count }))
      .filter((entry): entry is { book: Book; count: number } => Boolean(entry.book))
      .sort((a, b) => b.count - a.count);
    return { readDays: days, booksThisMonth: list };
  }, [sentences, bookById, year, month]);

  const { weekdayCounts, hourBucketCounts, hasHourData } = useMemo(
    () => getTimePattern(sentences, year, month),
    [sentences, year, month],
  );
  const topWeekdayIndex = maxIndex(weekdayCounts);
  const topHourIndex = maxIndex(hourBucketCounts);

  const { topReadGenre, topLikedGenre, hasGenreData } = useMemo(
    () => getGenrePattern(sentences, bookById, year, month),
    [sentences, bookById, year, month],
  );

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

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
          <Text className="text-base font-black text-foreground">{year}년 {month + 1}월</Text>
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
            <Text className={`text-2xs font-bold ${view === 'date' ? 'text-foreground' : 'text-muted-foreground'}`}>날짜</Text>
          </Pressable>
          <Pressable
            onPress={() => setView('cover')}
            accessibilityLabel="표지 뷰"
            className={`web:cursor-pointer flex-row items-center gap-1 rounded-full px-3 py-1.5 ${view === 'cover' ? 'bg-card' : ''}`}
          >
            <Grid2x2 size={14} color={view === 'cover' ? colors.foreground : colors.mutedForeground} />
            <Text className={`text-2xs font-bold ${view === 'cover' ? 'text-foreground' : 'text-muted-foreground'}`}>표지</Text>
          </Pressable>
        </View>
      </View>

      {/* 핵심 지표 카드 (지난달 대비 증감) */}
      <View className="mt-4 flex-row gap-3">
        <MetricCard
          Icon={BookCheck}
          value={String(monthMetrics.doneCount)}
          unit="권"
          label="완독한 책"
          toneClass="bg-galpi-green"
          delta={monthMetrics.doneCount - prevMonthMetrics.doneCount}
        />
        <MetricCard
          Icon={Bookmark}
          value={String(monthMetrics.galpiCount)}
          unit="개"
          label="남긴 갈피"
          toneClass="bg-galpi-yellow"
          delta={monthMetrics.galpiCount - prevMonthMetrics.galpiCount}
        />
        <MetricCard
          Icon={CalendarDays}
          value={String(monthMetrics.readDaysCount)}
          unit="일"
          label="읽은 날"
          toneClass="bg-galpi-blue"
          delta={monthMetrics.readDaysCount - prevMonthMetrics.readDaysCount}
        />
      </View>

      {/* 달력 */}
      <View className="mt-6 border-y border-border py-3">
        <View className="mb-2 flex-row">
          {WEEKDAY_LABELS.map((d) => (
            <Text key={d} className="w-[14.28%] text-center text-2xs font-semibold text-muted-foreground">
              {d}
            </Text>
          ))}
        </View>
        <View className="flex-row flex-wrap">
          {cells.map((day, i) => {
            if (day === null) {
              return <View key={`e-${i}`} className="aspect-square w-[14.28%]" />;
            }
            const book = readDays.get(day);
            const read = readDays.has(day);

            if (view === 'cover') {
              return <CalendarCoverCell key={day} day={day} book={book} read={read} />;
            }

            return (
              <View key={day} className="aspect-square w-[14.28%] p-[3px]">
                <View className={`flex-1 items-center justify-center rounded-lg ${read ? 'bg-galpi-ink' : ''}`}>
                  <Text className={`text-2xs font-bold ${read ? 'text-galpi-paper' : 'text-muted-foreground'}`}>
                    {day}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* 이달 요일별 독서 패턴 */}
      <View className="mt-8">
        <Text className="mb-4 text-lg font-bold tracking-tight text-foreground">주로 읽는 요일</Text>
        {topWeekdayIndex >= 0 ? (
          <>
            <DistributionBars labels={WEEKDAY_LABELS} counts={weekdayCounts} topIndex={topWeekdayIndex} />
            <Text className="mt-4 text-xs leading-relaxed text-muted-foreground">
              이달엔 <Text className="font-bold text-foreground">{WEEKDAY_LABELS[topWeekdayIndex]}요일</Text>에 갈피를 가장
              많이 남겼어요.
            </Text>
          </>
        ) : (
          <Text className="text-xs leading-relaxed text-muted-foreground">아직 이달의 독서 기록이 없어요.</Text>
        )}
      </View>

      {/* 이달 시간대별 기록 패턴 */}
      <View className="mt-8">
        <Text className="mb-4 text-lg font-bold tracking-tight text-foreground">주로 기록하는 시간대</Text>
        {hasHourData && topHourIndex >= 0 ? (
          <>
            <DistributionBars labels={HOUR_BUCKET_LABELS} counts={hourBucketCounts} topIndex={topHourIndex} />
            <Text className="mt-4 text-xs leading-relaxed text-muted-foreground">
              이달엔 <Text className="font-bold text-foreground">{HOUR_BUCKET_LABELS[topHourIndex]}</Text>에 갈피를 가장
              많이 남겼어요.
            </Text>
          </>
        ) : (
          <Text className="text-xs leading-relaxed text-muted-foreground">
            이 기능이 추가된 이후 남기는 갈피부터 시간대가 쌓여요.{'\n'}새로운 갈피를 남기면 여기에 패턴이 나타나요.
          </Text>
        )}
      </View>

      {/* 이달의 취향 */}
      <View className="mt-8">
        <Text className="mb-2 text-lg font-bold tracking-tight text-foreground">이달의 취향</Text>
        {hasGenreData ? (
          <Text className="text-xs leading-relaxed text-muted-foreground">
            이달엔 주로 <Text className="font-bold text-foreground">{topReadGenre}</Text> 책을 읽었어요.
            {topLikedGenre ? (
              <>
                {'\n'}그중에서도 <Text className="font-bold text-foreground">{topLikedGenre}</Text> 갈피를 가장 많이
                즐겨찾기했어요.
              </>
            ) : null}
          </Text>
        ) : (
          <Text className="text-xs leading-relaxed text-muted-foreground">
            장르 정보가 있는 책의 갈피가 쌓이면 여기에 취향이 나타나요.
          </Text>
        )}
      </View>

      {/* 이달 갈피를 남긴 책 */}
      <View className="mt-8">
        <View className="mb-3 flex-row items-baseline justify-between">
          <Text className="text-lg font-bold tracking-tight text-foreground">이달 갈피를 남긴 책</Text>
          <Text className="text-xs font-medium text-muted-foreground">{booksThisMonth.length}권</Text>
        </View>
        {booksThisMonth.length === 0 ? (
          <View className="rounded-xl border border-dashed border-border bg-card px-6 py-8">
            <Text className="text-center text-sm leading-relaxed text-muted-foreground">
              이달 남긴 갈피가 아직 없어요.{'\n'}책장을 펼쳐 첫 문장을 담아보세요.
            </Text>
          </View>
        ) : (
          <View className="gap-2.5">
            {booksThisMonth.map(({ book, count }) => (
              <BookThisMonthRow key={book.id} book={book} count={count} />
            ))}
          </View>
        )}
      </View>
    </>
  );
}

/* ---------- 이달 갈피를 남긴 책 목록의 각 행 ---------- */
function BookThisMonthRow({ book, count }: { book: Book; count: number }) {
  const colors = useThemeColors();

  return (
    <View className="flex-row items-center gap-3 rounded-xl bg-card p-3">
      <BookCover coverUrl={book.coverUrl} title={book.title} accent={book.accent} size="sm" />
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-sm font-bold text-foreground">{book.title}</Text>
        <Text numberOfLines={1} className="text-xs text-muted-foreground">{book.author}</Text>
      </View>
      <View className="shrink-0 flex-row items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
        <Bookmark size={11} color={colors.mutedForeground} />
        <Text className="text-2xs font-bold text-foreground">{count}개</Text>
      </View>
    </View>
  );
}

/* ---------- 달력 표지 뷰의 각 날짜 셀 ---------- */
function CalendarCoverCell({ day, book, read }: { day: number; book: Book | undefined; read: boolean }) {
  const { showCover, onCoverError } = useCoverFallback(book?.coverUrl);
  const accent = book?.accent ?? 'ink';
  const colors = useThemeColors();

  return (
    <View className="aspect-square w-[14.28%] p-[3px]">
      <View
        className={`relative flex-1 items-center justify-center overflow-hidden rounded-lg ${
          read ? (showCover ? 'bg-secondary' : ACCENT_BG_CLASS[accent]) : ''
        }`}
      >
        {read ? (
          showCover ? (
            <RemoteImage
              source={{ uri: book?.coverUrl }}
              className="absolute inset-0 h-full w-full"
              contentFit="cover"
              onError={onCoverError}
            />
          ) : (
            <Bookmark size={14} color={accent === 'ink' ? colors.galpiPaper : colors.galpiInk} />
          )
        ) : (
          <Text className="text-2xs font-bold text-muted-foreground">{day}</Text>
        )}
      </View>
    </View>
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
  const colors = useThemeColors();

  const grid = useMemo(() => buildYearHeatmap(sentences, year), [sentences, year]);

  const seasonLabel = useMemo(() => {
    const seasonCounts: Record<string, number> = { 봄: 0, 여름: 0, 가을: 0, 겨울: 0 };
    for (const s of sentences) {
      const d = parseDotDate(s.date);
      if (!d || d.getFullYear() !== year) continue;
      seasonCounts[seasonOf(d.getMonth())] += 1;
    }
    let label: string | null = null;
    let max = 0;
    for (const [season, count] of Object.entries(seasonCounts)) {
      if (count > max) {
        max = count;
        label = season;
      }
    }
    return label;
  }, [sentences, year]);

  const topBookOfYear = useMemo(() => getTopBookOfYear(sentences, books, year), [sentences, books, year]);
  const topBook = topBookOfYear?.book;
  const topQuote = topBookOfYear?.sentence;

  const { doneCount, galpiCount, readDaysCount } = useMemo(() => getYearMetrics(books, sentences, year), [books, sentences, year]);
  const prevYearMetrics = useMemo(() => getYearMetrics(books, sentences, year - 1), [books, sentences, year]);

  const { weekdayCounts, hourBucketCounts, hasHourData } = useMemo(() => getTimePattern(sentences, year), [sentences, year]);

  const topWeekdayIndex = maxIndex(weekdayCounts);
  const topHourIndex = maxIndex(hourBucketCounts);

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

      {/* 연말 결산 CTA */}
      <Pressable
        onPress={() => router.push(`/year-review?year=${year}`)}
        className="web:cursor-pointer mt-4 flex-row items-center justify-between rounded-xl bg-galpi-ink px-4 py-3.5"
      >
        <View className="flex-row items-center gap-2">
          <PartyPopper size={16} color={colors.galpiPaper} />
          <Text className="text-sm font-bold text-galpi-paper">{year}년 독서 결산 보기</Text>
        </View>
        <ChevronRight size={16} color={colors.galpiPaper} opacity={0.6} />
      </Pressable>

      {/* 핵심 지표 카드 (전년 대비 증감) */}
      <View className="mt-5 flex-row gap-3">
        <MetricCard
          Icon={BookCheck}
          value={String(doneCount)}
          unit="권"
          label="완독한 책"
          toneClass="bg-galpi-green"
          delta={doneCount - prevYearMetrics.doneCount}
        />
        <MetricCard
          Icon={Bookmark}
          value={String(galpiCount)}
          unit="개"
          label="남긴 갈피"
          toneClass="bg-galpi-yellow"
          delta={galpiCount - prevYearMetrics.galpiCount}
        />
        <MetricCard
          Icon={CalendarDays}
          value={String(readDaysCount)}
          unit="일"
          label="읽은 날"
          toneClass="bg-galpi-blue"
          delta={readDaysCount - prevYearMetrics.readDaysCount}
        />
      </View>

      {/* 활동 히트맵 */}
      <View className="mt-8">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-lg font-bold tracking-tight text-foreground">연간 독서 활동</Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-2xs text-muted-foreground">적음</Text>
            {INTENSITY_CLASS.map((c, i) => (
              <View key={i} className={`h-2.5 w-2.5 rounded-[3px] ${c}`} />
            ))}
            <Text className="text-2xs text-muted-foreground">많음</Text>
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

      {/* 요일별 독서 패턴 */}
      <View className="mt-8">
        <Text className="mb-4 text-lg font-bold tracking-tight text-foreground">주로 읽는 요일</Text>
        {topWeekdayIndex >= 0 ? (
          <>
            <DistributionBars labels={WEEKDAY_LABELS} counts={weekdayCounts} topIndex={topWeekdayIndex} />
            <Text className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {year}년, <Text className="font-bold text-foreground">{WEEKDAY_LABELS[topWeekdayIndex]}요일</Text>에 갈피를 가장
              많이 남겼어요.
            </Text>
          </>
        ) : (
          <Text className="text-xs leading-relaxed text-muted-foreground">아직 {year}년의 독서 기록이 없어요.</Text>
        )}
      </View>

      {/* 시간대별 기록 패턴 */}
      <View className="mt-8">
        <Text className="mb-4 text-lg font-bold tracking-tight text-foreground">주로 기록하는 시간대</Text>
        {hasHourData && topHourIndex >= 0 ? (
          <>
            <DistributionBars labels={HOUR_BUCKET_LABELS} counts={hourBucketCounts} topIndex={topHourIndex} />
            <Text className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {year}년, <Text className="font-bold text-foreground">{HOUR_BUCKET_LABELS[topHourIndex]}</Text>에 갈피를 가장
              많이 남겼어요.
            </Text>
          </>
        ) : (
          <Text className="text-xs leading-relaxed text-muted-foreground">
            이 기능이 추가된 이후 남기는 갈피부터 시간대가 쌓여요.{'\n'}새로운 갈피를 남기면 여기에 패턴이 나타나요.
          </Text>
        )}
      </View>

      {/* 올해 가장 많이 담은 책 */}
      <View className="mt-5 rounded-2xl bg-galpi-ink p-5">
        <View className="flex-row items-center gap-1.5">
          <Quote size={12} color={colors.galpiPaper} opacity={0.6} />
          <Text className="text-2xs font-bold text-galpi-paper/60">올해 가장 많이 담은 책</Text>
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

/** Small vertical bar chart used by the weekday/time-of-day pattern cards — tallest bar (or a tie) highlighted in ink. */
export function DistributionBars({ labels, counts, topIndex }: { labels: string[]; counts: number[]; topIndex: number }) {
  const max = Math.max(1, ...counts);
  return (
    <View className="flex-row items-end gap-2" style={{ height: 64 }}>
      {labels.map((label, i) => {
        const isTop = i === topIndex;
        return (
          <View key={label} className="flex-1 items-center gap-1.5">
            <View className="w-full flex-1 justify-end">
              <View
                className={`w-full rounded-md ${isTop ? 'bg-foreground' : 'bg-secondary'}`}
                style={{ height: Math.max(4, (counts[i] / max) * 44) }}
              />
            </View>
            <Text className={`text-2xs font-bold ${isTop ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function MetricCard({
  Icon,
  value,
  unit,
  label,
  toneClass,
  delta,
}: {
  Icon: LucideIcon;
  value: string;
  unit: string;
  label: string;
  toneClass: string;
  /** Change vs. the previous period (previous month/year); omit to hide the badge. */
  delta?: number;
}) {
  const colors = useThemeColors();
  return (
    <View className="flex-1 rounded-xl bg-card p-3.5">
      <View className={`h-8 w-8 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon size={16} color={colors.galpiInk} />
      </View>
      <View className="mt-3 flex-row items-baseline gap-0.5">
        <Text className="text-xl font-black text-foreground">{value}</Text>
        <Text className="text-2xs font-semibold text-muted-foreground">{unit}</Text>
      </View>
      <View className="mt-0.5 flex-row items-center justify-between gap-1">
        <Text className="shrink text-2xs font-medium text-muted-foreground" numberOfLines={1}>
          {label}
        </Text>
        {delta !== undefined ? <DeltaBadge delta={delta} /> : null}
      </View>
    </View>
  );
}

/**
 * Small change-vs-previous-period indicator, right-aligned next to the
 * label; used by `MetricCard`. Only a genuine increase gets a colored pill —
 * a decrease or no change stays as quiet muted text, so the highlight reads
 * as "something to notice" rather than every card wearing a badge.
 */
function DeltaBadge({ delta }: { delta: number }) {
  const colors = useThemeColors();
  if (delta === 0) {
    return <Text className="shrink-0 text-2xs font-bold text-muted-foreground">-</Text>;
  }
  if (delta > 0) {
    return (
      <View className="shrink-0 flex-row items-center gap-0.5 rounded-full bg-galpi-green py-0.5 pl-1 pr-1.5">
        <ArrowUp size={8} color={colors.galpiInk} strokeWidth={3} />
        <Text className="text-2xs font-bold text-galpi-ink">{delta}</Text>
      </View>
    );
  }
  return (
    <View className="shrink-0 flex-row items-center gap-0.5">
      <ArrowDown size={8} color={colors.mutedForeground} strokeWidth={3} />
      <Text className="text-2xs font-bold text-muted-foreground">{Math.abs(delta)}</Text>
    </View>
  );
}
