import {useCallback} from 'react';
import {StatusBar} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useTheme} from '../theme/useTheme';

// For screens whose gold header runs up behind the status bar: white
// time / signal / battery while the screen is showing, and back to the
// theme's usual colour when you leave it.
export default function useLightStatusBar() {
  const {isDark} = useTheme();
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content', true);
      return () =>
        StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
    }, [isDark]),
  );
}
