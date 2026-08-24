import React from 'react';
import {UIManager, findNodeHandle, requireNativeComponent} from 'react-native';

// The JS half of the RoomPlan bridge.
//
// 'RoomplanView' below is not a file or an import — it's a runtime lookup
// key. React Native derives it on the native side by stripping the
// "Manager" suffix from the Swift manager's exported name
// (RoomplanViewManager → "RoomplanView"). If no native component under
// that exact name has been registered, this throws at require time.
//
// This interface is HAND-WRITTEN and nothing checks it against the native
// declarations (that's the classic bridge's biggest gotcha — the New
// Architecture's codegen exists precisely to close this gap). If it drifts
// from ios/RoomPlanFeature/RoomplanViewManager.m, props/events silently misbehave.
interface RoomPlanViewProps {
  style?: object;
  // Fired when a finished scan has been processed and exported:
  //   success → {json, fileUrl}   (metadata JSON + file:// URL of the .usdz)
  //   failure → {error}           (no fileUrl — check before navigating!)
  onExportComplete?: (e: {
    nativeEvent: {json?: string; fileUrl?: string; error?: string};
  }) => void;
}

const RoomPlanView = requireNativeComponent<RoomPlanViewProps>('RoomplanView');

// Command dispatch: JS can't call methods on a native view directly. Instead
// it sends (viewTag, commandId, args) through UIManager; the native manager
// receives the call, looks the tag up in the view registry, and invokes the
// matching method on that specific view instance.
const dispatch = (ref: React.RefObject<any>, command: string) => {
  const nodeHandle = findNodeHandle(ref.current);
  if (nodeHandle == null) {
    return;
  }
  UIManager.dispatchViewManagerCommand(
    nodeHandle,
    UIManager.getViewManagerConfig('RoomplanView').Commands[command],
    [],
  );
};

// Begin a capture session (camera starts scanning the room).
export const startScanningCommand = (ref: React.RefObject<any>) =>
  dispatch(ref, 'startScanning');

// Finish the scan and export it — the result arrives via onExportComplete.
export const stopScanningCommand = (ref: React.RefObject<any>) =>
  dispatch(ref, 'stopScanning');

// Discard the in-progress capture and immediately start a fresh one ("redo").
export const resetScanningCommand = (ref: React.RefObject<any>) =>
  dispatch(ref, 'resetScanning');

// Silently end the session with NO export — for back-navigation mid-scan,
// so onExportComplete never fires.
export const abortScanningCommand = (ref: React.RefObject<any>) =>
  dispatch(ref, 'abortScanning');

export default RoomPlanView;
