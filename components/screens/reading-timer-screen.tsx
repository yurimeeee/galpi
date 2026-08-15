import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import {
  ChevronLeft,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  BookOpen,
  Coffee,
  Bookmark,
  X,
} from 'lucide-react-native';
import { BottomSheet } from '../galpi/bottom-sheet';
import { SessionSummaryModal } from '../galpi/session-summary-modal';
import { type Book } from '../../lib/data/books';
import { useCoverFallback } from '../../lib/hooks/use-cover-fallback';
import { useNow } from '../../lib/hooks/use-now';
import { logReadingMinutes } from '../../lib/data-service';
import { auth } from '../../lib/firebase';
import {
  TIMER_PRESETS,
  TIMER_TOTAL_SESSIONS,
  presetFor,
  timerSecondsLeft,
  timerFocusSecondsTotal,
  useReadingTimerStore,
} from '../../lib/reading-timer-store';
import { ACCENT_BG_CLASS, useThemeColors } from '../../lib/theme';

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ReadingTimerScreen({
  initialBook,
  books,
  onBack,
}: {
  initialBook: Book;
  books: Book[];
  onBack: () => void;
}) {
  const active = useReadingTimerStore((s) => s.active);
  const running = useReadingTimerStore((s) => s.running);
  const completed = useReadingTimerStore((s) => s.completed);
  const phase = useReadingTimerStore((s) => s.phase);
  const sessionsDone = useReadingTimerStore((s) => s.sessionsDone);
  const presetKey = useReadingTimerStore((s) => s.presetKey);
  const customFocus = useReadingTimerStore((s) => s.customFocus);
  const storeBook = useReadingTimerStore((s) => s.book);
  const storeInitialGalpiCount = useReadingTimerStore((s) => s.initialGalpiCount);
  const startTimer = useReadingTimerStore((s) => s.start);
  const toggleRunning = useReadingTimerStore((s) => s.toggleRunning);
  const pauseTimer = useReadingTimerStore((s) => s.pause);
  const resetTimer = useReadingTimerStore((s) => s.reset);
  const setBookOnStore = useReadingTimerStore((s) => s.setBook);
  const setPresetKeyOnStore = useReadingTimerStore((s) => s.setPresetKey);
  const setCustomFocusOnStore = useReadingTimerStore((s) => s.setCustomFocus);
  const endTimer = useReadingTimerStore((s) => s.end);
  const colors = useThemeColors();

  // Repaints every second while running so the store-derived selectors below
  // (computed from Date.now()) stay live — see lib/hooks/use-now.ts.
  useNow(active && running);
  const secondsLeft = useReadingTimerStore(timerSecondsLeft);
  const focusSeconds = useReadingTimerStore(timerFocusSecondsTotal);

  // Before a session starts, book selection is just local UI state — nothing
  // to persist globally yet. Once `active`, the store's book is the source
  // of truth (it survives navigating away and back).
  const [localBook, setLocalBook] = useState<Book>(initialBook);
  const book = active && storeBook ? storeBook : localBook;

  const [showBookPicker, setShowBookPicker] = useState(false);
  const readingBooks = books.filter((b) => b.status !== 'wish');
  const [showSummary, setShowSummary] = useState(false);

  const liveGalpiCount = books.find((b) => b.id === book.id)?.galpiCount ?? book.galpiCount ?? 0;
  const sentencesCaptured = active ? Math.max(0, liveGalpiCount - storeInitialGalpiCount) : 0;

  function selectBook(b: Book) {
    if (active) {
      setBookOnStore(b, b.galpiCount ?? 0);
    } else {
      setLocalBook(b);
    }
    setShowBookPicker(false);
  }

  const preset = presetFor(presetKey, customFocus);

  const phaseTotal = (phase === 'focus' ? preset.focus : preset.rest) * 60;
  const progress = phaseTotal > 0 ? 1 - secondsLeft / phaseTotal : 0;

  // 모든 세션이 (다른 화면에 있는 동안이라도) 완료되면 요약을 띄움
  useEffect(() => {
    if (completed) setShowSummary(true);
  }, [completed]);

  function handlePlayPause() {
    if (!active) {
      startTimer(book, presetKey, customFocus, liveGalpiCount);
      return;
    }
    toggleRunning();
  }

  function handleEndSession() {
    if (!active) {
      onBack();
      return;
    }
    if (running) pauseTimer();
    setShowSummary(true);
  }

  // 원형 진행 링
  const R = 130;
  const CIRC = 2 * Math.PI * R;
  const dashOffset = CIRC * (1 - progress);

  const isRest = phase === 'rest';
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top']} className="relative flex-1 min-h-0 bg-background">
      {/* 헤더 */}
      <View className="flex-row items-center justify-between px-4 pb-1 pt-2">
        <Pressable
          onPress={onBack}
          accessibilityLabel="뒤로 가기"
          className="web:cursor-pointer h-9 w-9 items-center justify-center rounded-full bg-secondary"
        >
          <ChevronLeft size={18} color={colors.foreground} />
        </Pressable>
        <Text className="text-sm font-bold text-foreground">독서 타이머</Text>
        <Pressable
          onPress={handleEndSession}
          className="web:cursor-pointer rounded-full px-3 py-1.5"
        >
          <Text className="text-xs font-bold text-muted-foreground">독서 종료</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 min-h-0" contentContainerClassName="px-6 pb-4">
        {/* 대상 책 선택 카드 */}
        <BookSelector book={book} onPress={() => setShowBookPicker(true)} />

        {/* 상태 Pill + 세션 카운터 */}
        <View className="mb-4 mt-6 flex-row items-center justify-center gap-2">
          <View className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-1.5 ${isRest ? 'bg-galpi-green' : 'bg-galpi-blue'}`}>
            {isRest ? <Coffee size={14} color={colors.galpiInk} /> : <BookOpen size={14} color={colors.galpiInk} />}
            <Text className="text-xs font-bold text-galpi-ink">{isRest ? '잠시 휴식 시간' : '독서 몰입 시간'}</Text>
          </View>
          <View className="rounded-full bg-secondary px-3 py-1.5">
            <Text className="font-mono text-xs font-bold tabular-nums text-foreground">
              {Math.min(sessionsDone + (isRest ? 0 : 1), TIMER_TOTAL_SESSIONS)} / {TIMER_TOTAL_SESSIONS} 세션
            </Text>
          </View>
        </View>

        {/* 원형 타이머 */}
        <View pointerEvents="none" className="relative mx-auto my-2 h-[300px] w-[300px] items-center justify-center">
          <View pointerEvents="none" className="absolute inset-0" style={{ transform: [{ rotate: '-90deg' }] }}>
            <Svg width={300} height={300} viewBox="0 0 300 300">
              <Circle cx={150} cy={150} r={R} fill="none" stroke={colors.secondary} strokeWidth={10} />
              <Circle
                cx={150}
                cy={150}
                r={R}
                fill="none"
                stroke={isRest ? colors.galpiGreen : colors.galpiInk}
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={`${CIRC} ${CIRC}`}
                strokeDashoffset={dashOffset}
              />
            </Svg>
          </View>
          <View className="items-center">
            <Text
              className="font-mono text-6xl font-black leading-[1.2] tracking-tight tabular-nums text-foreground"
            >
              {fmt(secondsLeft)}
            </Text>
            <Text className="mt-2 text-xs font-medium text-muted-foreground">
              {running ? (isRest ? '휴식하는 중' : '몰입하는 중') : '시작을 기다리는 중'}
            </Text>
          </View>
        </View>

        {/* 프리셋 칩 */}
        <View className="mb-2 mt-4 gap-2">
          {TIMER_PRESETS.map((p) => {
            const selected = presetKey === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => setPresetKeyOnStore(p.key)}
                disabled={running}
                className={`web:cursor-pointer flex-row items-center justify-between rounded-2xl border px-4 py-3 ${
                  running ? 'opacity-40' : ''
                } ${selected ? 'border-galpi-ink bg-galpi-ink' : 'border-border bg-card'}`}
              >
                <Text className={`text-sm font-bold ${selected ? 'text-galpi-paper' : 'text-foreground'}`}>{p.label}</Text>
                {p.key === 'custom' && selected ? (
                  <CustomStepper value={customFocus} onChange={setCustomFocusOnStore} />
                ) : (
                  <ChevronRight size={16} color={selected ? colors.galpiPaper : colors.mutedForeground} opacity={selected ? 0.7 : 1} />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* 하단 컨트롤 바 */}
      <View
        className="border-t border-border bg-card/90 px-6 pt-4 web:backdrop-blur"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <View className="mb-3 flex-row items-center gap-3">
          <Pressable
            onPress={resetTimer}
            accessibilityLabel="처음부터"
            className="web:cursor-pointer h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary"
            style={({ pressed }) => pressed && { transform: [{ scale: 0.95 }] }}
          >
            <RotateCcw size={20} color={colors.foreground} />
          </Pressable>
          <Pressable
            onPress={handlePlayPause}
            className="web:cursor-pointer h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-galpi-ink"
            style={({ pressed }) => pressed && { transform: [{ scale: 0.98 }] }}
          >
            {running ? <Pause size={18} color={colors.galpiPaper} /> : <Play size={18} color={colors.galpiPaper} />}
            <Text className="text-base font-bold text-galpi-paper">{running ? '일시정지' : '독서 시작'}</Text>
          </Pressable>
        </View>
      </View>

      {showBookPicker ? (
        <BottomSheet
          onClose={() => setShowBookPicker(false)}
          maxHeight="75%"
          header={
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-base font-black text-foreground">읽을 책 선택</Text>
              <Pressable
                onPress={() => setShowBookPicker(false)}
                accessibilityLabel="닫기"
                className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-secondary"
              >
                <X size={16} color={colors.foreground} />
              </Pressable>
            </View>
          }
        >
          <View className="gap-2">
            {readingBooks.map((b) => (
              <BookPickerRow key={b.id} book={b} onPress={() => selectBook(b)} />
            ))}
          </View>
        </BottomSheet>
      ) : null}

      {showSummary ? (
        <SessionSummaryModal
          book={book}
          totalSeconds={focusSeconds}
          sessionsDone={sessionsDone}
          sentencesCaptured={sentencesCaptured}
          onClose={() => setShowSummary(false)}
          onSave={() => {
            const uid = auth.currentUser?.uid;
            if (uid) logReadingMinutes(uid, Math.round(focusSeconds / 60)).catch(() => {});
            setShowSummary(false);
            endTimer();
            onBack();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

/* ---------- 대상 책 선택 카드 ---------- */
function BookSelector({ book, onPress }: { book: Book; onPress: () => void }) {
  const { showCover, onCoverError } = useCoverFallback(book.coverUrl);
  const colors = useThemeColors();

  return (
    <View className="mt-2 flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <View
        className={`relative h-16 w-12 shrink-0 items-center justify-end overflow-hidden rounded-lg ${
          showCover ? 'bg-secondary' : ACCENT_BG_CLASS[book.accent]
        } p-2`}
      >
        {showCover ? (
          <Image
            source={{ uri: book.coverUrl }}
            className="absolute inset-0 h-full w-full"
            resizeMode="cover"
            onError={onCoverError}
          />
        ) : null}
        <View className={showCover ? 'rounded-full bg-galpi-ink/50 p-1' : undefined}>
          <Bookmark
            size={14}
            color={showCover || book.accent === 'ink' ? colors.galpiPaper : colors.galpiInk}
            opacity={showCover ? 1 : book.accent === 'ink' ? 1 : 0.7}
          />
        </View>
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">읽을 책 선택</Text>
        <Text numberOfLines={1} className="mt-0.5 text-sm font-bold text-foreground">
          {book.title}
        </Text>
        <Text numberOfLines={1} className="mt-0.5 text-xs text-muted-foreground">
          {book.author} · {book.progress}% 진행 중
        </Text>
      </View>
      <Pressable onPress={onPress} className="web:cursor-pointer shrink-0 rounded-full bg-secondary px-3 py-1.5">
        <Text className="text-xs font-bold text-foreground">책 변경</Text>
      </Pressable>
    </View>
  );
}

/* ---------- 책 선택 시트의 각 행 ---------- */
function BookPickerRow({ book, onPress }: { book: Book; onPress: () => void }) {
  const { showCover, onCoverError } = useCoverFallback(book.coverUrl);
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      className="web:cursor-pointer flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3"
    >
      <View
        className={`relative h-12 w-9 shrink-0 items-center justify-end overflow-hidden rounded-md ${
          showCover ? 'bg-secondary' : ACCENT_BG_CLASS[book.accent]
        } p-1`}
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
            size={12}
            color={showCover || book.accent === 'ink' ? colors.galpiPaper : colors.galpiInk}
            opacity={showCover ? 1 : book.accent === 'ink' ? 1 : 0.7}
          />
        </View>
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-sm font-bold text-foreground">
          {book.title}
        </Text>
        <Text numberOfLines={1} className="text-xs text-muted-foreground">
          {book.author}
        </Text>
      </View>
    </Pressable>
  );
}

/* ---------- 자율 설정 스테퍼 ---------- */
function CustomStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        onPress={() => onChange(Math.max(5, value - 5))}
        accessibilityLabel="시간 줄이기"
        hitSlop={6}
        className="web:cursor-pointer h-7 w-7 items-center justify-center rounded-full bg-galpi-paper/20"
      >
        <Text className="text-lg leading-none text-galpi-paper">−</Text>
      </Pressable>
      <Text className="w-12 text-center font-mono text-sm font-bold text-galpi-paper">{value}분</Text>
      <Pressable
        onPress={() => onChange(Math.min(90, value + 5))}
        accessibilityLabel="시간 늘리기"
        hitSlop={6}
        className="web:cursor-pointer h-7 w-7 items-center justify-center rounded-full bg-galpi-paper/20"
      >
        <Text className="text-lg leading-none text-galpi-paper">+</Text>
      </Pressable>
    </View>
  );
}
