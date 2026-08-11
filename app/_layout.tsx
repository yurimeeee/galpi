// Must be the very first import: react-native-gesture-handler patches native
// touch dispatch before any other native view (react-native-screens, etc.)
// registers its own responders. Importing it later — e.g. only where a
// GestureDetector is used — throws "Exception in HostFunction" on device.
import 'react-native-gesture-handler';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
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
import { getAnalyticsIfSupported } from '../lib/firebase';
import { useAuthSync } from '../lib/use-auth-sync';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    getAnalyticsIfSupported();
  }, []);

  const { authResolved } = useAuthSync();

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
      <SafeAreaProvider>
        <WebFrame>
          <StatusBar style="dark" />
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
        </WebFrame>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
