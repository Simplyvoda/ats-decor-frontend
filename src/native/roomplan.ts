// roomplan.ts
import {NativeModules, Platform} from 'react-native';

type StartScanResult = {usdzPath: string};
const {RoomPlanModule} = NativeModules;

console.log('RoomPlanModule', RoomPlanModule);

export async function startRoomScan(): Promise<StartScanResult> {
  if (Platform.OS !== 'ios') {
    throw new Error('iOS only');
  }
  return RoomPlanModule?.startScan();
}
