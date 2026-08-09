import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '../../lib/theme';
import { LEGAL_EFFECTIVE_DATE, type LegalSection } from '../../lib/legal-content';

export function LegalScreen({
  title,
  sections,
  onBack,
}: {
  title: string;
  sections: LegalSection[];
  onBack: () => void;
}) {
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
        <Text className="text-base font-black text-foreground">{title}</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-2" contentContainerClassName="pb-10">
        <Text className="mb-5 text-[12px] text-muted-foreground">
          최종 개정일: {LEGAL_EFFECTIVE_DATE}
        </Text>

        <View className="gap-6">
          {sections.map((section) => (
            <View key={section.heading} className="gap-2">
              <Text className="text-[14px] font-bold text-foreground">{section.heading}</Text>
              {section.paragraphs.map((paragraph, i) => (
                <Text key={i} className="text-[13px] leading-relaxed text-muted-foreground">
                  {paragraph}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
