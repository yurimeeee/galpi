import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flame, Info, X } from 'lucide-react-native';
import { ScreenHeader } from '../galpi/screen-header';
import { TimePickerField } from '../galpi/time-picker-field';
import { useReadingReminder } from '../../lib/use-reading-reminder';
import { useOnThisDayReminder } from '../../lib/use-on-this-day-reminder';
import { useStreakRiskReminder } from '../../lib/use-streak-risk-reminder';
import { useThemeColors } from '../../lib/theme';
import { useAppStore } from '../../lib/store';
import { mostActiveHour } from '../../lib/data/sentences';
import { pad2, formatHourKorean } from '../../lib/date-utils';

export function NotificationSettingsScreen({ onBack }: { onBack: () => void }) {
  const {
    loading,
    enabled,
    time,
    error,
    supported,
    setDailyReminderEnabled,
    setDailyReminderTime,
  } = useReadingReminder();

  const {
    loading: onThisDayLoading,
    enabled: onThisDayEnabled,
    error: onThisDayError,
    match: onThisDayMatch,
    matchBook: onThisDayBook,
    setOnThisDayEnabled,
  } = useOnThisDayReminder();

  const {
    loading: streakRiskLoading,
    enabled: streakRiskEnabled,
    error: streakRiskError,
    currentStreak,
    setStreakRiskReminderEnabled,
  } = useStreakRiskReminder();

  const sentences = useAppStore((s) => s.sentences);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const suggestedHour = useMemo(() => mostActiveHour(sentences), [sentences]);
  const suggestedTime = suggestedHour !== null ? `${pad2(suggestedHour)}:00` : null;
  const showTimeSuggestion = enabled && !suggestionDismissed && suggestedTime !== null && suggestedTime !== time;

  const colors = useThemeColors();

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 min-h-0 bg-background">
      <ScreenHeader title="알림 설정" onBack={onBack} />

      <ScrollView className="flex-1 px-5 pt-4" contentContainerClassName="pb-10">
        {!supported ? (
          <View className="mb-4 flex-row items-start gap-3 rounded-xl border border-border bg-card p-4">
            <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-xl bg-secondary">
              <Info size={16} color={colors.foreground} />
            </View>
            <Text className="flex-1 text-sm leading-relaxed text-muted-foreground">
              독서 알림은 모바일 앱에서만 사용할 수 있어요.
            </Text>
          </View>
        ) : null}

        {loading ? (
          <View className="items-center pt-16">
            <ActivityIndicator color={colors.foreground} />
          </View>
        ) : (
          /* 알림 세 가지를 하나의 그룹으로 — 행 사이는 hairline (DESIGN_TASKS PG-10) */
          <View className="overflow-hidden rounded-xl bg-card">
            <View className="flex-row items-center gap-3 border-b border-border px-4 py-4">
              <View className="min-w-0 flex-1">
                <Text className="text-sm font-bold text-foreground">매일 독서 알림</Text>
                <Text className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  정해진 시간에 오늘의 독서를 알려드려요.
                </Text>
              </View>
              <Pressable
                onPress={() => setDailyReminderEnabled(!enabled)}
                disabled={!supported}
                accessibilityRole="switch"
                accessibilityState={{ checked: enabled }}
                accessibilityLabel="매일 독서 알림"
                className={`web:cursor-pointer relative h-6 w-11 justify-center rounded-full ${
                  enabled ? 'bg-galpi-ink' : 'bg-border'
                } ${!supported ? 'opacity-50' : ''}`}
              >
                <View
                  className="absolute h-5 w-5 rounded-full bg-galpi-paper"
                  style={{ left: enabled ? 22 : 2 }}
                />
              </Pressable>
            </View>

            {enabled ? (
              <View className="gap-2 border-b border-border px-4 py-4">
                <Text className="text-sm font-semibold text-foreground">알림 시간</Text>
                <TimePickerField value={time} onChange={setDailyReminderTime} />

                {showTimeSuggestion ? (
                  <View className="mt-2 flex-row items-center gap-3 rounded-xl bg-secondary p-3">
                    <Text className="flex-1 text-xs leading-relaxed text-foreground">
                      가장 많이 기록한 시간대는 {formatHourKorean(suggestedHour!)}예요. 이 시간으로 바꿔볼까요?
                    </Text>
                    <Pressable
                      onPress={() => {
                        setDailyReminderTime(suggestedTime!);
                        setSuggestionDismissed(true);
                      }}
                      accessibilityRole="button"
                      hitSlop={8}
                      className="web:cursor-pointer"
                    >
                      <Text className="text-xs font-black text-foreground">적용</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSuggestionDismissed(true)}
                      accessibilityRole="button"
                      accessibilityLabel="추천 닫기"
                      hitSlop={8}
                      className="web:cursor-pointer"
                    >
                      <X size={14} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}

            {streakRiskLoading ? (
              <View className="items-center border-b border-border py-4">
                <ActivityIndicator color={colors.foreground} />
              </View>
            ) : (
              <View className="flex-row items-center gap-3 border-b border-border px-4 py-4">
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-bold text-foreground">스트릭 위험 알림</Text>
                  <Text className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    오늘 기록이 없고 스트릭이 있을 때만, 밤 10시에 알려드려요.
                  </Text>
                </View>
                <Pressable
                  onPress={() => setStreakRiskReminderEnabled(!streakRiskEnabled)}
                  disabled={!supported}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: streakRiskEnabled }}
                  accessibilityLabel="스트릭 위험 알림"
                  className={`web:cursor-pointer relative h-6 w-11 justify-center rounded-full ${
                    streakRiskEnabled ? 'bg-galpi-ink' : 'bg-border'
                  } ${!supported ? 'opacity-50' : ''}`}
                >
                  <View
                    className="absolute h-5 w-5 rounded-full bg-galpi-paper"
                    style={{ left: streakRiskEnabled ? 22 : 2 }}
                  />
                </Pressable>
              </View>
            )}

            {onThisDayLoading ? (
              <View className="items-center py-4">
                <ActivityIndicator color={colors.foreground} />
              </View>
            ) : (
              <View className="flex-row items-center gap-3 px-4 py-4">
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-bold text-foreground">1년 전 오늘의 갈피</Text>
                  <Text className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    1년 전 오늘 남긴 갈피를 저녁 8시에 다시 보여드려요.
                  </Text>
                </View>
                <Pressable
                  onPress={() => setOnThisDayEnabled(!onThisDayEnabled)}
                  disabled={!supported}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: onThisDayEnabled }}
                  accessibilityLabel="1년 전 오늘의 갈피"
                  className={`web:cursor-pointer relative h-6 w-11 justify-center rounded-full ${
                    onThisDayEnabled ? 'bg-galpi-ink' : 'bg-border'
                  } ${!supported ? 'opacity-50' : ''}`}
                >
                  <View
                    className="absolute h-5 w-5 rounded-full bg-galpi-paper"
                    style={{ left: onThisDayEnabled ? 22 : 2 }}
                  />
                </Pressable>
              </View>
            )}
          </View>
        )}

        {error || streakRiskError || onThisDayError ? (
          <View className="mt-3 gap-1">
            {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
            {streakRiskError ? <Text className="text-xs text-destructive">{streakRiskError}</Text> : null}
            {onThisDayError ? <Text className="text-xs text-destructive">{onThisDayError}</Text> : null}
          </View>
        ) : null}

        {/* 알림 미리보기 */}
        <View className="mt-6 gap-2 rounded-xl bg-galpi-yellow p-4">
          <Text className="text-xs font-bold text-galpi-ink/70">알림 미리보기</Text>
          <Text className="text-md font-black text-galpi-ink">
            📚 오늘 독서 목표를 달성해 보세요!
          </Text>
          <Text className="text-sm leading-relaxed text-galpi-ink/80">
            잠시 책장을 넘기며 나만의 갈피를 남겨볼까요?
          </Text>
        </View>

        {streakRiskEnabled && currentStreak > 0 ? (
          <View className="mt-4 flex-row items-center gap-2 rounded-xl bg-secondary p-4">
            <Flame size={16} color={colors.foreground} />
            <Text className="text-sm font-semibold text-foreground">지금 스트릭: {currentStreak}일</Text>
          </View>
        ) : null}

        {onThisDayEnabled ? (
          <View className="mt-4 gap-2 rounded-xl bg-secondary p-4">
            <Text className="text-xs font-bold text-muted-foreground">오늘의 미리보기</Text>
            {onThisDayMatch ? (
              <>
                <Text className="text-md font-bold leading-relaxed text-foreground">
                  "{onThisDayMatch.quote}"
                </Text>
                {onThisDayBook ? (
                  <Text className="text-xs text-muted-foreground">
                    『{onThisDayBook.title}』 · P.{onThisDayMatch.page}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text className="text-sm leading-relaxed text-muted-foreground">
                1년 전 오늘 남긴 갈피가 아직 없어요.
              </Text>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
