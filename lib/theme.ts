/**
 * Raw color values mirroring tailwind.config.js. Used where a hex string is
 * required directly (icon `color` prop, SVG fills) instead of a className.
 */
export const colors = {
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
} as const;

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
