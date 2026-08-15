import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Info } from 'lucide-react-native';
import { TimePickerField } from '../galpi/time-picker-field';
import { useReadingReminder } from '../../lib/use-reading-reminder';
import { useOnThisDayReminder } from '../../lib/use-on-this-day-reminder';
import { useThemeColors } from '../../lib/theme';

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
  const colors = useThemeColors();

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 min-h-0 bg-background">
      <View className="flex-row items-center gap-3 px-5 pb-3 pt-2">
        <Pressable
          onPress={onBack}
          accessibilityLabel="뒤로 가기"
          className="web:cursor-pointer h-9 w-9 items-center justify-center rounded-full bg-card"
        >
          <ChevronLeft size={20} color={colors.foreground} />
        </Pressable>
        <Text className="text-base font-black text-foreground">알림 설정</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" contentContainerClassName="pb-10">
        {!supported ? (
          <View className="mb-4 flex-row items-start gap-3 rounded-2xl border border-border bg-card p-4">
            <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-xl bg-secondary">
              <Info size={16} color={colors.foreground} />
            </View>
            <Text className="flex-1 text-[13px] leading-relaxed text-muted-foreground">
              독서 알림은 모바일 앱에서만 사용할 수 있어요.
            </Text>
          </View>
        ) : null}

        {loading ? (
          <View className="items-center pt-16">
            <ActivityIndicator color={colors.foreground} />
          </View>
        ) : (
          <View className="overflow-hidden rounded-2xl border border-border bg-card">
            <View
              className={`flex-row items-center gap-3 px-4 py-4 ${enabled ? 'border-b border-border' : ''}`}
            >
              <View className="min-w-0 flex-1">
                <Text className="text-[14px] font-bold text-foreground">매일 독서 알림</Text>
                <Text className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
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
              <View className="gap-2 px-4 py-4">
                <Text className="text-[13px] font-semibold text-foreground">알림 시간</Text>
                <TimePickerField value={time} onChange={setDailyReminderTime} />
              </View>
            ) : null}
          </View>
        )}

        {error ? (
          <Text className="mt-3 text-[12px] text-destructive">{error}</Text>
        ) : null}

        {/* 알림 미리보기 */}
        <View className="mt-6 gap-2 rounded-2xl bg-galpi-yellow p-4">
          <Text className="text-[12px] font-bold text-galpi-ink/70">알림 미리보기</Text>
          <Text className="text-[15px] font-black text-galpi-ink">
            📚 오늘 독서 목표를 달성해 보세요!
          </Text>
          <Text className="text-[13px] leading-relaxed text-galpi-ink/80">
            잠시 책장을 넘기며 나만의 갈피를 남겨볼까요?
          </Text>
        </View>

        {onThisDayLoading ? (
          <View className="mt-6 items-center pt-4">
            <ActivityIndicator color={colors.foreground} />
          </View>
        ) : (
          <View className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
            <View className="flex-row items-center gap-3 px-4 py-4">
              <View className="min-w-0 flex-1">
                <Text className="text-[14px] font-bold text-foreground">1년 전 오늘의 갈피</Text>
                <Text className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
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
          </View>
        )}

        {onThisDayError ? (
          <Text className="mt-3 text-[12px] text-destructive">{onThisDayError}</Text>
        ) : null}

        {onThisDayEnabled ? (
          <View className="mt-4 gap-2 rounded-2xl bg-secondary p-4">
            <Text className="text-[12px] font-bold text-muted-foreground">오늘의 미리보기</Text>
            {onThisDayMatch ? (
              <>
                <Text className="text-[15px] font-bold leading-relaxed text-foreground">
                  "{onThisDayMatch.quote}"
                </Text>
                {onThisDayBook ? (
                  <Text className="text-[12px] text-muted-foreground">
                    『{onThisDayBook.title}』 · P.{onThisDayMatch.page}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text className="text-[13px] leading-relaxed text-muted-foreground">
                1년 전 오늘 남긴 갈피가 아직 없어요.
              </Text>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
