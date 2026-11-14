import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Must match `background` in lib/theme.ts / global.css so the browser chrome
// and the pre-hydration body never flash a different color than the app.
const LIGHT_BACKGROUND = '#F4F4F6';
const DARK_BACKGROUND = '#18181B';

/**
 * Static HTML shell for the web export (expo-router). Only runs at build
 * time on web; native ignores this file.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <title>갈피</title>
        <meta name="description" content="책 속 문장을 갈피에 담는 독서 기록" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content={LIGHT_BACKGROUND} />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content={DARK_BACKGROUND} />
        <meta name="color-scheme" content="light dark" />

        {/* Keeps the root ScrollView behaviour of native: body doesn't scroll, screens do. */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body { background-color: ${LIGHT_BACKGROUND}; }
@media (prefers-color-scheme: dark) {
  body { background-color: ${DARK_BACKGROUND}; }
}`;
