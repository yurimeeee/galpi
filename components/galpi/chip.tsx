import { Pressable, Text } from 'react-native';

/**
 * Pill-shaped filter/selection chip (docs/design/DESIGN_SYSTEM.md §6).
 * Selected = fixed ink on paper (the brand's selection mark), default =
 * card surface with secondary text. The optional count sits on the same
 * baseline at the badge size and uses the same color as the label instead
 * of an opacity step, so it stays legible on both surfaces.
 */
export function Chip({
  label,
  selected = false,
  count,
  onPress,
  role = 'button',
  className = '',
}: {
  label: string;
  selected?: boolean;
  count?: number | string;
  onPress?: () => void;
  /** `tab` when the chip belongs to a tablist (status filter), `button` otherwise. */
  role?: 'button' | 'tab';
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityState={{ selected }}
      className={`web:cursor-pointer shrink-0 flex-row items-baseline gap-1.5 rounded-full px-4 py-2 ${
        selected ? 'bg-galpi-ink' : 'bg-card'
      } ${className}`}
      style={({ pressed }) => pressed && { opacity: 0.85 }}
    >
      <Text className={`text-sm font-medium ${selected ? 'text-galpi-paper' : 'text-muted-foreground'}`}>{label}</Text>
      {count !== undefined ? (
        <Text className={`text-2xs font-semibold ${selected ? 'text-galpi-paper/70' : 'text-muted-foreground'}`}>
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}
