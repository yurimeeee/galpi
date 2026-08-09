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
          ink: '#202020',
          paper: '#F4F4F6',
        },
        background: '#F4F4F6',
        foreground: '#202020',
        card: '#FFFFFF',
        'card-foreground': '#202020',
        popover: '#FFFFFF',
        'popover-foreground': '#202020',
        primary: '#202020',
        'primary-foreground': '#F4F4F6',
        secondary: '#ECECEF',
        'secondary-foreground': '#202020',
        muted: '#ECECEF',
        'muted-foreground': '#77777D',
        accent: '#D8DBE9',
        'accent-foreground': '#202020',
        destructive: '#DC2626',
        border: '#E3E3E8',
        input: '#E3E3E8',
        ring: '#202020',
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
