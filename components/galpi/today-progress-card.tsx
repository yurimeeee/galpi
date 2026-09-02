import { Pressable, Text, View } from 'react-native';
import { Flame } from 'lucide-react-native';
import { useThemeColors } from '../../lib/theme';

/**
 * Habit nudge pinned atop the library tab — the closest thing to a home-
 * screen widget this managed-Expo app can offer without a native extension.
 * Surfaces today's goal progress and streak every time the app is opened.
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
  const progressPct = dailyGoalMinutes > 0 ? Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100)) : 0;
  const goalMet = dailyGoalMinutes > 0 && todayMinutes >= dailyGoalMinutes;

  return (
    <View className="mb-7 overflow-hidden rounded-3xl bg-galpi-ink p-5">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Flame size={16} color={colors.galpiYellow} strokeWidth={2} />
          <Text className="text-[13px] font-bold text-galpi-paper">
            {currentStreak > 0 ? `${currentStreak}일 연속 기록 중` : '오늘부터 스트릭을 시작해 보세요'}
          </Text>
        </View>
      </View>

      <Text className="mt-3 text-[15px] font-black leading-snug text-galpi-paper">
        {goalMet ? '오늘 목표를 달성했어요' : `오늘 ${todayMinutes}분 읽었어요`}
      </Text>

      {dailyGoalMinutes > 0 ? (
        <View className="mt-3">
          <View className="mb-1.5 flex-row items-center justify-between">
            <Text className="text-[11px] font-semibold text-galpi-paper/60">
              목표 {dailyGoalMinutes}분
            </Text>
            <Text className="text-[11px] font-semibold text-galpi-paper/60">{progressPct}%</Text>
          </View>
          <View className="h-1.5 w-full overflow-hidden rounded-full bg-galpi-paper/15">
            <View className="h-full rounded-full bg-galpi-yellow" style={{ width: `${progressPct}%` }} />
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={onStartTimer}
        className="web:cursor-pointer mt-4 items-center rounded-full bg-galpi-yellow py-3"
        style={({ pressed }) => pressed && { opacity: 0.85 }}
      >
        <Text className="text-[13px] font-black text-galpi-ink">지금 읽기 시작</Text>
      </Pressable>
    </View>
  );
}
