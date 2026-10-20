import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {Appearance} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeWindStyleSheet} from 'nativewind';

// The user's choice in Settings → Profile & Preferences → Appearance.
// 'system' (the default) follows the phone's Light/Dark setting; 'light' or
// 'dark' keep the app in that mode whatever the phone is set to.
export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'themePreference';

// Applies a preference to everything that draws colours:
// - Appearance.setColorScheme overrides the mode for the whole app, so
//   useColorScheme (useTheme), NativeWind's `dark:` classes and iOS's own
//   pieces (alerts, keyboard, pickers) all follow it. null = phone setting.
// - NativeWind keeps its own copy of the mode, set here as well so its
//   `dark:` classes switch at the same moment.
const apply = (preference: ThemePreference) => {
  Appearance.setColorScheme(preference === 'system' ? null : preference);
  NativeWindStyleSheet.setColorScheme(preference);
};

const ThemePreferenceContext = createContext<{
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}>({preference: 'system', setPreference: () => {}});

export function ThemePreferenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  // Restore the saved choice at launch. Until it's read (a few
  // milliseconds) the app shows the phone's setting.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(saved => {
        if (saved === 'light' || saved === 'dark') {
          setPreferenceState(saved);
          apply(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    apply(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  return (
    <ThemePreferenceContext.Provider value={{preference, setPreference}}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export const useThemePreference = () => useContext(ThemePreferenceContext);
