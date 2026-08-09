import { Pressable, ScrollView, Text } from 'react-native';

export type FilterKey = 'all' | 'reading' | 'done' | 'wish';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'reading', label: '읽는 중' },
  { key: 'done', label: '완독' },
  { key: 'wish', label: '읽고 싶은' },
];

export function StatusFilter({
  active,
  onChange,
  counts,
}: {
  active: FilterKey;
  onChange: (key: FilterKey) => void;
  counts: Record<FilterKey, number>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      contentContainerClassName="gap-2 pb-1"
    >
      {FILTERS.map((f) => {
        const isActive = active === f.key;
        return (
          <Pressable
            key={f.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(f.key)}
            className={`web:cursor-pointer shrink-0 flex-row items-center gap-1.5 rounded-full px-4 py-2 ${
              isActive ? 'bg-galpi-ink' : 'bg-card'
            }`}
          >
            <Text
              className={`text-sm font-medium ${isActive ? 'text-galpi-paper' : 'text-muted-foreground'}`}
            >
              {f.label}
            </Text>
            <Text
              className={`text-xs ${isActive ? 'text-galpi-paper/60' : 'text-muted-foreground/50'}`}
            >
              {counts[f.key]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
