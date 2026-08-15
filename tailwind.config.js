const plugin = require('tailwindcss/plugin');

/**
 * Noto Sans KR is loaded as separate static-weight font families (no variable
 * font / synthetic bolding on native), so the `font-*` weight utilities are
 * redefined to select the matching family instead of emitting `font-weight`.
 */
const fontWeightFamily = plugin(({ addUtilities }) => {
  addUtilities({
    '.font-thin': { fontFamily: 'NotoSansKR_100Thin' },
    '.font-extralight': { fontFamily: 'NotoSansKR_200ExtraLight' },
    '.font-light': { fontFamily: 'NotoSansKR_300Light' },
    '.font-normal': { fontFamily: 'NotoSansKR_400Regular' },
    '.font-medium': { fontFamily: 'NotoSansKR_500Medium' },
    '.font-semibold': { fontFamily: 'NotoSansKR_600SemiBold' },
    '.font-bold': { fontFamily: 'NotoSansKR_700Bold' },
    '.font-extrabold': { fontFamily: 'NotoSansKR_800ExtraBold' },
    '.font-black': { fontFamily: 'NotoSansKR_900Black' },
  });
});

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  corePlugins: {
    fontWeight: false,
  },
  theme: {
    extend: {
      colors: {
        galpi: {
          blue: '#D8DBE9',
          green: '#CFE9C9',
          yellow: '#EFF092',
          // Fixed brand colors, not theme-reactive: these are used throughout
          // the app as a contrast pair against the (also fixed) pastel accent
          // cards and spine colors above, and as an "inverted chip" (dark
          // bg + light text) that's meant to read as a constant brand mark
          // rather than surface chrome. Flipping them with the theme would
          // break contrast against those fixed surfaces.
          ink: '#202020',
          paper: '#F4F4F6',
        },
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        card: 'rgb(var(--color-card) / <alpha-value>)',
        'card-foreground': 'rgb(var(--color-card-foreground) / <alpha-value>)',
        popover: 'rgb(var(--color-popover) / <alpha-value>)',
        'popover-foreground': 'rgb(var(--color-popover-foreground) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-foreground': 'rgb(var(--color-primary-foreground) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        'secondary-foreground': 'rgb(var(--color-secondary-foreground) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--color-muted-foreground) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-foreground': 'rgb(var(--color-accent-foreground) / <alpha-value>)',
        destructive: 'rgb(var(--color-destructive) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        input: 'rgb(var(--color-input) / <alpha-value>)',
        ring: 'rgb(var(--color-ring) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['NotoSansKR_400Regular'],
        mono: ['Courier'],
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.375rem',
        '4xl': '1.625rem',
      },
    },
  },
  plugins: [fontWeightFamily],
};
