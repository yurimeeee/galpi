import {
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_600SemiBold,
  NotoSansKR_700Bold,
  NotoSansKR_900Black,
} from '@expo-google-fonts/noto-sans-kr';

/**
 * Native font map for `useFonts`. Only the five weights the `font-*`
 * utilities in tailwind.config.js actually reference — thin/extralight/
 * light/extrabold were bundled (≈6MB each) but never used.
 *
 * Web uses lib/fonts.web.ts instead (Google Fonts CSS, see app/+html.tsx),
 * so the TTFs never enter the web bundle.
 */
export const FONTS = {
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_600SemiBold,
  NotoSansKR_700Bold,
  NotoSansKR_900Black,
};
