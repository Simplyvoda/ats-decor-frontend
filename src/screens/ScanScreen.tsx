import React, {useRef} from 'react';
import {
  View,
  Button,
  UIManager,
  findNodeHandle,
  NativeSyntheticEvent,
} from 'react-native';
import RoomPlanView from '../components/RoomScanner/RoomPlanView.native';

export default function ScannerScreen() {
  const ref = useRef(null);

  // Called when scanning finishes (JSON string of CapturedRoom)
  const onScanFinished = (e: NativeSyntheticEvent<{roomJson: string}>) => {
    const roomJson = e.nativeEvent.roomJson;
    console.log('Scan JSON:', roomJson);
    // Parse or save JSON as needed
  };
  
  // Called when export is done (JSON + USDZ base64)
  const onExportComplete = (e: NativeSyntheticEvent<{json: string; usdzBase64: string}>) => {
    const {json, usdzBase64} = e.nativeEvent;
    console.log('Export JSON:', json);
    console.log('USDZ (base64) length:', usdzBase64.length);
    // You can save or decode the USDZ for viewing
  };

  const startScan = () => {
    // Dispatch the native command to start scanning on the view ref
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

  const exportScan = () => {
    UIManager.dispatchViewManagerCommand(
      findNodeHandle(ref.current),
      UIManager.getViewManagerConfig('RoomplanView').Commands.exportScanResults,
      [],
    );
  };

  return (
    <View style={{flex: 1}}>
      {/* A full-screen scanning view */}
      <RoomPlanView
        ref={ref}
        style={{flex: 1}}
        onScanFinished={onScanFinished}
        onExportComplete={onExportComplete}
      />
      {/* Example buttons to control scan */}
      <Button title="Start Scan" onPress={startScan} />
      <Button title="Stop & Finish" onPress={finishScan} />
      <Button title="Export Results" onPress={exportScan} />
    </View>
  );
}
