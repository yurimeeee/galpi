import { Pressable, Text, View } from 'react-native';
import { Library, Plus, BarChart3, UserRound, type LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../lib/theme';

export type NavKey = 'library' | 'add' | 'stats' | 'mypage';

export function BottomNav({
  active,
  onChange,
}: {
  active: NavKey;
  onChange: (key: NavKey) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="relative w-full flex-row items-center justify-around border-t border-border bg-card/90 px-4 pt-3 web:backdrop-blur"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      <NavButton
        label="내 서재"
        Icon={Library}
        active={active === 'library'}
        onPress={() => onChange('library')}
      />
      <NavButton
        label="독서 통계"
        Icon={BarChart3}
        active={active === 'stats'}
        onPress={() => onChange('stats')}
      />

      {/* 중앙 갈피 추가 버튼 */}
      <Pressable
        onPress={() => onChange('add')}
        accessibilityLabel="갈피 추가"
        className="web:cursor-pointer -mt-8 h-14 w-14 items-center justify-center rounded-2xl bg-galpi-ink"
        style={({ pressed }) => [
          {
            shadowColor: colors.galpiInk,
            shadowOpacity: 0.25,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          },
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
      >
        <Plus size={24} color={colors.galpiPaper} />
      </Pressable>

      <NavButton
        label="마이페이지"
        Icon={UserRound}
        active={active === 'mypage'}
        onPress={() => onChange('mypage')}
      />
    </View>
  );
}

function NavButton({
  label,
  Icon,
  active,
  onPress,
}: {
  label: string;
  Icon: LucideIcon;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      className="web:cursor-pointer w-16 items-center gap-1"
    >
      <Icon
        size={20}
        color={active ? colors.foreground : colors.mutedForeground}
        strokeWidth={active ? 2.4 : 1.8}
      />
      <Text
        className={`text-[11px] font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
