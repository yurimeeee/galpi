import { ScrollView } from 'react-native';
import { Chip } from './chip';

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
      {FILTERS.map((f) => (
        <Chip
          key={f.key}
          role="tab"
          label={f.label}
          count={counts[f.key]}
          selected={active === f.key}
          onPress={() => onChange(f.key)}
        />
      ))}
    </ScrollView>
  );
}
