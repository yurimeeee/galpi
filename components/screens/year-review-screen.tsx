import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookCheck, Bookmark, CalendarDays, ChevronLeft, ChevronRight, Clock, Download, Flame, Quote, Share2, Sparkles, X } from 'lucide-react-native';
import { captureViewAsImage, saveImageToDevice, shareImage, MediaPermissionError, ShareUnavailableError } from '../../lib/share-image';
import { useCoverFallback } from '../../lib/hooks/use-cover-fallback';
import { ACCENT_BG_CLASS, useThemeColors } from '../../lib/theme';
import { activeReadingDays, getTopBookOfYear, yearBestStreak, yearlyReadingMinutes } from '../../lib/reading-goals';
import {
  DistributionBars,
  INTENSITY_CLASS,
  WEEKDAY_LABELS,
  buildYearHeatmap,
  getTimePattern,
  getTopGenres,
  getYearMetrics,
} from './stats-report-screen';
import type { Book } from '../../lib/data/books';
import type { Sentence } from '../../lib/data/sentences';

/** Index of the largest value, or -1 if every value is 0 — mirrors stats-report-screen's private helper (not exported, small enough to duplicate). */
function maxIndex(counts: number[]): number {
  let idx = -1;
  let max = 0;
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] > max) {
      max = counts[i];
      idx = i;
    }
  }
  return idx;
}

