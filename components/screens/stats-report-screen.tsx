import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BookCheck,
  Bookmark,
  Clock,
  Share2,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Grid2x2,
  CalendarDays,
  Quote,
  type LucideIcon,
} from 'lucide-react-native';
import { colors, type Accent, ACCENT_BG_CLASS } from '../../lib/theme';

type Period = 'month' | 'year';
type MonthView = 'date' | 'cover';

/* ---------- 목업 데이터 ---------- */
const READ_DAYS: Record<number, Accent> = {
  2: 'blue', 3: 'blue', 5: 'yellow', 8: 'yellow', 9: 'green', 12: 'green',
  15: 'ink', 16: 'ink', 17: 'blue', 20: 'yellow', 23: 'green', 24: 'green',
  27: 'ink', 30: 'blue', 31: 'blue',
};

type DoneBook = { title: string; author: string; rating: number; accent: Accent };
const MONTH_DONE: DoneBook[] = [
  { title: '모순', author: '양귀자', rating: 5, accent: 'green' },
  { title: '아몬드', author: '손원평', rating: 4, accent: 'ink' },
  { title: '달러구트 꿈 백화점', author: '이미예', rating: 4, accent: 'blue' },
  { title: '불편한 편의점', author: '김호연', rating: 3.5, accent: 'yellow' },
];

const YEAR_METRICS = { done: '38', galpi: '612', hours: '260' };

function makeHeatmap(weeks: number, seed: number): number[][] {
  const grid: number[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: number[] = [];
    for (let d = 0; d < 7; d++) {
      const v = (Math.sin((w * 7 + d) * seed) + 1) / 2;
      col.push(Math.round(v * 4));
    }
    grid.push(col);
  }
  return grid;
}

const INTENSITY_CLASS = ['bg-secondary', 'bg-galpi-green/50', 'bg-galpi-green', 'bg-galpi-blue', 'bg-galpi-ink'];

export function StatsReportScreen() {
  const [period, setPeriod] = useState<Period>('month');
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <SafeAreaView edges={['top']} className="relative flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 pb-2 pt-1">
        <Text className="text-xl font-black tracking-tight text-foreground">독서 통계</Text>
        <Pressable
          onPress={() => setShareOpen(true)}
          accessibilityLabel="리포트 공유"
          className="web:cursor-pointer h-9 w-9 items-center justify-center rounded-full bg-galpi-ink"
        >
          <Share2 size={16} color={colors.galpiPaper} />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerClassName="pb-6">
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

        {period === 'month' ? <MonthlyView /> : <YearlyView />}
      </ScrollView>

      {shareOpen ? <ShareModal onClose={() => setShareOpen(false)} /> : null}
    </SafeAreaView>
  );
}

/* ---------- 월간 뷰 ---------- */
function MonthlyView() {
  const [view, setView] = useState<MonthView>('date');

  const firstWeekday = new Date(2026, 7, 1).getDay();
  const daysInMonth = 31;
  const readCount = Object.keys(READ_DAYS).length;

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <>
      {/* 월 네비게이터 */}
      <View className="mt-6 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Pressable accessibilityLabel="이전 달" className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <ChevronLeft size={16} color={colors.foreground} />
          </Pressable>
          <View>
            <Text className="text-base font-black text-foreground">2026년 8월</Text>
            <Text className="text-[11px] font-medium text-muted-foreground">읽은 날 · {readCount}일</Text>
          </View>
          <Pressable accessibilityLabel="다음 달" className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-secondary">
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
          {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
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
            const accent = READ_DAYS[day];
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

      {/* 이달 완독 목록 */}
      <View className="mt-6">
        <View className="mb-3 flex-row items-baseline justify-between">
          <Text className="text-base font-black tracking-tight text-foreground">이달 완독한 책</Text>
          <Text className="text-xs font-medium text-muted-foreground">{MONTH_DONE.length}권</Text>
        </View>
        <View className="gap-2.5">
          {MONTH_DONE.map((b) => (
            <View key={b.title} className="flex-row items-center gap-3 rounded-2xl bg-card p-3">
              <View className={`h-12 w-9 shrink-0 items-center justify-center rounded-md ${ACCENT_BG_CLASS[b.accent]}`}>
                <Bookmark size={14} color={b.accent === 'ink' ? colors.galpiPaper : colors.galpiInk} />
              </View>
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="text-sm font-bold text-foreground">{b.title}</Text>
                <Text numberOfLines={1} className="text-xs text-muted-foreground">{b.author}</Text>
              </View>
              <StarRating value={b.rating} />
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <View className="shrink-0 flex-row items-center gap-1">
      <View className="flex-row items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} className={`h-1.5 w-1.5 rounded-full ${i < Math.round(value) ? 'bg-galpi-ink' : 'bg-border'}`} />
        ))}
      </View>
      <Text className="ml-0.5 font-mono text-[11px] font-bold text-foreground">{value.toFixed(1)}</Text>
    </View>
  );
}

