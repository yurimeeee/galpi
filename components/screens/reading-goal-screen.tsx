import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Flame,
  Pencil,
  Clock,
  BookOpen,
  Target,
  Check,
  Lock,
  Award,
  Medal,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { GoalEditModal } from '../galpi/goal-edit-modal';
import { dateKey } from '../../lib/date-utils';
import { useReadingGoals } from '../../lib/use-reading-goals';
import { colors, ACCENT_BG_CLASS, type Accent } from '../../lib/theme';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

type Milestone = {
  key: string;
  Icon: LucideIcon;
  title: string;
  desc: string;
  threshold: number;
  accent: Accent;
};

const MILESTONES: Milestone[] = [
  { key: 'first', Icon: Zap, title: '첫 불꽃', desc: '3일 연속 독서', threshold: 3, accent: 'yellow' },
  { key: 'week', Icon: Flame, title: '일주일 챌린지', desc: '7일 연속 독서', threshold: 7, accent: 'green' },
  { key: 'twoweek', Icon: Award, title: '보름의 몰입', desc: '14일 연속 독서', threshold: 14, accent: 'blue' },
  { key: 'month', Icon: Medal, title: '한 달의 습관', desc: '30일 연속 독서', threshold: 30, accent: 'blue' },
];

function buildWeek(activeDays: Set<string>) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  return WEEKDAY_LABELS.map((label, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return { day: label, done: activeDays.has(dateKey(d)), isToday: dateKey(d) === dateKey(today) };
  });
}

function buildMonthCells(year: number, month: number, activeDays: Set<string>) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: ({ day: number; done: boolean } | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return { day, done: activeDays.has(dateKey(new Date(year, month, day))) };
    }),
  ];
  return cells;
}

