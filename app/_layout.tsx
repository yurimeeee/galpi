// Must be the very first import: react-native-gesture-handler patches native
// touch dispatch before any other native view (react-native-screens, etc.)
// registers its own responders. Importing it later — e.g. only where a
// GestureDetector is used — throws "Exception in HostFunction" on device.
import 'react-native-gesture-handler';

import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffectiveScheme } from '../lib/use-effective-scheme';
import {
  useFonts,
  NotoSansKR_100Thin,
  NotoSansKR_200ExtraLight,
  NotoSansKR_300Light,
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_600SemiBold,
  NotoSansKR_700Bold,
  NotoSansKR_800ExtraBold,
  NotoSansKR_900Black,
} from '@expo-google-fonts/noto-sans-kr';
import { WebFrame } from '../components/layout/web-frame';
import { ReadingTimerWidget } from '../components/galpi/reading-timer-widget';
import { UndoSnackbar } from '../components/galpi/undo-snackbar';
import { getAnalyticsIfSupported } from '../lib/firebase';
import { useAuthSync } from '../lib/use-auth-sync';
import { useOnThisDayReminder } from '../lib/use-on-this-day-reminder';
import { useStreakRiskReminder } from '../lib/use-streak-risk-reminder';
import { useReadingTimerAutoAdvance } from '../lib/use-reading-timer-auto-advance';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    getAnalyticsIfSupported();
  }, []);

  const colorScheme = useEffectiveScheme();
  const { authResolved } = useAuthSync();
  // Recomputes/reschedules today's "1년 전 오늘" notification on every launch —
  // mounted here (not just the settings screen) so it runs regardless of
  // which screen the user opens the app to.
  useOnThisDayReminder();
  // Same reschedule-on-launch approach as above, for the streak-at-risk nudge.
  useStreakRiskReminder();
  // Drives the reading timer's phase transitions independent of whichever
  // screen is mounted — see lib/use-reading-timer-auto-advance.ts.
  useReadingTimerAutoAdvance();

  const [fontsLoaded] = useFonts({
    NotoSansKR_100Thin,
    NotoSansKR_200ExtraLight,
    NotoSansKR_300Light,
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_600SemiBold,
    NotoSansKR_700Bold,
    NotoSansKR_800ExtraBold,
    NotoSansKR_900Black,
  });

  const ready = fontsLoaded && authResolved;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/*
        The `:root`/`.dark` CSS-variable blocks in global.css only apply where
        something in the tree actually carries the "dark" class — there's no
        document element on native to mirror it onto automatically, so without
        this wrapper the CSS-variable colors (bg-background, text-foreground,
        ...) never switch even though anything reading the resolved scheme
        directly (useThemeColors, via useEffectiveScheme) does update. This
        wrapper is what makes dark mode actually repaint on native.
      */}
      <View className={colorScheme === 'dark' ? 'dark' : undefined} style={{ flex: 1 }}>
        <SafeAreaProvider>
          <WebFrame>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="login" />
              <Stack.Screen name="signup" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="book/[id]" />
              <Stack.Screen name="reading-timer" />
              <Stack.Screen name="add-sentence" options={{ presentation: 'modal' }} />
              <Stack.Screen name="add-book" options={{ presentation: 'modal' }} />
              <Stack.Screen name="notification-settings" />
              <Stack.Screen name="terms" />
              <Stack.Screen name="privacy" />
            </Stack>
            <ReadingTimerWidget />
            <UndoSnackbar />
          </WebFrame>
        </SafeAreaProvider>
      </View>
    </GestureHandlerRootView>
  );
}
