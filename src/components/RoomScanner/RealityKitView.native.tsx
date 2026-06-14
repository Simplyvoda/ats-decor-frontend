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

export default RealityKitNativeView;
