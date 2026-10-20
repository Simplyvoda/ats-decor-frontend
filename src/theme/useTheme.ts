import {useColorScheme, StyleSheet} from 'react-native';
import {darkColors, lightColors, ThemeColors} from './colors';

// The current colours, following the phone's Light/Dark setting (Settings →
// Display & Brightness). Re-renders the component when the setting changes.
export function useTheme(): {isDark: boolean; colors: ThemeColors} {
  const isDark = useColorScheme() === 'dark';
  return {isDark, colors: isDark ? darkColors : lightColors};
}

// StyleSheet.create, but with the theme's colours available:
//
//   const useStyles = makeStyles(c => ({
//     card: {backgroundColor: c.surface},
//   }));
//   …inside the component: const styles = useStyles();
//
// Both versions are built once, up front, so switching modes just picks
// the other one instead of rebuilding styles on every render.
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: ThemeColors) => T,
): () => T {
  const light = StyleSheet.create(factory(lightColors));
  const dark = StyleSheet.create(factory(darkColors));
  return function useStyles() {
    return useTheme().isDark ? dark : light;
  };
}
