import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

/**
 * Persisted theme preference — the effective light/dark scheme is resolved
 * from this (against the device's actual appearance for `'system'`) by
 * `useEffectiveScheme()`, not by anything here. Deliberately doesn't touch
 * NativeWind's own `colorScheme`/`Appearance.setColorScheme` — that native
 * override can silently no-op depending on the build, which is exactly the
 * failure mode `useEffectiveScheme` was written to avoid.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'galpi-theme',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
