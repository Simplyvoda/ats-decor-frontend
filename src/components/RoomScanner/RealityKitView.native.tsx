import React from 'react';
import { UIManager, findNodeHandle, requireNativeComponent } from 'react-native';

interface RealityKitViewProps {
  modelUrl: string;
  style?: object;
  // Fired after captureSnapshotCommand with {path} or {error}
  onSnapshotReady?: (e: {
    nativeEvent: {path?: string; error?: string};
  }) => void;
  // Fired whenever furniture selection changes
  onFurnitureSelectionChanged?: (e: {
    nativeEvent: {selected: boolean};
  }) => void;
  // Fired after exportFurnitureLayoutCommand with {layout} (a JSON-encoded
  // array of placed pieces) or {error}
  onFurnitureLayoutExported?: (e: {
    nativeEvent: {layout?: string; error?: string};
  }) => void;
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

// Capture the current scene as a PNG; result arrives via onSnapshotReady.
export const captureSnapshotCommand = (ref: React.RefObject<any>) => {
  UIManager.dispatchViewManagerCommand(
    findNodeHandle(ref.current),
    UIManager.getViewManagerConfig('RealityKitView').Commands.captureSnapshot,
    [],
  );
};

// Remove the currently selected furniture piece from the scene.
export const removeSelectedFurnitureCommand = (ref: React.RefObject<any>) => {
  UIManager.dispatchViewManagerCommand(
    findNodeHandle(ref.current),
    UIManager.getViewManagerConfig('RealityKitView').Commands
      .removeSelectedFurniture,
    [],
  );
};

// Ask the native view to encode every placed furniture piece as JSON;
// result arrives via onFurnitureLayoutExported.
export const exportFurnitureLayoutCommand = (ref: React.RefObject<any>) => {
  UIManager.dispatchViewManagerCommand(
    findNodeHandle(ref.current),
    UIManager.getViewManagerConfig('RealityKitView').Commands
      .exportFurnitureLayout,
    [],
  );
};

// Re-place one furniture piece from a layout item previously produced by
// exportFurnitureLayoutCommand — call once per item to restore a design.
export const placeFurnitureFromLayoutCommand = (
  ref: React.RefObject<any>,
  itemJson: string,
) => {
  UIManager.dispatchViewManagerCommand(
    findNodeHandle(ref.current),
    UIManager.getViewManagerConfig('RealityKitView').Commands
      .placeFurnitureFromLayout,
    [itemJson],
  );
};

export default RealityKitNativeView;
