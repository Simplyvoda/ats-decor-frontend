import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  NativeModules,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
  findNodeHandle,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Check, ChevronLeft, RotateCcw} from 'lucide-react-native';
import RoomPlanView from '../components/RoomScanner/RoomPlanView.native';
import {goBack} from '../utils/navigation';

const {RealityKitModule} = NativeModules;
const ACCENT = '#C4A962';

export default function ScannerScreen() {
  const ref = useRef(null);
  const navigation = useNavigation();
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);

  const dispatchCommand = (commandName: string) => {
    const nodeHandle = findNodeHandle(ref.current);
    if (nodeHandle == null) {
      return;
    }
    UIManager.dispatchViewManagerCommand(
      nodeHandle,
      UIManager.getViewManagerConfig('RoomplanView').Commands[commandName],
      [],
    );
  };

  const onScanFinished = (e: NativeSyntheticEvent<{roomJson: string}>) => {
    console.log('Scan JSON:', e.nativeEvent.roomJson);
  };

  const onExportComplete = (
    e: NativeSyntheticEvent<{json: string; usdzBase64: string; fileUrl: string}>,
  ) => {
    const {fileUrl} = e.nativeEvent;
    console.log('Export complete, fileUrl:', fileUrl);
    setProcessing(false);

    // Saving happens in ARViewer (⋮ → Save design) so the design gets a
    // real snapshot thumbnail instead of a blind background upload here.
    (navigation as any).navigate('ARViewer', {modelUrl: fileUrl, fromScan: true});
  };

  const startScan = () => {
    dispatchCommand('startScanning');
    setScanning(true);
  };

  const resetScan = () => {
    dispatchCommand('resetScanning');
  };

  const finishScan = () => {
    setProcessing(true);
    dispatchCommand('stopScanning');
  };

  const onBackPress = () => {
    if (scanning) {
      dispatchCommand('abortScanning');
    }
    goBack(navigation);
  };

  const loadSavedRoomDev = async () => {
    try {
      const url = await RealityKitModule.getSavedRoomUrl();
      (navigation as any).navigate('ARViewer', {modelUrl: url});
    } catch {
      console.warn('[Dev] No savedRoom.usdz found — scan a room first');
    }
  };

  return (
    <View style={styles.root}>
      <RoomPlanView
        ref={ref}
        style={StyleSheet.absoluteFill}
        onScanFinished={onScanFinished}
        onExportComplete={onExportComplete}
      />

      {/* Corner brackets — pure decoration */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
      </View>

      {/* Top overlay */}
      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.topRow} pointerEvents="box-none">
          <TouchableOpacity style={styles.backBtn} onPress={onBackPress}>
            <ChevronLeft color="white" size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Scan Room</Text>
          <View style={styles.backBtnSpacer} />
        </View>
      </SafeAreaView>

      {/* Bottom overlay */}
      <SafeAreaView style={styles.bottomOverlay} pointerEvents="box-none">
        <Text style={styles.caption}>Slowly turn your camera to capture your room</Text>

        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.sideBtn, !scanning && styles.sideBtnDisabled]}
            disabled={!scanning}
            onPress={resetScan}>
            <RotateCcw color="#333" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shutterOuter}
            disabled={scanning}
            onPress={startScan}>
            <View style={[styles.shutterInner, scanning && styles.shutterInnerDisabled]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sideBtn, !scanning && styles.sideBtnDisabled]}
            disabled={!scanning}
            onPress={finishScan}>
            <Check color="#333" size={20} />
          </TouchableOpacity>
        </View>

        {/* Dev-only affordance, preserved from the old UI */}
        <TouchableOpacity onPress={loadSavedRoomDev} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Text style={styles.devLink}>[Dev] Load saved room</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {processing && (
        <View style={styles.processingOverlay} pointerEvents="auto">
          <ActivityIndicator color="white" size="large" />
          <Text style={styles.processingText}>Finishing scan…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#000'},

  corner: {position: 'absolute', width: 28, height: 28, borderColor: 'white'},
  cornerTL: {top: 110, left: 24, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6},
  cornerTR: {top: 110, right: 24, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6},
  cornerBL: {bottom: 180, left: 24, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6},
  cornerBR: {bottom: 180, right: 24, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6},

  topOverlay: {position: 'absolute', top: 0, left: 0, right: 0},
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnSpacer: {width: 40, height: 40},
  title: {flex: 1, textAlign: 'center', color: 'white', fontSize: 17, fontWeight: '600'},

  bottomOverlay: {position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingBottom: 12},
  caption: {
    color: 'white',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 32,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },

  controlRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32, marginBottom: 12},
  sideBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  sideBtnDisabled: {opacity: 0.35},

  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {width: 60, height: 60, borderRadius: 30, backgroundColor: ACCENT},
  shutterInnerDisabled: {opacity: 0.4},

  devLink: {color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4},

  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {color: 'white', marginTop: 12, fontSize: 14},
});