function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0분';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}분`;
  if (minutes === 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

export function YearReviewScreen({
  year,
  books,
  sentences,
  readingLog,
  displayName,
  onBack,
}: {
  year: number;
  books: Book[];
  sentences: Sentence[];
  readingLog: Record<string, number>;
  displayName: string;
  onBack: () => void;
}) {
  const { width } = useWindowDimensions();
  const colors = useThemeColors();
  const [pageIndex, setPageIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const bookById = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);
  const { doneCount, galpiCount, readDaysCount } = useMemo(() => getYearMetrics(books, sentences, year), [books, sentences, year]);
  const completedBooks = useMemo(
    () => books.filter((b) => b.status === 'done' && b.completedAt?.startsWith(`${year}.`)),
    [books, year],
  );
  const heatmap = useMemo(() => buildYearHeatmap(sentences, year), [sentences, year]);
  const { weekdayCounts } = useMemo(() => getTimePattern(sentences, year), [sentences, year]);
  const topWeekdayIndex = maxIndex(weekdayCounts);
  const bestStreak = useMemo(() => yearBestStreak(activeReadingDays(sentences, readingLog), year), [sentences, readingLog, year]);
  const yearMinutes = useMemo(() => yearlyReadingMinutes(readingLog, year), [readingLog, year]);
  const topGenres = useMemo(() => getTopGenres(sentences, bookById, year), [sentences, bookById, year]);
  const topBookOfYear = useMemo(() => getTopBookOfYear(sentences, books, year), [sentences, books, year]);

  const hasAnyData = galpiCount > 0 || doneCount > 0;

  const cardWidth = width;
  const cards = ['intro', 'books', 'weekday', 'streak', 'time', 'genres', 'topBook', 'summary'] as const;

  function onScrollEnd(offsetX: number) {
    setPageIndex(Math.round(offsetX / cardWidth));
  }

  /**
   * Swipe/drag-to-scroll works natively on touch devices, but a mouse-only
   * desktop browser has no equivalent gesture (a click-drag just selects
   * text) — so these buttons are the only way to advance the deck there.
   */
  function goToIndex(i: number) {
    const clamped = Math.max(0, Math.min(cards.length - 1, i));
    scrollRef.current?.scrollTo({ x: clamped * cardWidth, animated: true });
    setPageIndex(clamped);
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 min-h-0 bg-galpi-ink">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
        <View className="flex-1 flex-row gap-1.5">
          {cards.map((key, i) => (
            <View
              key={key}
              className={`h-1 flex-1 rounded-full ${i <= pageIndex ? 'bg-galpi-paper' : 'bg-galpi-paper/20'}`}
            />
          ))}
        </View>
        <Pressable onPress={onBack} accessibilityLabel="닫기" className="web:cursor-pointer ml-4 h-8 w-8 items-center justify-center rounded-full bg-galpi-paper/10">
          <X size={16} color={colors.galpiPaper} />
        </Pressable>
      </View>

      {!hasAnyData ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base font-bold leading-relaxed text-galpi-paper">
            아직 {year}년의 독서 기록이 없어요.{'\n'}갈피를 남기면 결산이 여기 채워져요.
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            className="flex-1"
            onMomentumScrollEnd={(e) => onScrollEnd(e.nativeEvent.contentOffset.x)}
          >
            <View style={{ width: cardWidth }} className="flex-1 items-center justify-center px-8">
              <IntroCard year={year} displayName={displayName} doneCount={doneCount} galpiCount={galpiCount} />
            </View>

            <View style={{ width: cardWidth }} className="flex-1 items-center justify-center px-8">
              <BooksCard year={year} completedBooks={completedBooks} />
            </View>

            <View style={{ width: cardWidth }} className="flex-1 items-center justify-center px-8">
              <WeekdayCard readDaysCount={readDaysCount} weekdayCounts={weekdayCounts} topWeekdayIndex={topWeekdayIndex} />
            </View>

            <View style={{ width: cardWidth }} className="flex-1 items-center justify-center px-8">
              <StreakCard year={year} bestStreak={bestStreak} heatmap={heatmap} />
            </View>

            <View style={{ width: cardWidth }} className="flex-1 items-center justify-center px-8">
              <TimeCard yearMinutes={yearMinutes} />
            </View>

            <View style={{ width: cardWidth }} className="flex-1 items-center justify-center px-8">
              <GenresCard topGenres={topGenres} />
            </View>

            <View style={{ width: cardWidth }} className="flex-1 items-center justify-center px-8">
              <TopBookCard topBookOfYear={topBookOfYear} />
            </View>

            <View style={{ width: cardWidth }} className="flex-1 items-center px-6 pt-6">
              <SummaryCard
                year={year}
                displayName={displayName}
                doneCount={doneCount}
                galpiCount={galpiCount}
                readDaysCount={readDaysCount}
                bestStreak={bestStreak}
                topGenres={topGenres}
                topBookOfYear={topBookOfYear}
              />
            </View>
          </ScrollView>

          {pageIndex > 0 ? (
            <Pressable
              onPress={() => goToIndex(pageIndex - 1)}
              accessibilityLabel="이전 카드"
              style={{ top: '50%', marginTop: -18 }}
              className="web:cursor-pointer absolute left-2 h-9 w-9 items-center justify-center rounded-full bg-galpi-paper/10"
            >
              <ChevronLeft size={18} color={colors.galpiPaper} />
            </Pressable>
          ) : null}

          {pageIndex < cards.length - 1 ? (
            <Pressable
              onPress={() => goToIndex(pageIndex + 1)}
              accessibilityLabel="다음 카드"
              style={{ top: '50%', marginTop: -18 }}
              className="web:cursor-pointer absolute right-2 h-9 w-9 items-center justify-center rounded-full bg-galpi-paper/10"
            >
              <ChevronRight size={18} color={colors.galpiPaper} />
            </Pressable>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

function CardShell({ children }: { children: ReactNode }) {
  return <View className="w-full max-w-sm gap-6">{children}</View>;
}

function IntroCard({ year, displayName, doneCount, galpiCount }: { year: number; displayName: string; doneCount: number; galpiCount: number }) {
  return (
    <CardShell>
      <View className="items-center gap-3">
        <Sparkles size={28} color="#EFF092" />
        <Text className="text-center text-2xl font-black leading-tight text-galpi-paper">
          {year}년,{'\n'}{displayName}님의 독서
        </Text>
        <Text className="text-center text-sm leading-relaxed text-galpi-paper/60">
          한 해 동안 책 {doneCount}권을 완독하고{'\n'}갈피 {galpiCount}개를 남겼어요.
        </Text>
      </View>
    </CardShell>
  );
}

function BooksCard({ year, completedBooks }: { year: number; completedBooks: Book[] }) {
  return (
    <CardShell>
      <View className="items-center gap-1">
        <Text className="text-center text-lg font-black text-galpi-paper">{year}년 완독한 책</Text>
        <Text className="text-center text-sm text-galpi-paper/60">{completedBooks.length}권</Text>
      </View>
      {completedBooks.length > 0 ? (
        <View className="flex-row flex-wrap justify-center gap-2.5">
          {completedBooks.slice(0, 12).map((book) => (
            <WrapBookCover key={book.id} book={book} />
          ))}
        </View>
      ) : (
        <Text className="text-center text-sm leading-relaxed text-galpi-paper/60">
          아직 완독한 책이 없어요.{'\n'}읽고 있는 책을 끝까지 읽어보아요.
        </Text>
      )}
    </CardShell>
  );
}

function WeekdayCard({ readDaysCount, weekdayCounts, topWeekdayIndex }: { readDaysCount: number; weekdayCounts: number[]; topWeekdayIndex: number }) {
  return (
    <CardShell>
      <View className="items-center gap-1">
        <CalendarDays size={24} color="#D8DBE9" />
        <Text className="mt-2 text-center text-lg font-black text-galpi-paper">읽은 날 {readDaysCount}일</Text>
      </View>
      {topWeekdayIndex >= 0 ? (
        <>
          <View className="rounded-2xl bg-galpi-paper/5 p-4">
            <DistributionBars labels={WEEKDAY_LABELS} counts={weekdayCounts} topIndex={topWeekdayIndex} />
          </View>
          <Text className="text-center text-sm leading-relaxed text-galpi-paper/60">
            <Text className="font-bold text-galpi-paper">{WEEKDAY_LABELS[topWeekdayIndex]}요일</Text>에 갈피를 가장 많이
            남겼어요.
          </Text>
        </>
      ) : (
        <Text className="text-center text-sm leading-relaxed text-galpi-paper/60">아직 기록이 없어요.</Text>
      )}
    </CardShell>
  );
}

function StreakCard({ year, bestStreak, heatmap }: { year: number; bestStreak: number; heatmap: number[][] }) {
  return (
    <CardShell>
      <View className="items-center gap-1">
        <Flame size={24} color="#EFF092" />
        <Text className="mt-2 text-center text-lg font-black text-galpi-paper">
          최장 연속 독서 <Text className="text-galpi-yellow">{bestStreak}일</Text>
        </Text>
        <Text className="text-center text-sm text-galpi-paper/60">{year}년 독서 활동</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1 px-1">
        {heatmap.map((col, w) => (
          <View key={w} className="gap-1">
            {col.map((v, d) => (
              <View key={d} className={`h-2.5 w-2.5 rounded-[2px] ${v >= 0 ? INTENSITY_CLASS[v] : 'opacity-0'}`} />
            ))}
          </View>
        ))}
      </ScrollView>
    </CardShell>
  );
}

function TimeCard({ yearMinutes }: { yearMinutes: number }) {
  return (
    <CardShell>
      <View className="items-center gap-3">
        <Clock size={28} color="#D8DBE9" />
        <Text className="text-center text-2xl font-black text-galpi-paper">{formatMinutes(yearMinutes)}</Text>
        <Text className="text-center text-sm leading-relaxed text-galpi-paper/60">올해 독서 타이머로 기록한{'\n'}총 독서 시간이에요.</Text>
      </View>
    </CardShell>
  );
}

function GenresCard({ topGenres }: { topGenres: string[] }) {
  return (
    <CardShell>
      <View className="items-center gap-1">
        <Text className="text-center text-lg font-black text-galpi-paper">올해의 취향</Text>
      </View>
      {topGenres.length > 0 ? (
        <View className="flex-row flex-wrap justify-center gap-2">
          {topGenres.map((genre, i) => (
            <View key={genre} className={`rounded-full px-3.5 py-2 ${i === 0 ? 'bg-galpi-yellow' : 'bg-galpi-paper/10'}`}>
              <Text className={`text-sm font-bold ${i === 0 ? 'text-galpi-ink' : 'text-galpi-paper'}`}>#{genre}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-center text-sm leading-relaxed text-galpi-paper/60">장르 정보가 있는 책이 쌓이면 여기에 취향이 나타나요.</Text>
      )}
    </CardShell>
  );
}

function TopBookCard({ topBookOfYear }: { topBookOfYear: { book: Book; sentence: Sentence } | null }) {
  return (
    <CardShell>
      <View className="items-center gap-1">
        <Quote size={22} color="#F4F4F6" opacity={0.6} />
        <Text className="mt-1 text-center text-[11px] font-bold uppercase tracking-widest text-galpi-paper/50">
          올해 가장 많이 담은 책
        </Text>
      </View>
      {topBookOfYear ? (
        <>
          <Text className="text-center text-base font-bold leading-relaxed text-galpi-paper">"{topBookOfYear.sentence.quote}"</Text>
          <Text className="text-center text-sm text-galpi-paper/50">
            {topBookOfYear.book.title} · P.{topBookOfYear.sentence.page}
          </Text>
        </>
      ) : (
        <Text className="text-center text-sm leading-relaxed text-galpi-paper/60">아직 담은 문장이 없어요.</Text>
      )}
    </CardShell>
  );
}

function WrapBookCover({ book }: { book: Book }) {
  const { showCover, onCoverError } = useCoverFallback(book.coverUrl);
  const colors = useThemeColors();
  return (
    <View className={`h-16 w-11 items-center justify-center overflow-hidden rounded-md ${showCover ? 'bg-galpi-paper/10' : ACCENT_BG_CLASS[book.accent]}`}>
      {showCover ? (
        <Image source={{ uri: book.coverUrl }} className="h-full w-full" resizeMode="cover" onError={onCoverError} />
      ) : (
        <Bookmark size={14} color={book.accent === 'ink' ? colors.galpiPaper : colors.galpiInk} />
      )}
    </View>
  );
}

function SummaryCard({
  year,
  displayName,
  doneCount,
  galpiCount,
  readDaysCount,
  bestStreak,
  topGenres,
  topBookOfYear,
}: {
  year: number;
  displayName: string;
  doneCount: number;
  galpiCount: number;
  readDaysCount: number;
  bestStreak: number;
  topGenres: string[];
  topBookOfYear: { book: Book; sentence: Sentence } | null;
}) {
  const colors = useThemeColors();
  const cardRef = useRef<View>(null);
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);

  async function handleSaveImage() {
    if (busy) return;
    setBusy('save');
    try {
      const uri = await captureViewAsImage(cardRef);
      await saveImageToDevice(uri, `galpi-year-review-${year}.png`);
      Alert.alert('저장 완료', '독서 결산 이미지를 사진 보관함에 저장했어요.');
    } catch (err) {
      Alert.alert(err instanceof MediaPermissionError ? '권한이 필요해요' : '저장 실패', err instanceof Error ? err.message : '이미지를 저장하는 중 문제가 발생했어요.');
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    if (busy) return;
    setBusy('share');
    try {
      const uri = await captureViewAsImage(cardRef);
      await shareImage(uri, { filename: `galpi-year-review-${year}.png`, title: `${year}년 독서 결산`, dialogTitle: '독서 결산 공유하기' });
    } catch (err) {
      if (!(err instanceof ShareUnavailableError)) {
        Alert.alert('공유 실패', '결산을 공유하는 중 문제가 발생했어요.');
      } else {
        Alert.alert('공유하기', err.message);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <View className="w-full max-w-sm gap-5">
      <View ref={cardRef} collapsable={false} className="gap-4 rounded-3xl bg-card p-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-black text-foreground">{year}년 독서 결산</Text>
          <Text className="text-xs font-semibold text-muted-foreground">{displayName}</Text>
        </View>

        <View className="flex-row gap-2">
          <SummaryStat Icon={BookCheck} value={doneCount} unit="권" label="완독" />
          <SummaryStat Icon={Bookmark} value={galpiCount} unit="개" label="갈피" />
          <SummaryStat Icon={CalendarDays} value={readDaysCount} unit="일" label="읽은 날" />
          <SummaryStat Icon={Flame} value={bestStreak} unit="일" label="최장 연속" />
        </View>

        {topGenres.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5">
            {topGenres.map((genre, i) => (
              <View key={genre} className={`rounded-full px-2.5 py-1 ${i === 0 ? 'bg-galpi-yellow' : 'bg-secondary'}`}>
                <Text className="text-[11px] font-bold text-galpi-ink">#{genre}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {topBookOfYear ? (
          <View className="rounded-2xl bg-galpi-ink p-3.5">
            <Text numberOfLines={2} className="text-[13px] font-bold leading-relaxed text-galpi-paper">
              "{topBookOfYear.sentence.quote}"
            </Text>
            <Text className="mt-1 text-[11px] text-galpi-paper/50">{topBookOfYear.book.title}</Text>
          </View>
        ) : null}

        <Text className="text-center text-[10px] text-muted-foreground">책 속에서 나만의 갈피를 찾다 · 갈피</Text>
      </View>

      <View className="flex-row gap-3">
        <Pressable
          onPress={handleSaveImage}
          disabled={busy !== null}
          className={`web:cursor-pointer flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-galpi-paper py-3.5 ${busy ? 'opacity-60' : ''}`}
        >
          {busy === 'save' ? <ActivityIndicator color={colors.galpiInk} /> : <Download size={16} color={colors.galpiInk} />}
          <Text className="text-sm font-bold text-galpi-ink">이미지 저장</Text>
        </Pressable>
        <Pressable
          onPress={handleShare}
          disabled={busy !== null}
          className={`web:cursor-pointer flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-galpi-paper/30 py-3.5 ${busy ? 'opacity-60' : ''}`}
        >
          {busy === 'share' ? <ActivityIndicator color={colors.galpiPaper} /> : <Share2 size={16} color={colors.galpiPaper} />}
          <Text className="text-sm font-bold text-galpi-paper">공유하기</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SummaryStat({ Icon, value, unit, label }: { Icon: typeof BookCheck; value: number; unit: string; label: string }) {
  return (
    <View className="flex-1 items-center gap-1 rounded-xl bg-secondary py-2.5">
      <Icon size={13} color="#77777D" />
      <View className="flex-row items-baseline gap-0.5">
        <Text className="text-sm font-black text-foreground">{value}</Text>
        <Text className="text-[9px] font-bold text-muted-foreground">{unit}</Text>
      </View>
      <Text className="text-[9px] font-medium text-muted-foreground">{label}</Text>
    </View>
  );
}
