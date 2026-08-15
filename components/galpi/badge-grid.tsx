import { Alert, Pressable, Text, View } from 'react-native';
import { BookCheck, Bookmark, Flame, Lock, type LucideIcon } from 'lucide-react-native';
import { type Badge, type BadgeCategory, type BadgeProgress } from '../../lib/badges';
import { useThemeColors } from '../../lib/theme';

const CATEGORY_ICON: Record<BadgeCategory, LucideIcon> = {
  books: BookCheck,
  galpi: Bookmark,
  streak: Flame,
};

const CATEGORY_TONE: Record<BadgeCategory, string> = {
  books: 'bg-galpi-green',
  galpi: 'bg-galpi-yellow',
  streak: 'bg-galpi-blue',
};

const CATEGORY_LABEL: Record<BadgeCategory, string> = {
  books: '완독',
  galpi: '갈피 수집',
  streak: '연속 기록',
};

const CATEGORIES: BadgeCategory[] = ['books', 'galpi', 'streak'];

/** Achievement badges earned from real library activity — grouped by category, tap a locked one to see its target. */
export function BadgeGrid({ badges }: { badges: BadgeProgress[] }) {
  const achievedCount = badges.filter((b) => b.achieved).length;

  return (
    <View className="gap-6">
      <Text className="text-xs font-medium text-muted-foreground">
        {achievedCount}/{badges.length}개 달성
      </Text>
      {CATEGORIES.map((category) => {
        const items = badges.filter((b) => b.category === category);
        if (items.length === 0) return null;
        return (
          <View key={category}>
            <Text className="mb-2.5 pl-1 text-[13px] font-bold text-muted-foreground">
              {CATEGORY_LABEL[category]}
            </Text>
            <View className="flex-row flex-wrap">
              {items.map((badge) => (
                <View key={badge.id} style={{ width: '25%' }} className="p-[5px]">
                  <BadgeTile badge={badge} />
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function badgeTargetLabel(badge: Badge): string {
  if (badge.category === 'streak') return `${badge.threshold}일 연속 기록`;
  if (badge.category === 'books') return `완독 ${badge.threshold}권`;
  return `갈피 ${badge.threshold}개`;
}

function BadgeTile({ badge }: { badge: BadgeProgress }) {
  const Icon = CATEGORY_ICON[badge.category];
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={() =>
        Alert.alert(badge.title, badge.achieved ? badge.description : `${badgeTargetLabel(badge)} 달성 시 잠금 해제돼요.`)
      }
      className="web:cursor-pointer w-full items-center gap-1.5 rounded-2xl bg-card p-3"
    >
      <View
        className={`relative h-11 w-11 items-center justify-center rounded-full ${
          badge.achieved ? CATEGORY_TONE[badge.category] : 'bg-secondary'
        }`}
      >
        <Icon size={18} color={badge.achieved ? colors.galpiInk : colors.mutedForeground} opacity={badge.achieved ? 1 : 0.5} />
        {!badge.achieved ? (
          <View className="absolute -bottom-0.5 -right-0.5 h-4 w-4 items-center justify-center rounded-full bg-muted-foreground">
            <Lock size={9} color={colors.card} />
          </View>
        ) : null}
      </View>
      <Text
        numberOfLines={1}
        className={`text-center text-[10px] font-bold ${badge.achieved ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        {badge.title}
      </Text>
    </Pressable>
  );
}
