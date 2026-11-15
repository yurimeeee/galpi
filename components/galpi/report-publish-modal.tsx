import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, Text, View } from 'react-native';
import { showAlert } from '../../lib/alert';
import {
  captureViewAsImage,
  saveImageToDevice,
  shareImage,
  MediaPermissionError,
  ShareUnavailableError,
} from '../../lib/share-image';
import { BookCheck, Bookmark, CalendarDays, Download, Moon, Quote, Share2, X, type LucideIcon } from '../../lib/icons';
import { BottomSheet } from './bottom-sheet';
import { GalpiHeaderLogo } from './galpi-logo';
import { useCoverFallback } from '../../lib/hooks/use-cover-fallback';
import { useThemeColors, ACCENT_BG_CLASS, INTENSITY_CLASS } from '../../lib/theme';
import { pad2 } from '../../lib/date-utils';
import { useAppStore } from '../../lib/store';
import {
  HOUR_BUCKET_LABELS,
  WEEKDAY_LABELS,
  buildYearHeatmap,
  getMonthMetrics,
  getPeriodQuote,
  getTimePattern,
  getTopGenres,
  getYearMetrics,
  maxIndex,
} from '../../lib/stats';
import type { Book } from '../../lib/data/books';
import type { Sentence } from '../../lib/data/sentences';

type Ratio = '1:1' | '9:16';

/** Report-card flavor text for each `HOUR_BUCKET_LABELS` bucket. */
const HOUR_BUCKET_DESC = [
  '고요한 새벽에 문장을 모았어요',
  '상쾌한 오전에 문장을 모았어요',
  '여유로운 오후에 문장을 모았어요',
  '고요한 밤에 문장을 모았어요',
];

