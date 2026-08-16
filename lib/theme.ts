import { useEffectiveScheme } from './use-effective-scheme';

/**
 * Raw color values mirroring the CSS vars in global.css. Used where a hex
 * string is required directly (icon `color` prop, SVG fills, shadowColor)
 * instead of a className — those props can't resolve a CSS variable, so the
 * light/dark pair is kept in sync with global.css by hand.
 */
type ThemeColorMap = Record<
  | 'galpiBlue'
  | 'galpiGreen'
  | 'galpiYellow'
  | 'galpiInk'
  | 'galpiPaper'
  | 'background'
  | 'foreground'
  | 'card'
  | 'secondary'
  | 'muted'
  | 'mutedForeground'
  | 'accent'
  | 'destructive'
  | 'border'
  | 'primary'
  | 'primaryForeground',
  string
>;

const LIGHT_COLORS: ThemeColorMap = {
  galpiBlue: '#D8DBE9',
  galpiGreen: '#CFE9C9',
  galpiYellow: '#EFF092',
  galpiInk: '#202020',
  galpiPaper: '#F4F4F6',

  background: '#F4F4F6',
  foreground: '#202020',
  card: '#FFFFFF',
  secondary: '#ECECEF',
  muted: '#ECECEF',
  mutedForeground: '#77777D',
  accent: '#D8DBE9',
  destructive: '#DC2626',
  border: '#E3E3E8',
  // Mirrors --color-primary / --color-primary-foreground: the theme-reactive
  // pair for solid CTA buttons (bg-galpi-ink stays fixed-black in both
  // themes and goes near-invisible on a dark page, so CTAs use this instead).
  primary: '#202020',
  primaryForeground: '#F4F4F6',
};

const DARK_COLORS: ThemeColorMap = {
  // Fixed brand colors — see the matching comment in tailwind.config.js.
  galpiBlue: '#D8DBE9',
  galpiGreen: '#CFE9C9',
  galpiYellow: '#EFF092',
  galpiInk: '#202020',
  galpiPaper: '#F4F4F6',

  background: '#18181B',
  foreground: '#ECECEE',
  card: '#232326',
  secondary: '#2C2C30',
  muted: '#2C2C30',
  mutedForeground: '#9A9AA2',
  accent: '#35415A',
  destructive: '#F87171',
  border: '#313136',
  primary: '#ECECEE',
  primaryForeground: '#18181B',
};

/** Static light-mode colors. Prefer `useThemeColors()` inside components so colors follow the active theme. */
export const colors = LIGHT_COLORS;

/** Reactive color map that follows the app's current light/dark theme. */
export function useThemeColors() {
  const scheme = useEffectiveScheme();
  return scheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
}

export type Accent = 'blue' | 'green' | 'yellow' | 'ink';

export const ACCENT_HEX: Record<Accent, string> = {
  blue: colors.galpiBlue,
  green: colors.galpiGreen,
  yellow: colors.galpiYellow,
  ink: colors.galpiInk,
};

/** Tailwind className for an accent's background block. */
export const ACCENT_BG_CLASS: Record<Accent, string> = {
  blue: 'bg-galpi-blue',
  green: 'bg-galpi-green',
  yellow: 'bg-galpi-yellow',
  ink: 'bg-galpi-ink',
};

/** Rotation order for auto-assigning a spine color to newly added books. */
export const ACCENT_CYCLE: Accent[] = ['blue', 'green', 'yellow', 'ink'];
