import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {ChevronLeft, Home, Lock, ScanLine} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import RoomService, {NewRoom} from '../services/RoomService';
import ConsentScreen from '../components/shared/ConsentScreen';
import {ROOM_DATA_CONSENT} from '../config/consent';
import {useUserContext} from '../context/UserContext';
import {IRoom} from '../../interface/room.interface';
import {makeStyles, useTheme} from '../theme/useTheme';
import {roomDesignParams} from '../utils/designs';
import {PrimaryButton} from './room_builder/ui';
import useAfterModalClose from '../hooks/useAfterModalClose';

// Where every scan and manual build ends: name the room and save it. Only
// once it's saved can the user start designing in it. A saved room can
// start any number of designs, so it never has to be scanned again.
//
// Params: the NewRoom to save, minus its name. (Written out per kind of
// room, because a plain Omit would drop the fields only one kind has.)
type WithoutName<T> = T extends unknown ? Omit<T, 'name'> : never;
export type SaveRoomParams = WithoutName<NewRoom>;

const NAME_IDEAS = ['Living room', 'Bedroom', 'Kitchen', 'Office', 'Dining room'];

export default function SaveRoomScreen() {
  const styles = useStyles();
  const {colors} = useTheme();
  const navigation = useNavigation<any>();
  const params = useRoute<any>().params as SaveRoomParams;
  const {user, giveRoomDataConsent} = useUserContext();

  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedRoom, setSavedRoom] = useState<IRoom | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const afterClose = useAfterModalClose();
  const [consentBusy, setConsentBusy] = useState(false);
  // Set once the room is saved, or the user chose to leave without it.
  const allowLeave = useRef(false);

  // The scan or build only exists on this phone until it's saved, so
  // leaving now loses it. Ask first.
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e: any) => {
        if (allowLeave.current) {
          return;
        }
        e.preventDefault();
        Alert.alert(
          'Discard this room?',
          params.source === 'scanned'
            ? 'Your scan hasn’t been saved. If you leave now you’ll need to scan again.'
            : 'Your room hasn’t been saved. If you leave now you’ll need to enter it again.',
          [
            {text: 'Keep it', style: 'cancel'},
            {
              text: 'Discard',
              style: 'destructive',
              onPress: () => {
                allowLeave.current = true;
                navigation.dispatch(e.data.action);
              },
            },
          ],
        );
      }),
    [navigation, params.source],
  );

  // Storing a room needs room-data consent. Scans asked before scanning;
  // a typed-in room may not have yet.
  if (!user?.room_data_consent_at) {
    return (
      <ConsentScreen
        icon={ScanLine}
        {...ROOM_DATA_CONSENT}
        onFootnotePress={() => navigation.navigate('PrivacyPolicy')}
        busy={consentBusy}
        onDecline={() => navigation.goBack()}
        onAccept={async () => {
          setConsentBusy(true);
          try {
            await giveRoomDataConsent();
          } catch (err: any) {
            Toast.show({
              type: 'error',
              text1: 'Could not save your choice',
              text2: err.response?.data?.message || err.message,
            });
          } finally {
            setConsentBusy(false);
          }
        }}
      />
    );
  }

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) {
      return;
    }
    setSaving(true);
    try {
      const room = await RoomService.createRoom({...params, name: trimmed} as NewRoom);
      allowLeave.current = true;
      setSavedRoom(room);
      setPopupOpen(true);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not save your room',
        text2: err.response?.data?.message || err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  // Every choice finishes the save flow, so it's cleared from the stack.
  // The popup closes first: changing screens while it's showing fails on
  // iOS.
  const leaveTo = (routes: {name: string; params?: object}[]) => {
    setPopupOpen(false);
    afterClose.run(() =>
      navigation.reset({index: routes.length - 1, routes}),
    );
  };

  const startDesigning = () =>
    savedRoom &&
    leaveTo([
      {name: 'HomeTabs'},
      {name: 'ARViewer', params: roomDesignParams(savedRoom)},
    ]);

  const seePlans = () =>
    leaveTo([
      {name: 'HomeTabs'},
      {name: 'Settings', params: {screen: 'Shopping'}},
    ]);

  const notReadyYet = () =>
    leaveTo([{name: 'HomeTabs', params: {screen: 'Design'}}]);

  const locked = savedRoom?.status === 'locked';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          accessibilityLabel="Back">
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Save your room</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View style={styles.iconWrap}>
            <Home size={30} color={colors.brand} />
          </View>
          <Text style={styles.title}>
            {params.source === 'scanned' ? 'Scan complete' : 'Room ready'}
          </Text>
          <Text style={styles.body}>
            Give your room a name. You can start as many designs from it as
            you like, without scanning or measuring again.
          </Text>

          <Text style={styles.label}>Room name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Living room"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            maxLength={80}
            returnKeyType="done"
            onSubmitEditing={save}
            autoFocus
          />
          <View style={styles.ideas}>
            {NAME_IDEAS.map(idea => (
              <TouchableOpacity
                key={idea}
                style={[styles.idea, name === idea && styles.ideaActive]}
                onPress={() => setName(idea)}>
                <Text style={styles.ideaText}>{idea}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {saving ? (
            <View style={styles.saving}>
              <ActivityIndicator color={colors.brand} />
              <Text style={styles.savingText}>Saving your room…</Text>
            </View>
          ) : (
            <PrimaryButton
              label="Save room"
              onPress={save}
              disabled={!name.trim()}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={popupOpen}
        transparent
        animationType="fade"
        onDismiss={afterClose.onDismiss}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              {locked ? (
                <Lock size={28} color={colors.brand} />
              ) : (
                <Home size={28} color={colors.brand} />
              )}
            </View>
            <Text style={styles.cardTitle}>
              {locked ? 'Room saved' : 'Room saved!'}
            </Text>
            <Text style={styles.cardBody}>
              {locked
                ? `You’ve used all the rooms on your plan. Upgrade, or delete another room, to open “${savedRoom?.name}”. It’s kept for 30 days.`
                : `Do you want to start designing “${savedRoom?.name}” now?`}
            </Text>
            {locked ? (
              <PrimaryButton label="See plans" onPress={seePlans} />
            ) : (
              <PrimaryButton label="Start designing" onPress={startDesigning} />
            )}
            <TouchableOpacity style={styles.secondary} onPress={notReadyYet}>
              <Text style={styles.secondaryText}>
                {locked ? 'Not now' : 'Not ready yet'}
              </Text>
            </TouchableOpacity>
            {!locked && (
              <Text style={styles.cardHint}>
                You’ll find it any time in Home → My Rooms.
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(c => ({
  root: {flex: 1, backgroundColor: c.background},
  flex: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 22,
    fontWeight: '600',
    color: c.textPrimary,
  },
  content: {paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32},
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: c.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 28,
    fontWeight: '600',
    color: c.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontFamily: 'DM Sans',
    fontSize: 15,
    lineHeight: 22,
    color: c.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  label: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    color: c.textSecondary,
    marginBottom: 8,
  },
  input: {
    fontFamily: 'DM Sans',
    fontSize: 16,
    color: c.textPrimary,
    borderWidth: 1,
    borderColor: c.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: c.surface,
  },
  ideas: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14},
  idea: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  ideaActive: {borderColor: c.brand, backgroundColor: c.brandSoft},
  ideaText: {fontFamily: 'DM Sans', fontSize: 14, color: c.text},
  footer: {paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8},
  saving: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  savingText: {fontFamily: 'DM Sans', fontSize: 15, color: c.textSecondary},
  backdrop: {
    flex: 1,
    backgroundColor: c.overlay,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  cardTitle: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 28,
    fontWeight: '600',
    color: c.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  cardBody: {
    fontFamily: 'DM Sans',
    fontSize: 16,
    lineHeight: 23,
    color: c.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  secondary: {alignItems: 'center', paddingVertical: 14, marginTop: 4},
  secondaryText: {fontFamily: 'DM Sans', fontSize: 16, color: c.textPrimary},
  cardHint: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    color: c.textMuted,
    textAlign: 'center',
  },
}));
