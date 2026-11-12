import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../galpi/screen-header';
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
      <ScreenHeader title={title} onBack={onBack} />

      <ScrollView className="flex-1 px-5 pt-2" contentContainerClassName="pb-10">
        <Text className="mb-5 text-xs text-muted-foreground">
          최종 개정일: {LEGAL_EFFECTIVE_DATE}
        </Text>

        <View className="gap-6">
          {sections.map((section) => (
            <View key={section.heading} className="gap-2">
              <Text className="text-sm font-bold text-foreground">{section.heading}</Text>
              {section.paragraphs.map((paragraph, i) => (
                <Text key={i} className="text-sm leading-relaxed text-muted-foreground">
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
