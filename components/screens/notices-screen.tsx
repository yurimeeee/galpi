import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Megaphone } from 'lucide-react-native';
import { useThemeColors } from '../../lib/theme';
import { NOTICES } from '../../lib/notices';

export function NoticesScreen({ onBack }: { onBack: () => void }) {
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
        <Text className="text-base font-black text-foreground">공지사항</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-2" contentContainerClassName="pb-10">
        {NOTICES.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-sm text-muted-foreground">아직 공지사항이 없어요.</Text>
          </View>
        ) : (
          <View className="gap-3">
            {NOTICES.map((notice) => (
              <View key={notice.id} className="gap-2 rounded-2xl border border-border bg-card p-4">
                <View className="flex-row items-center gap-2">
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-secondary">
                    <Megaphone size={14} color={colors.foreground} strokeWidth={1.8} />
                  </View>
                  <Text className="flex-1 text-sm font-bold text-foreground">{notice.title}</Text>
                </View>
                <Text className="text-[11px] font-medium text-muted-foreground">{notice.date}</Text>
                <Text className="text-[13px] leading-relaxed text-muted-foreground">{notice.body}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
