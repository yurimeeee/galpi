import { View, Text } from 'react-native';

const CHIPS = [
  { name: 'WOLI Blue', hex: '#D8DBE9', className: 'bg-galpi-blue' },
  { name: 'Fresh Green', hex: '#CFE9C9', className: 'bg-galpi-green' },
  { name: 'Yellow', hex: '#EFF092', className: 'bg-galpi-yellow' },
  { name: 'Coco Black', hex: '#202020', className: 'bg-galpi-ink' },
  { name: 'Ghost White', hex: '#F4F4F6', className: 'bg-galpi-paper border border-border' },
];

export function ColorChips() {
  return (
    <View accessibilityLabel="갈피 테마 컬러칩">
      <View className="mb-3 flex-row items-baseline justify-between">
        <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          테마 컬러칩
        </Text>
        <Text className="font-mono text-[10px] text-muted-foreground/60">
          5 colors
        </Text>
      </View>
      <View className="flex-row gap-2.5">
        {CHIPS.map((chip) => (
          <View key={chip.name} className="flex-1 gap-1.5">
            <View className={`h-14 rounded-xl ${chip.className}`} />
            <Text numberOfLines={1} className="text-[9px] font-medium leading-tight text-foreground">
              {chip.name}
            </Text>
            <Text className="font-mono text-[9px] leading-none text-muted-foreground/70">
              {chip.hex}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
