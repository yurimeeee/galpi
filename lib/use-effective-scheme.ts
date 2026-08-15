import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useThemeStore } from './theme-store';

/**
 * Resolves the app's persisted theme preference against the device's actual
 * appearance setting. Deliberately reads React Native's own `useColorScheme`
 * (always reflects `Appearance.getColorScheme()`) instead of NativeWind's —
 * NativeWind's manual override goes through `Appearance.setColorScheme()`,
 * which some platforms/builds silently ignore (e.g. a native binary built
 * before `userInterfaceStyle: "automatic"` locks the app to one scheme), so
 * an explicit "light"/"dark" pick could otherwise fail to take effect.
 */
export function useEffectiveScheme(): 'light' | 'dark' {
  const mode = useThemeStore((s) => s.mode);
  const system = useSystemColorScheme();
  if (mode === 'system') return system === 'dark' ? 'dark' : 'light';
  return mode;
}
