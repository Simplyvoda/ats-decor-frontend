import React, {useCallback, useEffect, useState} from 'react';
import {openLegal} from '../../utils/openLegal';
import {ActivityIndicator, AppState, Linking, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {CameraOff, ScanLine} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import ConsentScreen from '../shared/ConsentScreen';
import {useUserContext} from '../../context/UserContext';
import {
  CAMERA_BLOCKED,
  CAMERA_RESTRICTED,
  SCAN_CONSENT,
} from '../../config/consent';
import {
  CameraStatus,
  getCameraStatus,
  requestCameraAccess,
} from '../../utils/cameraPermission';
import {goBack} from '../../utils/navigation';
import {makeStyles, useTheme} from '../../theme/useTheme';

// Shown in place of the scanner until it's OK to scan:
//   1. "Before you scan" — one screen explaining what a scan captures and
//      stores. "Allow camera" saves their agreement (once, on their account
//      as roomDataConsentAt) and then iOS asks for the camera.
//   2. If camera access is off, says how to turn it on, with a
//      manual-measurements fallback.
// Only then are `children` (the scanner, which starts the camera) shown.
export default function ScanConsentGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigation = useNavigation<any>();
  const {colors} = useTheme();
  const styles = useStyles();
  const {user, giveRoomDataConsent} = useUserContext();
  const [{camera, busy}, setGate] = useState<{
    camera: CameraStatus | null; // null while checking
    busy: boolean;
  }>({camera: null, busy: false});

  const hasRoomDataConsent = !!user?.room_data_consent_at;

  const refreshCamera = useCallback(() => {
    getCameraStatus()
      .then(status => setGate(g => ({...g, camera: status})))
      .catch(() => setGate(g => ({...g, camera: 'authorized'})));
  }, []);

  // Check now, and again when they come back from the Settings app.
  useEffect(() => {
    refreshCamera();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refreshCamera();
      }
    });
    return () => sub.remove();
  }, [refreshCamera]);

  const leave = () => goBack(navigation);

  if (camera === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  // Not agreed yet, or iOS hasn't asked about the camera yet: one screen
  // covers both.
  if (!hasRoomDataConsent || camera === 'notDetermined') {
    const {acceptLabelCameraAllowed, ...copy} = SCAN_CONSENT;
    return (
      <ConsentScreen
        icon={ScanLine}
        {...copy}
        acceptLabel={
          camera === 'notDetermined'
            ? SCAN_CONSENT.acceptLabel
            : acceptLabelCameraAllowed
        }
        onFootnotePress={() => openLegal('privacy')}
        busy={busy}
        onDecline={leave}
        onAccept={async () => {
          setGate(g => ({...g, busy: true}));
          try {
            if (!hasRoomDataConsent) {
              await giveRoomDataConsent();
            }
          } catch (err: any) {
            Toast.show({
              type: 'error',
              text1: 'Could not save your choice',
              text2: err.response?.data?.message || err.message,
            });
            setGate(g => ({...g, busy: false}));
            return;
          }
          const status =
            camera === 'notDetermined'
              ? await requestCameraAccess().catch(() => 'denied' as const)
              : camera;
          setGate({camera: status, busy: false});
        }}
      />
    );
  }

  if (camera !== 'authorized') {
    return (
      <ConsentScreen
        icon={CameraOff}
        {...(camera === 'restricted' ? CAMERA_RESTRICTED : CAMERA_BLOCKED)}
        onAccept={
          camera === 'restricted' ? leave : () => Linking.openSettings()
        }
        declineLabel="Enter measurements instead"
        onDecline={() => navigation.replace('RoomBuilder')}
      />
    );
  }

  return <>{children}</>;
}

const useStyles = makeStyles(c => ({
  loading: {flex: 1, justifyContent: 'center', backgroundColor: c.background},
}));
