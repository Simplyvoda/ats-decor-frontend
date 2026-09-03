import {NativeModules, Platform} from 'react-native';

export const isRoomScanSupported = (): boolean => {
  if (Platform.OS !== 'ios' || parseInt(Platform.Version as string, 10) < 16) {
    return false;
  }
  return NativeModules.RoomPlanSupport?.isSupported ?? false;
};
