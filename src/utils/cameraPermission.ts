import {NativeModules} from 'react-native';

// Camera permission, from RoomPlanSupport.swift.
// - notDetermined: never asked (iOS will show its prompt when we ask)
// - authorized: allowed
// - denied: they said no; only the Settings app can change it now
// - restricted: blocked by Screen Time or device management
export type CameraStatus =
  | 'notDetermined'
  | 'authorized'
  | 'denied'
  | 'restricted';

const support = NativeModules.RoomPlanSupport;

export async function getCameraStatus(): Promise<CameraStatus> {
  // An app build from before this was added has no such method; treat it
  // as allowed so scanning works the way it did before.
  if (!support?.cameraStatus) {
    return 'authorized';
  }
  return support.cameraStatus();
}

export async function requestCameraAccess(): Promise<CameraStatus> {
  if (!support?.requestCameraAccess) {
    return 'authorized';
  }
  return support.requestCameraAccess();
}
