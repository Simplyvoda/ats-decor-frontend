import React, {useRef} from 'react';
import {
  Button,
  NativeModules,
  NativeSyntheticEvent,
  UIManager,
  View,
  findNodeHandle,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import RoomPlanView from '../components/RoomScanner/RoomPlanView.native';
import DesignService from '../services/DesignService';

const {RealityKitModule} = NativeModules;

export default function ScannerScreen() {
  const ref = useRef(null);
  const navigation = useNavigation();

  const onScanFinished = (e: NativeSyntheticEvent<{roomJson: string}>) => {
    console.log('Scan JSON:', e.nativeEvent.roomJson);
  };

  const onExportComplete = (
    e: NativeSyntheticEvent<{json: string; usdzBase64: string; fileUrl: string}>,
  ) => {
    const {fileUrl} = e.nativeEvent;
    console.log('Export complete, fileUrl:', fileUrl);

    // Navigate immediately — don't block on upload
    (navigation as any).navigate('ARViewer', {modelUrl: fileUrl});

    // Auto-name: "Room Scan - 15 Jun 2026"
    const scanName = `Room Scan - ${new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`;

    DesignService.upload(fileUrl, scanName)
      .then(() => console.log('Scan saved to cloud'))
      .catch(err => console.warn('Scan upload failed:', err?.message ?? err));
  };

  const startScan = () => {
    UIManager.dispatchViewManagerCommand(
      findNodeHandle(ref.current),
      UIManager.getViewManagerConfig('RoomplanView').Commands.startScanning,
      [],
    );
  };

  const finishScan = () => {
    UIManager.dispatchViewManagerCommand(
      findNodeHandle(ref.current),
      UIManager.getViewManagerConfig('RoomplanView').Commands.stopScanning,
      [],
    );
  };

  return (
    <View style={{flex: 1}}>
      <RoomPlanView
        ref={ref}
        style={{flex: 1}}
        onScanFinished={onScanFinished}
        onExportComplete={onExportComplete}
      />
      <Button title="Start Scan" onPress={startScan} />
      <Button title="Stop & Finish" onPress={finishScan} />

      {/* DEV: loads savedRoom.usdz straight into ARViewerScreen (no scan needed) */}
      <Button
        title="[Dev] Load saved room"
        onPress={async () => {
          try {
            const url = await RealityKitModule.getSavedRoomUrl();
            (navigation as any).navigate('ARViewer', {modelUrl: url});
          } catch {
            console.warn('[Dev] No savedRoom.usdz found — scan a room first');
          }
        }}
      />
    </View>
  );
}
