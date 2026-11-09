import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, AppState, Linking, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Camera, CameraOff, ScanLine} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import ConsentScreen from '../shared/ConsentScreen';
import {useUserContext} from '../../context/UserContext';
import {
  CAMERA_BLOCKED,
  CAMERA_CONSENT,
  CAMERA_RESTRICTED,
  ROOM_DATA_CONSENT,
} from '../../config/consent';
import {
  CameraStatus,
  getCameraStatus,
  requestCameraAccess,
} from '../../utils/cameraPermission';
import {goBack} from '../../utils/navigation';
import {makeStyles, useTheme} from '../../theme/useTheme';

// Shown in place of the scanner until it's OK to scan:
//   1. Room data — they agree to what a scan captures and stores (once,
//      saved on their account as roomDataConsentAt).
//   2. Camera — explains why, then iOS asks. If camera access is off, says
//      how to turn it on, with a manual-measurements fallback.
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

  if (!hasRoomDataConsent) {
    return (
      <ConsentScreen
        icon={ScanLine}
        {...ROOM_DATA_CONSENT}
        onFootnotePress={() => navigation.navigate('PrivacyPolicy')}
        busy={busy}
        onDecline={leave}
        onAccept={async () => {
          setGate(g => ({...g, busy: true}));
          try {
            await giveRoomDataConsent();
          } catch (err: any) {
            Toast.show({
              type: 'error',
              text1: 'Could not save your choice',
              text2: err.response?.data?.message || err.message,
            });
          } finally {
            setGate(g => ({...g, busy: false}));
          }
        }}
      />
    );
  }

  if (camera === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (camera === 'notDetermined') {
    return (
      <ConsentScreen
        icon={Camera}
        {...CAMERA_CONSENT}
        busy={busy}
        onDecline={leave}
        onAccept={async () => {
          setGate(g => ({...g, busy: true}));
          const status = await requestCameraAccess().catch(
            () => 'denied' as const,
          );
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
