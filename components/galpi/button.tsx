import { ActivityIndicator, Pressable, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useThemeColors } from '../../lib/theme';

type Variant = 'primary' | 'secondary' | 'pill';

const VARIANT_CLASS: Record<Variant, { box: string; text: string }> = {
  primary: { box: 'rounded-xl bg-primary py-4', text: 'text-sm font-bold text-primary-foreground' },
  secondary: { box: 'rounded-xl border border-input bg-card py-3.5', text: 'text-sm font-semibold text-foreground' },
  pill: { box: 'rounded-full bg-primary py-3', text: 'text-sm font-bold text-primary-foreground' },
};

/**
 * Full-width action button (docs/design/DESIGN_SYSTEM.md §6).
 *   primary   — the one main action on a screen (save, log in, publish)
 *   secondary — alternative action beside a primary (social login, cancel)
 *   pill      — compact rounded action inside a hero surface
 * `loading` shows a spinner in place of the icon and blocks presses;
 * `disabled` dims the button. Press feedback is a 0.98 scale.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  Icon,
  iconSize = 16,
  loading = false,
  disabled = false,
  className = '',
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  Icon?: LucideIcon;
  iconSize?: number;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const colors = useThemeColors();
  const { box, text } = VARIANT_CLASS[variant];
  const contentColor = variant === 'secondary' ? colors.foreground : colors.primaryForeground;
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      className={`web:cursor-pointer w-full flex-row items-center justify-center gap-2 ${box} ${
        inactive ? 'opacity-60' : ''
      } ${className}`}
      style={({ pressed }) => pressed && !inactive && { transform: [{ scale: 0.98 }] }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={contentColor} />
      ) : Icon ? (
        <Icon size={iconSize} color={contentColor} />
      ) : null}
      <Text className={text}>{label}</Text>
    </Pressable>
  );
}
