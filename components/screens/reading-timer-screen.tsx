import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import {
  ChevronLeft,
  Play,
  Pause,
  RotateCcw,
  Plus,
  ChevronRight,
  BookOpen,
  Coffee,
  Bookmark,
} from 'lucide-react-native';
import { SessionSummaryModal } from '../galpi/session-summary-modal';
import { type Book } from '../../lib/data/books';
import { ACCENT_BG_CLASS, colors } from '../../lib/theme';

type Phase = 'focus' | 'rest';

type Preset = {
  key: string;
  label: string;
  focus: number; // 분
  rest: number; // 분
};

const PRESETS: Preset[] = [
  { key: '25/5', label: '25분 독서 / 5분 휴식', focus: 25, rest: 5 },
  { key: '50/10', label: '50분 독서 / 10분 휴식', focus: 50, rest: 10 },
  { key: 'custom', label: '자율 설정', focus: 15, rest: 3 },
];

const TOTAL_SESSIONS = 4;

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
  const [book, setBook] = useState<Book>(initialBook);
  const [presetKey, setPresetKey] = useState('25/5');
  const [customFocus, setCustomFocus] = useState(15);

  const preset = useMemo(() => {
    const p = PRESETS.find((x) => x.key === presetKey) ?? PRESETS[0];
    return p.key === 'custom' ? { ...p, focus: customFocus, rest: 3 } : p;
  }, [presetKey, customFocus]);

  const [phase, setPhase] = useState<Phase>('focus');
  const [secondsLeft, setSecondsLeft] = useState(preset.focus * 60);
  const [running, setRunning] = useState(false);
  const [sessionsDone, setSessionsDone] = useState(0);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [captured, setCaptured] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  const phaseTotal = (phase === 'focus' ? preset.focus : preset.rest) * 60;
  const progress = phaseTotal > 0 ? 1 - secondsLeft / phaseTotal : 0;

  // 프리셋 변경 시 정지 상태에서 시간 초기화
  useEffect(() => {
    if (!running) {
      setPhase('focus');
      setSecondsLeft(preset.focus * 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetKey, customFocus]);

  const advancePhase = useCallback(() => {
    setPhase((prev) => {
      if (prev === 'focus') {
        setSessionsDone((n) => n + 1);
        setSecondsLeft(preset.rest * 60);
        return 'rest';
      }
      setSecondsLeft(preset.focus * 60);
      return 'focus';
    });
  }, [preset.focus, preset.rest]);

  // 타이머 인터벌
  const advanceRef = useRef(advancePhase);
  advanceRef.current = advancePhase;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (phaseRef.current === 'focus') setFocusSeconds((f) => f + 1);
        if (s <= 1) {
          advanceRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // 모든 세션 완료 시 자동 종료
  useEffect(() => {
    if (sessionsDone >= TOTAL_SESSIONS) {
      setRunning(false);
      setShowSummary(true);
    }
  }, [sessionsDone]);

  function handleReset() {
    setRunning(false);
    setPhase('focus');
    setSecondsLeft(preset.focus * 60);
  }

  // 원형 진행 링
  const R = 130;
  const CIRC = 2 * Math.PI * R;
  const dashOffset = CIRC * (1 - progress);

  const isRest = phase === 'rest';

  return (
    <SafeAreaView edges={['top', 'bottom']} className="relative flex-1 min-h-0 bg-background">
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
          onPress={() => setShowSummary(true)}
          className="web:cursor-pointer rounded-full px-3 py-1.5"
        >
          <Text className="text-xs font-bold text-muted-foreground">독서 종료</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 min-h-0" contentContainerClassName="px-6 pb-4">
        {/* 대상 책 선택 카드 */}
        <BookSelector book={book} books={books} onChange={setBook} />

        {/* 상태 Pill + 세션 카운터 */}
        <View className="mb-4 mt-6 flex-row items-center justify-center gap-2">
          <View className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-1.5 ${isRest ? 'bg-galpi-green' : 'bg-galpi-blue'}`}>
            {isRest ? <Coffee size={14} color={colors.galpiInk} /> : <BookOpen size={14} color={colors.galpiInk} />}
            <Text className="text-xs font-bold text-galpi-ink">{isRest ? '잠시 휴식 시간' : '독서 몰입 시간'}</Text>
          </View>
          <View className="rounded-full bg-secondary px-3 py-1.5">
            <Text className="font-mono text-xs font-bold tabular-nums text-foreground">
              {Math.min(sessionsDone + (isRest ? 0 : 1), TOTAL_SESSIONS)} / {TOTAL_SESSIONS} 세션
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
            <Text className="font-mono text-6xl font-black tracking-tight tabular-nums text-foreground">
              {fmt(secondsLeft)}
            </Text>
            <Text className="mt-2 text-xs font-medium text-muted-foreground">
              {running ? (isRest ? '휴식하는 중' : '몰입하는 중') : '시작을 기다리는 중'}
            </Text>
          </View>
        </View>

        {/* 프리셋 칩 */}
        <View className="mb-2 mt-4 gap-2">
          {PRESETS.map((p) => {
            const active = presetKey === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => setPresetKey(p.key)}
                disabled={running}
                className={`web:cursor-pointer flex-row items-center justify-between rounded-2xl border px-4 py-3 ${
                  running ? 'opacity-40' : ''
                } ${active ? 'border-galpi-ink bg-galpi-ink' : 'border-border bg-card'}`}
              >
                <Text className={`text-sm font-bold ${active ? 'text-galpi-paper' : 'text-foreground'}`}>{p.label}</Text>
                {p.key === 'custom' && active ? (
                  <CustomStepper value={customFocus} onChange={setCustomFocus} />
                ) : (
                  <ChevronRight size={16} color={active ? colors.galpiPaper : colors.mutedForeground} opacity={active ? 0.7 : 1} />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* 하단 컨트롤 바 */}
      <View className="border-t border-border bg-card/90 px-6 py-4 web:backdrop-blur">
        <View className="mb-3 flex-row items-center gap-3">
          <Pressable
            onPress={handleReset}
            accessibilityLabel="처음부터"
            className="web:cursor-pointer h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary"
            style={({ pressed }) => pressed && { transform: [{ scale: 0.95 }] }}
          >
            <RotateCcw size={20} color={colors.foreground} />
          </Pressable>
          <Pressable
            onPress={() => setRunning((r) => !r)}
            className="web:cursor-pointer h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-galpi-ink"
            style={({ pressed }) => pressed && { transform: [{ scale: 0.98 }] }}
          >
            {running ? <Pause size={18} color={colors.galpiPaper} /> : <Play size={18} color={colors.galpiPaper} />}
            <Text className="text-base font-bold text-galpi-paper">{running ? '일시정지' : '독서 시작'}</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => setCaptured((c) => c + 1)}
          className="web:cursor-pointer w-full flex-row items-center justify-center gap-2 rounded-2xl bg-galpi-yellow py-3.5"
          style={({ pressed }) => pressed && { transform: [{ scale: 0.98 }] }}
        >
          <Plus size={16} color={colors.galpiInk} />
          <Text className="text-sm font-bold text-galpi-ink">이 순간 갈피 남기기</Text>
          {captured > 0 ? (
            <View className="ml-1 rounded-full bg-galpi-ink px-2 py-0.5">
              <Text className="text-[11px] font-bold text-galpi-paper">{captured}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {showSummary ? (
        <SessionSummaryModal
          book={book}
          totalSeconds={focusSeconds}
          sessionsDone={sessionsDone}
          sentencesCaptured={captured}
          onClose={() => setShowSummary(false)}
          onSave={() => {
            setShowSummary(false);
            onBack();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

/* ---------- 대상 책 선택 카드 ---------- */
function BookSelector({
  book,
  books,
  onChange,
}: {
  book: Book;
  books: Book[];
  onChange: (b: Book) => void;
}) {
  const [open, setOpen] = useState(false);
  const readingBooks = books.filter((b) => b.status !== 'wish');

  return (
    <View className="relative mt-2">
      <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <View className={`h-16 w-12 shrink-0 items-center justify-end rounded-lg ${ACCENT_BG_CLASS[book.accent]} p-2`}>
          <Bookmark size={14} color={book.accent === 'ink' ? colors.galpiPaper : colors.galpiInk} />
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
        <Pressable
          onPress={() => setOpen((o) => !o)}
          className="web:cursor-pointer shrink-0 rounded-full bg-secondary px-3 py-1.5"
        >
          <Text className="text-xs font-bold text-foreground">책 변경</Text>
        </Pressable>
      </View>

      {open ? (
        <View
          className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-2xl border border-border bg-card"
          style={{
            shadowColor: colors.galpiInk,
            shadowOpacity: 0.15,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          {readingBooks.map((b, i) => (
            <Pressable
              key={b.id}
              onPress={() => {
                onChange(b);
                setOpen(false);
              }}
              className={`web:cursor-pointer flex-row items-center gap-3 px-3 py-2.5 ${
                i < readingBooks.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <View className={`h-10 w-8 items-center justify-end rounded-md ${ACCENT_BG_CLASS[b.accent]} p-1`}>
                <Bookmark size={12} color={b.accent === 'ink' ? colors.galpiPaper : colors.galpiInk} />
              </View>
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="text-sm font-bold text-foreground">
                  {b.title}
                </Text>
                <Text numberOfLines={1} className="text-xs text-muted-foreground">
                  {b.author}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
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
