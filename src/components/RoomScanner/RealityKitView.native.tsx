import React from 'react';
import { UIManager, findNodeHandle, requireNativeComponent } from 'react-native';

// The JS half of the RealityKit bridge.
//
// 'RealityKitView' (used in requireNativeComponent and every command below)
// is a runtime lookup key, not an import: RN derives it natively by
// stripping "Manager" from the Swift manager's exported name
// (RealityKitViewManager → "RealityKitView").
//
// This interface is HAND-WRITTEN — nothing verifies it against the native
// declarations in ios/RealityKitFeature/RealityKitViewManager.m. If the two
// drift (a renamed prop, a changed event payload), there's no error; the
// value just silently never arrives. When touching either side, keep all
// three in sync: the .m declarations, the Swift @objc vars, and this type.
interface RealityKitViewProps {
  modelUrl: string;
  // Gates furniture selection natively (drag/pinch-resize/rotate/delete all
  // require a selection first) — camera orbit/pan/zoom are unaffected
  // either way. Defaults true on the native side if omitted.
  editingEnabled?: boolean;
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
  // Fired after exportDesignPdfCommand with {path} to the PDF or {error}
  onDesignPdfExported?: (e: {
    nativeEvent: {path?: string; error?: string};
  }) => void;
}

const RealityKitNativeView = requireNativeComponent<RealityKitViewProps>('RealityKitView');

// Dispatch the loadFurniture command to the native view.
// urlString can be:
//   "bundle://chair.usdz"        → resolves from the app bundle (bundled test assets)
//   "https://..."                → remote download
//   "file:///..."                → local file path
// isFlat: true for rugs/mats — tells native to apply the bigger floor-snap
// offset directly, rather than trying to infer it from the model's own
// bounds (unreliable — see the comment on floorLift in RealityKitView.swift).
export const loadFurnitureCommand = (
  ref: React.RefObject<any>,
  urlString: string,
  isFlat: boolean,
) => {
  UIManager.dispatchViewManagerCommand(
    findNodeHandle(ref.current),
    UIManager.getViewManagerConfig('RealityKitView').Commands.loadFurniture,
    [urlString, isFlat],
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

// Capture a top-down (floor-plan) PNG for use as a design thumbnail, without
// disturbing the user's on-screen camera; result arrives via onSnapshotReady.
export const captureTopViewSnapshotCommand = (ref: React.RefObject<any>) => {
  UIManager.dispatchViewManagerCommand(
    findNodeHandle(ref.current),
    UIManager.getViewManagerConfig('RealityKitView').Commands
      .captureTopViewSnapshot,
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

// Export the current design as a one-page PDF (room view + top view, with
// the PlaDomus logo); result path arrives via onDesignPdfExported.
export const exportDesignPdfCommand = (
  ref: React.RefObject<any>,
  name: string,
) => {
  UIManager.dispatchViewManagerCommand(
    findNodeHandle(ref.current),
    UIManager.getViewManagerConfig('RealityKitView').Commands.exportDesignPdf,
    [name],
  );
};

export default RealityKitNativeView;
