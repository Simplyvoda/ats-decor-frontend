import React from 'react';
import { UIManager, findNodeHandle, requireNativeComponent } from 'react-native';

interface RealityKitViewProps {
  modelUrl: string;
  style?: object;
}

const RealityKitNativeView = requireNativeComponent<RealityKitViewProps>('RealityKitView');

// Dispatch the loadFurniture command to the native view.
// urlString can be:
//   "bundle://chair.usdz"        → resolves from the app bundle (bundled test assets)
//   "https://..."                → remote download
//   "file:///..."                → local file path
export const loadFurnitureCommand = (ref: React.RefObject<any>, urlString: string) => {
  UIManager.dispatchViewManagerCommand(
    findNodeHandle(ref.current),
    UIManager.getViewManagerConfig('RealityKitView').Commands.loadFurniture,
    [urlString],
  );
};

// Toggle between the normal orbit view and a top-down (floor plan) view.
export const toggleTopViewCommand = (ref: React.RefObject<any>) => {
  UIManager.dispatchViewManagerCommand(
    findNodeHandle(ref.current),
    UIManager.getViewManagerConfig('RealityKitView').Commands.toggleTopView,
    [],
  );
};

// Reset the camera back to its initial position inside the room.
export const resetCameraCommand = (ref: React.RefObject<any>) => {
  UIManager.dispatchViewManagerCommand(
    findNodeHandle(ref.current),
    UIManager.getViewManagerConfig('RealityKitView').Commands.resetCamera,
    [],
  );
};

export default RealityKitNativeView;