/* ---------- 연간 뷰 ---------- */
function YearlyView() {
  const grid = useMemo(() => makeHeatmap(26, 1.3), []);

  return (
    <>
      {/* 연 네비게이터 */}
      <View className="mt-6 flex-row items-center gap-3">
        <Pressable accessibilityLabel="이전 해" className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-secondary">
          <ChevronLeft size={16} color={colors.foreground} />
        </Pressable>
        <Text className="text-base font-black text-foreground">2026년</Text>
        <Pressable accessibilityLabel="다음 해" className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-secondary">
          <ChevronRight size={16} color={colors.foreground} />
        </Pressable>
      </View>

      {/* 핵심 지표 카드 */}
      <View className="mt-5 flex-row gap-3">
        <MetricCard Icon={BookCheck} value={YEAR_METRICS.done} unit="권" label="완독한 책" toneClass="bg-galpi-green" />
        <MetricCard Icon={Bookmark} value={YEAR_METRICS.galpi} unit="개" label="남긴 갈피" toneClass="bg-galpi-yellow" />
        <MetricCard Icon={Clock} value={YEAR_METRICS.hours} unit="시간" label="총 독서 시간" toneClass="bg-galpi-blue" />
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
                <View key={d} className={`h-3 w-3 rounded-[3px] ${INTENSITY_CLASS[v]}`} />
              ))}
            </View>
          ))}
        </ScrollView>

        <Text className="mt-4 text-xs leading-relaxed text-muted-foreground">
          올 한 해, 꾸준히 책장을 넘겼어요. 가장 활발했던 계절은{' '}
          <Text className="font-bold text-foreground">겨울</Text>이에요.
        </Text>
      </View>

      {/* 올해의 문장 */}
      <View className="mt-5 rounded-3xl bg-galpi-ink p-5">
        <View className="flex-row items-center gap-1.5">
          <Quote size={12} color={colors.galpiPaper} opacity={0.6} />
          <Text className="text-[11px] font-bold text-galpi-paper/60">가장 많이 꺼내본 갈피</Text>
        </View>
        <Text className="mt-3 text-base font-bold leading-relaxed text-galpi-paper">
          “가장 평범한 하루가 누군가에게는 간절히 되찾고 싶은 어제였다.”
        </Text>
        <Text className="mt-3 text-xs text-galpi-paper/50">달러구트 꿈 백화점 · P.201</Text>
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

/* ---------- 공유 카드 미리보기 모달 ---------- */
type Ratio = '1:1' | '9:16';

function ShareModal({ onClose }: { onClose: () => void }) {
  const [ratio, setRatio] = useState<Ratio>('1:1');

  return (
    <View className="absolute inset-0 z-20 justify-end bg-galpi-ink/50 web:backdrop-blur-sm">
      <Pressable className="web:cursor-pointer flex-1" accessibilityLabel="닫기" onPress={onClose} />

      <View className="rounded-t-3xl bg-background px-5 pb-6 pt-4">
        <View className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />

        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-base font-black text-foreground">리포트 공유하기</Text>
          <Pressable
            onPress={onClose}
            accessibilityLabel="닫기"
            className="web:cursor-pointer h-8 w-8 items-center justify-center rounded-full bg-secondary"
          >
            <X size={16} color={colors.foreground} />
          </Pressable>
        </View>

        {/* 비율 선택 */}
        <View className="mb-4 flex-row gap-2">
          {([
            { key: '1:1' as Ratio, label: '1:1 인스타그램 피드' },
            { key: '9:16' as Ratio, label: '9:16 스토리' },
          ]).map(({ key, label }) => {
            const active = ratio === key;
            return (
              <Pressable
                key={key}
                onPress={() => setRatio(key)}
                className={`web:cursor-pointer flex-1 rounded-xl border py-2.5 ${
                  active ? 'border-galpi-ink bg-galpi-ink' : 'border-border bg-card'
                }`}
              >
                <Text className={`text-center text-xs font-bold ${active ? 'text-galpi-paper' : 'text-muted-foreground'}`}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 공유 카드 미리보기 */}
        <View className="items-center rounded-2xl bg-secondary p-4">
          <View
            className="justify-between overflow-hidden rounded-2xl bg-galpi-blue p-5"
            style={ratio === '1:1' ? { width: 208, height: 208 } : { width: 160, height: 284 }}
          >
            <View>
              <Text className="text-[11px] font-black text-galpi-ink/60">갈피 · 나의 독서 기록</Text>
              <Text className="mt-2 text-sm font-black leading-tight text-galpi-ink">
                2026년, 이렇게 읽었어요
              </Text>
            </View>
            <View className="gap-1.5">
              <ShareStat label="완독" value={`${YEAR_METRICS.done}권`} />
              <ShareStat label="갈피" value={`${YEAR_METRICS.galpi}개`} />
              <ShareStat label="독서" value={`${YEAR_METRICS.hours}시간`} />
            </View>
          </View>
        </View>

        {/* 액션 버튼 */}
        <View className="mt-5 flex-row gap-3">
          <Pressable className="web:cursor-pointer flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5">
            <Download size={16} color={colors.foreground} />
            <Text className="text-sm font-bold text-foreground">이미지 저장</Text>
          </Pressable>
          <Pressable className="web:cursor-pointer flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-galpi-ink py-3.5">
            <Share2 size={16} color={colors.galpiPaper} />
            <Text className="text-sm font-bold text-galpi-paper">공유하기</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ShareStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between rounded-lg bg-galpi-paper/60 px-2.5 py-1.5">
      <Text className="text-[11px] font-medium text-galpi-ink/70">{label}</Text>
      <Text className="text-xs font-black text-galpi-ink">{value}</Text>
    </View>
  );
}
