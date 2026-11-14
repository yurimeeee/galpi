import { ActivityIndicator, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from '../../lib/icons';
import { useThemeColors } from '../../lib/theme';

type Variant = 'surface' | 'primary' | 'ghost';

const VARIANT_CLASS: Record<Variant, string> = {
  surface: 'bg-card',
  primary: 'bg-primary',
  ghost: '',
};

/**
 * The 36px round icon button used in screen headers and toolbars
 * (docs/design/DESIGN_SYSTEM.md §6). Bakes in the accessibility role, a
 * required label, and an 8px hitSlop so every instance clears the 44px
 * touch target without each screen remembering to.
 */
export function IconButton({
  Icon,
  label,
  onPress,
  variant = 'surface',
  iconSize = 16,
  iconColor,
  disabled = false,
  loading = false,
  hitSlop = 8,
  className = '',
  style,
}: {
  Icon: LucideIcon;
  /** Spoken name for screen readers — the button has no visible text. */
  label: string;
  onPress?: () => void;
  variant?: Variant;
  iconSize?: number;
  /** Overrides the variant's default icon color (e.g. `colors.destructive` for delete). */
  iconColor?: string;
  disabled?: boolean;
  /** Swaps the icon for a spinner and disables presses. */
  loading?: boolean;
  hitSlop?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useThemeColors();
  const color = iconColor ?? (variant === 'primary' ? colors.primaryForeground : colors.foreground);
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive }}
      hitSlop={hitSlop}
      className={`web:cursor-pointer h-9 w-9 items-center justify-center rounded-full ${VARIANT_CLASS[variant]} ${
        disabled ? 'opacity-60' : ''
      } ${className}`}
      style={style}
    >
      {loading ? <ActivityIndicator size="small" color={color} /> : <Icon size={iconSize} color={color} />}
    </Pressable>
  );
}