/* ---------- 독서 리포트 발행 모달 ---------- */
export function ReportPublishModal({
  onClose,
  period,
  cursor,
  books,
  sentences,
}: {
  onClose: () => void;
  period: 'month' | 'year';
  cursor: Date;
  books: Book[];
  sentences: Sentence[];
}) {
  const [ratio, setRatio] = useState<Ratio>('1:1');
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);
  const [realCardWidth, setRealCardWidth] = useState(0);
  const cardRef = useRef<View>(null);
  const colors = useThemeColors();
  const displayName = useAppStore((s) => s.user?.displayName) || '갈피 독자';

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const scopedMonth = period === 'month' ? month : undefined;

  const bookById = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);

  const monthData = useMemo(() => getMonthMetrics(books, sentences, year, month), [books, sentences, year, month]);
  const yearData = useMemo(() => getYearMetrics(books, sentences, year), [books, sentences, year]);
  const heatmap = useMemo(() => buildYearHeatmap(sentences, year), [sentences, year]);

  const { weekdayCounts, hourBucketCounts, hasHourData } = useMemo(
    () => getTimePattern(sentences, year, scopedMonth),
    [sentences, year, scopedMonth],
  );
  const topWeekdayIndex = maxIndex(weekdayCounts);
  const topHourIndex = maxIndex(hourBucketCounts);
  const topGenres = useMemo(
    () => getTopGenres(sentences, bookById, year, scopedMonth),
    [sentences, bookById, year, scopedMonth],
  );
  const quote = useMemo(
    () => getPeriodQuote(sentences, bookById, year, scopedMonth),
    [sentences, bookById, year, scopedMonth],
  );

  const metrics = period === 'month' ? monthData : yearData;
  const dateLabel =
    period === 'month'
      ? `${year}.${pad2(month + 1)}.${pad2(new Date(year, month + 1, 0).getDate())}`
      : `${year}.12.31`;
  const title = period === 'month' ? `${year}년 ${month + 1}월 독서 리포트` : `${year} 연간 독서 리포트`;

  async function handleSaveImage() {
    if (busy) return;
    setBusy('save');
    try {
      const uri = await captureViewAsImage(cardRef);
      await saveImageToDevice(uri, `galpi-report-${Date.now()}.png`);
      if (Platform.OS !== 'web') {
        showAlert('저장 완료', '독서 리포트 이미지를 사진 보관함에 저장했어요.');
      }
    } catch (err) {
      if (err instanceof MediaPermissionError) {
        showAlert('권한이 필요해요', err.message);
      } else {
        showAlert('저장 실패', '이미지를 저장하는 중 문제가 발생했어요.');
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    if (busy) return;
    setBusy('share');
    try {
      const uri = await captureViewAsImage(cardRef);
      await shareImage(uri, {
        filename: 'galpi-report.png',
        title: '갈피 독서 리포트',
        dialogTitle: '독서 리포트 공유하기',
      });
    } catch (err) {
      if (err instanceof ShareUnavailableError) {
        showAlert('공유하기', err.message);
      } else {
        showAlert('공유 실패', '리포트를 공유하는 중 문제가 발생했어요.');
      }
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
            <Text className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">
              Reading Report
            </Text>
            <Text className="mt-0.5 text-lg font-bold tracking-tight text-foreground">독서 리포트 발행</Text>
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
      <View className="mb-4 flex-row gap-1 rounded-xl bg-secondary p-1">
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
      <View className="items-center rounded-xl bg-secondary p-4">
        {/* 실제 크기 측정용 스페이서: 시각적으로는 차지하는 공간이 없음 */}
        <View className="h-0 w-full" onLayout={(e) => setRealCardWidth(e.nativeEvent.layout.width)} />

        <View
          className={`overflow-hidden rounded-2xl bg-card p-5 ${ratio === '1:1' ? 'w-full' : 'w-[68%]'}`}
          style={{ aspectRatio: ratio === '1:1' ? 1 : 9 / 16 }}
        >
          <ReportCardBody
            ratio={ratio}
            dateLabel={dateLabel}
            title={title}
            metrics={metrics}
            period={period}
            monthData={monthData}
            heatmap={heatmap}
            weekdayCounts={weekdayCounts}
            hourBucketCounts={hourBucketCounts}
            hasHourData={hasHourData}
            topWeekdayIndex={topWeekdayIndex}
            topHourIndex={topHourIndex}
            topGenres={topGenres}
            quote={quote}
            displayName={displayName}
          />
        </View>

        {/* 캡처 전용 실제 크기 카드: 화면 밖에 렌더링되어 보이지 않음 */}
        {realCardWidth > 0 ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: -99999, top: 0 }}>
            <View
              ref={cardRef}
              collapsable={false}
              className="overflow-hidden rounded-2xl bg-card p-5"
              style={{ width: realCardWidth, aspectRatio: ratio === '1:1' ? 1 : 9 / 16 }}
            >
              <ReportCardBody
                ratio={ratio}
                dateLabel={dateLabel}
                title={title}
                metrics={metrics}
                period={period}
                monthData={monthData}
                heatmap={heatmap}
                weekdayCounts={weekdayCounts}
                hourBucketCounts={hourBucketCounts}
                hasHourData={hasHourData}
                topWeekdayIndex={topWeekdayIndex}
                topHourIndex={topHourIndex}
                topGenres={topGenres}
                quote={quote}
                displayName={displayName}
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
          className={`web:cursor-pointer flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-primary py-3.5 ${busy ? 'opacity-60' : ''}`}
        >
          {busy === 'save' ? <ActivityIndicator color={colors.primaryForeground} /> : <Download size={16} color={colors.primaryForeground} />}
          <Text className="text-sm font-bold text-primary-foreground">이미지 저장하기</Text>
        </Pressable>
        <Pressable
          onPress={handleShare}
          disabled={busy !== null}
          className={`web:cursor-pointer flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-border bg-card py-3.5 ${busy ? 'opacity-60' : ''}`}
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
  ratio,
  dateLabel,
  title,
  metrics,
  period,
  monthData,
  heatmap,
  weekdayCounts,
  hourBucketCounts,
  hasHourData,
  topWeekdayIndex,
  topHourIndex,
  topGenres,
  quote,
  displayName,
}: {
  ratio: Ratio;
  dateLabel: string;
  title: string;
  metrics: { doneCount: number; galpiCount: number; readDaysCount: number };
  period: 'month' | 'year';
  monthData: ReturnType<typeof getMonthMetrics>;
  heatmap: number[][];
  weekdayCounts: number[];
  hourBucketCounts: number[];
  hasHourData: boolean;
  topWeekdayIndex: number;
  topHourIndex: number;
  topGenres: string[];
  quote: { book: Book; sentence: Sentence } | null;
  displayName: string;
}) {
  const colors = useThemeColors();

  return (
    <View className="gap-1.5">
      {ratio === '9:16' ? (
        <View>
          <View className="flex-row items-center justify-between">
            <GalpiHeaderLogo markSize={13} wordClassName="text-[10px] text-foreground" />
            <View className="rounded-full bg-secondary px-2 py-0.5">
              <Text className="text-[8px] font-semibold text-muted-foreground">{dateLabel}</Text>
            </View>
          </View>

          <Text className="mt-1.5 text-sm font-black leading-tight text-foreground">{title}</Text>

          <View className="mt-1.5 flex-row gap-1.5">
            <ReportMetricCard Icon={BookCheck} value={metrics.doneCount} unit="권" label="완독한 책" />
            <ReportMetricCard Icon={Bookmark} value={metrics.galpiCount} unit="개" label="수집한 갈피" />
            <ReportMetricCard Icon={CalendarDays} value={metrics.readDaysCount} unit="일" label="읽은 날" />
          </View>
        </View>
      ) : null}

      {/* 주로 읽는 요일 */}
      <View className="rounded-xl bg-secondary/60 p-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-[9px] font-black text-foreground">주로 읽는 요일</Text>
          {topWeekdayIndex >= 0 ? (
            <View className="rounded-full bg-galpi-ink px-1.5 py-0.5">
              <Text className="text-[7px] font-bold text-galpi-paper">{WEEKDAY_LABELS[topWeekdayIndex]}요일</Text>
            </View>
          ) : null}
        </View>
        {topWeekdayIndex >= 0 ? (
          <>
            <View className="mt-1.5 flex-row items-end gap-1">
              {WEEKDAY_LABELS.map((label, i) => {
                const isTop = i === topWeekdayIndex;
                return (
                  <View key={label} className="flex-1 items-center gap-0.5">
                    <View className={`w-full rounded-full ${isTop ? 'h-2.5 bg-galpi-ink' : 'h-1 bg-border'}`} />
                    <Text className={`text-[7px] font-bold ${isTop ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text className="mt-1 text-[7px] leading-relaxed text-muted-foreground" numberOfLines={1}>
              {WEEKDAY_LABELS[topWeekdayIndex]}요일에 갈피를 가장 많이 남겼어요.
            </Text>
          </>
        ) : (
          <Text className="mt-1 text-[7px] leading-relaxed text-muted-foreground">아직 기록이 없어요.</Text>
        )}
      </View>

      {/* 기록 시간대 · 이달의 취향 */}
      <View className="flex-row gap-1.5">
        <View className="flex-1 rounded-xl bg-galpi-green p-2">
          <View className="flex-row items-center gap-1">
            <Moon size={8} color={colors.galpiInk} opacity={0.7} />
            <Text className="text-[7px] font-bold text-galpi-ink/70">기록 시간대</Text>
          </View>
          {hasHourData && topHourIndex >= 0 ? (
            <>
              <Text className="mt-0.5 text-[11px] font-black text-galpi-ink">{HOUR_BUCKET_LABELS[topHourIndex]}</Text>
              <Text className="mt-0.5 text-[6.5px] leading-tight text-galpi-ink/60" numberOfLines={1}>
                {HOUR_BUCKET_DESC[topHourIndex]}
              </Text>
            </>
          ) : (
            <Text className="mt-0.5 text-[6.5px] leading-tight text-galpi-ink/60">기록이 쌓이면 나타나요</Text>
          )}
        </View>

        <View className="flex-1 rounded-xl bg-secondary/60 p-2">
          <Text className="text-[7px] font-bold text-foreground">{period === 'month' ? '이달의 취향' : '올해의 취향'}</Text>
          {topGenres.length > 0 ? (
            <View className="mt-1 flex-row flex-wrap gap-1">
              {topGenres.map((genre, i) => (
                <View key={genre} className={`rounded-full px-1.5 py-0.5 ${i === 0 ? 'bg-galpi-yellow' : 'bg-card'}`}>
                  <Text className="text-[6.5px] font-bold text-galpi-ink" numberOfLines={1}>
                    #{genre}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="mt-0.5 text-[6.5px] leading-tight text-muted-foreground">취향이 쌓이면 나타나요</Text>
          )}
        </View>
      </View>

      {period === 'month' ? (
        <View>
          <Text className="mb-1 text-[8px] font-bold text-foreground">이달 완독한 책</Text>
          {monthData.completedBooks.length > 0 ? (
            <View className="flex-row gap-1">
              {monthData.completedBooks.slice(0, 5).map((book) => (
                <CompletedBookCover key={book.id} book={book} />
              ))}
            </View>
          ) : (
            <Text className="text-[7px] leading-relaxed text-muted-foreground">이달 완독한 책이 아직 없어요.</Text>
          )}
        </View>
      ) : (
        <View className="rounded-xl bg-galpi-ink p-2">
          <Text className="mb-1 text-[7px] font-bold text-galpi-paper/60">연간 독서 활동</Text>
          <ReportHeatmap grid={heatmap} />
        </View>
      )}

      {quote ? (
        <View className="rounded-xl bg-galpi-ink p-2">
          <Quote size={8} color={colors.galpiPaper} opacity={0.6} />
          <Text className="mt-0.5 text-[9px] font-bold leading-snug text-galpi-paper" numberOfLines={2}>
            "{quote.sentence.quote}"
          </Text>
          <Text className="mt-0.5 text-[7px] text-galpi-paper/50" numberOfLines={1}>
            {quote.book.title} · P.{quote.sentence.page}
          </Text>
        </View>
      ) : null}

      <View className="flex-row items-center justify-between">
        <Text className="shrink-0 text-[7px] font-bold text-foreground" numberOfLines={1}>
          {displayName} 님의 독서 기록
        </Text>
        <Text className="ml-2 shrink text-[6.5px] text-muted-foreground" numberOfLines={1}>
          책 속에서 나만의 갈피를 찾다
        </Text>
      </View>
    </View>
  );
}

function CompletedBookCover({ book }: { book: Book }) {
  const { showCover, onCoverError } = useCoverFallback(book.coverUrl);
  const colors = useThemeColors();

  return (
    <View
      className={`relative h-9 w-9 items-start justify-end overflow-hidden rounded-lg p-1 ${
        showCover ? 'bg-secondary' : ACCENT_BG_CLASS[book.accent]
      }`}
    >
      {showCover ? (
        <Image
          source={{ uri: book.coverUrl }}
          className="absolute inset-0 h-full w-full"
          resizeMode="cover"
          onError={onCoverError}
        />
      ) : null}
      <View className={showCover ? 'rounded-full bg-galpi-ink/50 p-0.5' : undefined}>
        <Bookmark
          size={9}
          color={showCover || book.accent === 'ink' ? colors.galpiPaper : colors.galpiInk}
          opacity={showCover ? 1 : book.accent === 'ink' ? 1 : 0.7}
        />
      </View>
    </View>
  );
}

/** Compact stat card used in the 9:16 report card's metric row (icon + big number + label). */
function ReportMetricCard({ Icon, value, unit, label }: { Icon: LucideIcon; value: number; unit: string; label: string }) {
  const colors = useThemeColors();
  return (
    <View className="flex-1 items-center gap-1 rounded-xl bg-secondary py-2">
      <Icon size={12} color={colors.mutedForeground} />
      <View className="flex-row items-baseline gap-0.5">
        <Text className="text-sm font-black text-foreground">{value}</Text>
        <Text className="text-micro font-bold text-muted-foreground">{unit}</Text>
      </View>
      <Text className="text-micro font-medium text-muted-foreground">{label}</Text>
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
