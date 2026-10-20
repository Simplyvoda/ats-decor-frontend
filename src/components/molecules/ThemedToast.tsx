import React from 'react';
import Toast, {BaseToast, ToastConfig} from 'react-native-toast-message';
import {useTheme} from '../../theme/useTheme';
import {ThemeColors} from '../../theme/colors';

// The library's default toasts are always white cards with black text.
// Same layout, theme colours; the coloured strip on the left keeps telling
// success / error / info apart.
const buildConfig = (c: ThemeColors): ToastConfig => {
  const themed =
    (accent: string): ToastConfig[string] =>
    props => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: accent,
          backgroundColor: c.surface,
          shadowColor: c.shadow,
        }}
        text1Style={{color: c.textPrimary, fontSize: 14, fontWeight: '600'}}
        text2Style={{color: c.textSecondary, fontSize: 13}}
        text2NumberOfLines={3}
      />
    );
  return {
    success: themed(c.success),
    error: themed(c.danger),
    info: themed(c.brand),
  };
};

export default function ThemedToast() {
  const {colors} = useTheme();
  return <Toast config={buildConfig(colors)} />;
}