export function ReadingGoalScreen({ onBack }: { onBack: () => void }) {
  const {
    loading,
    goals,
    saveGoals,
    activeDays,
    currentStreak,
    bestStreak,
    todayMinutes,
    monthDone,
    yearDone,
    year,
    month,
  } = useReadingGoals();
  const [editOpen, setEditOpen] = useState(false);

  const week = buildWeek(activeDays);
  const monthCells = buildMonthCells(year, month, activeDays);

  return (
    <SafeAreaView edges={['top']} className="relative flex-1 min-h-0 bg-background">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-2">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={onBack}
            accessibilityLabel="뒤로 가기"
            className="web:cursor-pointer h-9 w-9 items-center justify-center rounded-full bg-card"
          >
            <ChevronLeft size={20} color={colors.foreground} />
          </Pressable>
          <View>
            <Text className="text-[18px] font-black tracking-tight text-foreground">독서 목표</Text>
            <Text className="text-[12px] text-muted-foreground">꾸준함이 쌓여 습관이 됩니다</Text>
          </View>
        </View>
        <Pressable
          onPress={() => setEditOpen(true)}
          className="web:cursor-pointer flex-row items-center gap-1.5 rounded-full bg-secondary px-3.5 py-2"
        >
          <Pencil size={14} color={colors.foreground} />
          <Text className="text-[12px] font-bold text-foreground">목표 수정</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.foreground} />
        </View>
      ) : (
        <ScrollView className="flex-1 min-h-0" contentContainerClassName="px-5 pb-10 pt-3">
          {/* 스트릭 히어로 */}
          <View className="overflow-hidden rounded-3xl bg-galpi-yellow p-6">
            <View className="flex-row items-center justify-between">
              <View>
                <View className="flex-row items-center gap-2">
                  <Flame size={18} color={colors.galpiInk} strokeWidth={2.2} />
                  <Text className="text-[13px] font-bold text-galpi-ink/70">연속 독서</Text>
                </View>
                <View className="mt-2 flex-row items-end gap-1.5">
                  <Text className="text-[52px] font-black leading-none tracking-tight text-galpi-ink">
                    {currentStreak}
                  </Text>
                  <Text className="pb-1.5 text-lg font-bold text-galpi-ink">일째</Text>
                </View>
                <Text className="mt-2 text-[13px] font-medium text-galpi-ink/70">
                  최고 기록 {bestStreak}일 · 오늘도 이어가 볼까요?
                </Text>
              </View>
              <View className="h-20 w-20 shrink-0 items-center justify-center rounded-full bg-galpi-ink/10">
                <Flame size={44} color={colors.galpiInk} strokeWidth={1.8} />
              </View>
            </View>

            {/* 이번 주 요일 스트립 */}
            <View className="mt-6 flex-row items-center justify-between gap-1.5">
              {week.map((d) => (
                <View key={d.day} className="flex-1 items-center gap-1.5">
                  <Text
                    className={`text-[11px] font-bold ${d.isToday ? 'text-galpi-ink' : 'text-galpi-ink/50'}`}
                  >
                    {d.day}
                  </Text>
                  <View
                    className={`h-8 w-8 items-center justify-center rounded-full ${
                      d.done
                        ? 'bg-galpi-ink'
                        : d.isToday
                          ? 'border-2 border-dashed border-galpi-ink/50'
                          : 'bg-galpi-ink/10'
                    }`}
                  >
                    {d.done ? (
                      <Check size={16} color={colors.galpiPaper} strokeWidth={3} />
                    ) : (
                      <Flame size={14} color={colors.galpiInk} opacity={d.isToday ? 0.4 : 0.3} />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 목표 진행 */}
          <View className="mt-6">
            <Text className="mb-3 pl-1 text-[15px] font-black text-foreground">나의 목표 진행</Text>
            <View className="gap-3">
              <GoalProgress
                Icon={Clock}
                accent="blue"
                label="오늘의 독서"
                current={todayMinutes}
                target={goals.dailyMinutes}
                unit="분"
              />
              <GoalProgress
                Icon={BookOpen}
                accent="green"
                label="이번 달 완독"
                current={monthDone}
                target={goals.monthlyBooks}
                unit="권"
              />
              <GoalProgress
                Icon={Target}
                accent="yellow"
                label="올해 목표"
                current={yearDone}
                target={goals.yearlyBooks}
                unit="권"
              />
            </View>
          </View>

          {/* 이번 달 스트릭 달력 */}
          <View className="mt-6 rounded-3xl border border-border bg-card p-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[15px] font-black text-foreground">
                {year}년 {month + 1}월 기록
              </Text>
              <View className="flex-row items-center gap-1">
                <View className="h-2.5 w-2.5 rounded-[3px] bg-galpi-green" />
                <Text className="text-[11px] text-muted-foreground">읽은 날</Text>
              </View>
            </View>
            <View className="flex-row flex-wrap">
              {WEEKDAY_LABELS.map((d) => (
                <Text key={d} className="w-[14.28%] pb-1 text-center text-[10px] font-bold text-muted-foreground">
                  {d}
                </Text>
              ))}
              {monthCells.map((cell, i) =>
                cell === null ? (
                  <View key={`pad-${i}`} className="aspect-square w-[14.28%]" />
                ) : (
                  <View key={cell.day} className="aspect-square w-[14.28%] p-[3px]">
                    <View
                      className={`flex-1 items-center justify-center rounded-lg ${
                        cell.done ? 'bg-galpi-green' : ''
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          cell.done ? 'text-galpi-ink' : 'text-muted-foreground/50'
                        }`}
                      >
                        {cell.day}
                      </Text>
                    </View>
                  </View>
                ),
              )}
            </View>
          </View>

          {/* 마일스톤 배지 */}
          <View className="mt-6">
            <Text className="mb-3 pl-1 text-[15px] font-black text-foreground">스트릭 배지</Text>
            <View className="flex-row flex-wrap gap-3">
              {MILESTONES.map((m) => {
                const unlocked = bestStreak >= m.threshold;
                return (
                  <View
                    key={m.key}
                    className={`w-[48%] items-center gap-2 rounded-2xl border p-4 ${
                      unlocked ? 'border-transparent ' + ACCENT_BG_CLASS[m.accent] : 'border-border bg-secondary'
                    }`}
                  >
                    <View
                      className={`h-12 w-12 items-center justify-center rounded-full ${
                        unlocked ? 'bg-galpi-ink/10' : 'bg-card'
                      }`}
                    >
                      {unlocked ? (
                        <m.Icon size={24} color={colors.galpiInk} strokeWidth={1.9} />
                      ) : (
                        <Lock size={20} color={colors.mutedForeground} strokeWidth={1.9} />
                      )}
                    </View>
                    <View className="items-center">
                      <Text
                        className={`text-[13px] font-black ${unlocked ? 'text-galpi-ink' : 'text-muted-foreground'}`}
                      >
                        {m.title}
                      </Text>
                      <Text
                        className={`mt-0.5 text-[11px] ${
                          unlocked ? 'text-galpi-ink/60' : 'text-muted-foreground/70'
                        }`}
                      >
                        {m.desc}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}

      {editOpen ? (
        <GoalEditModal
          goals={goals}
          onClose={() => setEditOpen(false)}
          onSave={async (next) => {
            await saveGoals(next);
            setEditOpen(false);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function GoalProgress({
  Icon,
  accent,
  label,
  current,
  target,
  unit,
}: {
  Icon: LucideIcon;
  accent: Accent;
  label: string;
  current: number;
  target: number;
  unit: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const complete = current >= target;

  return (
    <View className="rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-3">
        <View className={`h-10 w-10 items-center justify-center rounded-xl ${ACCENT_BG_CLASS[accent]}`}>
          <Icon size={20} color={colors.galpiInk} strokeWidth={1.9} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-[14px] font-bold text-foreground">{label}</Text>
          <Text className="text-[12px] text-muted-foreground">
            <Text className="font-bold text-foreground tabular-nums">
              {current}
              {unit}
            </Text>{' '}
            / {target}
            {unit}
          </Text>
        </View>
        <Text className={`text-[15px] font-black tabular-nums ${complete ? 'text-galpi-ink' : 'text-muted-foreground'}`}>
          {pct}%
        </Text>
      </View>
      <View className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
        <View
          className={`h-full rounded-full ${complete ? 'bg-galpi-ink' : 'bg-galpi-ink/70'}`}
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}
