import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../galpi/screen-header';
import { BadgeGrid } from '../galpi/badge-grid';
import { type BadgeProgress } from '../../lib/badges';

export function BadgesScreen({ badges, onBack }: { badges: BadgeProgress[]; onBack: () => void }) {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 min-h-0 bg-background">
      <ScreenHeader title="독서 업적" onBack={onBack} />

      <ScrollView className="flex-1 px-5 pt-2" contentContainerClassName="pb-10">
        <BadgeGrid badges={badges} />
      </ScrollView>
    </SafeAreaView>
  );
}
