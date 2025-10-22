import React from 'react';
import { Switch } from 'react-native';

interface AppSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const AppSwitch: React.FC<AppSwitchProps> = ({ value, onValueChange, disabled }) => {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{
        false: '#E5E5E5',
        true: '#C4A663',
      }}
      ios_backgroundColor="#E5E5E5" // ensures off state looks same on iOS
    />
  );
};

export default AppSwitch;
