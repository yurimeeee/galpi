import { Pressable, Text, View } from 'react-native';
import { Flame } from '../../lib/icons';
import { useThemeColors } from '../../lib/theme';
import { useEffectiveScheme } from '../../lib/use-effective-scheme';

/**
 * Habit nudge pinned atop the library tab — one tappable strip with the
 * streak, today's minutes against the goal, and a "읽기 시작" pill that
 * opens the timer. Kept to a single line so the shelf stays above the
 * fold (DESIGN_TASKS PG-01). Fixed ink/paper/yellow so it reads as the
 * same brand mark in both themes; a hairline keeps it visible on the
 * dark background.
 */
export function TodayProgressCard({
  currentStreak,
  todayMinutes,
  dailyGoalMinutes,
  onStartTimer,
}: {
  currentStreak: number;
  todayMinutes: number;
  dailyGoalMinutes: number;
  onStartTimer: () => void;
}) {
  const colors = useThemeColors();
  const scheme = useEffectiveScheme();
  const goalMet = dailyGoalMinutes > 0 && todayMinutes >= dailyGoalMinutes;
  const streakLabel = currentStreak > 0 ? `${currentStreak}일 연속 기록 중` : '오늘부터 스트릭 시작';
  const todayLabel = goalMet
    ? '오늘 목표 달성'
    : dailyGoalMinutes > 0
      ? `오늘 ${todayMinutes}분 / ${dailyGoalMinutes}분`
      : `오늘 ${todayMinutes}분`;

  return (
    <Pressable
      onPress={onStartTimer}
      accessibilityRole="button"
      accessibilityLabel={`독서 타이머 시작. ${streakLabel}, ${todayLabel}`}
      className={`mb-3 flex-row items-center gap-2.5 rounded-full bg-galpi-ink py-2 pl-4 pr-2 ${
        scheme === 'dark' ? 'border border-galpi-paper/20' : ''
      }`}
      style={({ pressed }) => pressed && { opacity: 0.85 }}
    >
      <Flame size={16} color={colors.galpiYellow} strokeWidth={2} />
      <View className="min-w-0 flex-1 flex-row items-baseline gap-2">
        <Text numberOfLines={1} className="shrink text-sm font-bold text-galpi-paper">
          {streakLabel}
        </Text>
        <Text numberOfLines={1} className="shrink text-xs font-medium text-galpi-paper/60">
          {todayLabel}
        </Text>
      </View>
      <View className="shrink-0 rounded-full bg-galpi-yellow px-3 py-1.5">
        <Text className="text-xs font-black text-galpi-ink">읽기 시작</Text>
      </View>
    </Pressable>
  );
}
