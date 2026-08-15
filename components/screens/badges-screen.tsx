import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { BadgeGrid } from '../galpi/badge-grid';
import { type BadgeProgress } from '../../lib/badges';
import { useThemeColors } from '../../lib/theme';

export function BadgesScreen({ badges, onBack }: { badges: BadgeProgress[]; onBack: () => void }) {
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
        <Text className="text-base font-black text-foreground">독서 업적</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-2" contentContainerClassName="pb-10">
        <BadgeGrid badges={badges} />
      </ScrollView>
    </SafeAreaView>
  );
}
