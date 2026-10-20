import React from 'react';
import {Switch} from 'react-native';
import {useTheme} from '../../theme/useTheme';

interface AppSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const AppSwitch: React.FC<AppSwitchProps> = ({
  value,
  onValueChange,
  disabled,
}) => {
  const {colors} = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{
        false: colors.border,
        true: colors.brand,
      }}
      ios_backgroundColor={colors.border} // ensures off state looks same on iOS
    />
  );
};

export default AppSwitch;
