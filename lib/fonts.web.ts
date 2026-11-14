/**
 * Web counterpart of lib/fonts.ts. Fonts come from the Google Fonts
 * stylesheet linked in app/+html.tsx (woff2, unicode-range subsets,
 * `display=swap`), and tailwind.config.js emits `font-family: 'Noto Sans KR'`
 * + `font-weight` on web — so there is nothing for `useFonts` to load and
 * first paint is no longer blocked on a 30MB TTF download.
 */
export const FONTS = {};
