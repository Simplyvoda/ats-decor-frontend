import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  LayoutPanelTop,
  Lock,
  LucideIcon,
  MoreHorizontal,
  Plus,
  Ruler,
  ScanLine,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import RoomService from '../../services/RoomService';
import DesignService from '../../services/DesignService';
import {IRoom, RoomSource} from '../../../interface/room.interface';
import {IDesign} from '../../../interface/design.interface';
import useRefetchOnFocus from '../../hooks/useRefetchOnFocus';
import {makeStyles, useTheme} from '../../theme/useTheme';
import {startDesignFromRoom} from '../../utils/designs';
import {goBack, navigateTo} from '../../utils/navigation';
import {editedAgo, plural} from '../../utils/time';
import PageHeader from '../../components/shared/PageHeader';
import {usePlan} from '../../context/PlanContext';
import {usageLine} from '../../config/plans';

const SOURCE: Record<RoomSource, {label: string; icon: LucideIcon}> = {
  scanned: {label: 'Scanned', icon: ScanLine},
  manual: {label: 'Measured', icon: Ruler},
  template: {label: 'Template', icon: LayoutPanelTop},
};

const errorText = (err: any) => err?.response?.data?.message || err?.message;

// A room plus what the list shows about it: its most recent design (for
// the picture and "continue where you left"), and when it was last edited.
type RoomRow = {room: IRoom; latest: IDesign | null; editedAt: string};

const latestTime = (a: string, b: string) =>
  new Date(a).getTime() >= new Date(b).getTime() ? a : b;

// The user's saved rooms (My Rooms mockup). Tapping a room opens its
// designs, with "Design this room" to start another. Each room can start
// any number of designs, so it's scanned or measured only once.
export default function MyRoomsScreen() {
  const navigation = useNavigation<any>();
  const styles = useStyles();
  const {colors} = useTheme();
  const {usage, gate, showUpgrade} = usePlan();
  const [{rooms, designs, loading}, setData] = useState<{
    rooms: IRoom[];
    designs: IDesign[];
    loading: boolean;
  }>({rooms: [], designs: [], loading: true});
  const [renaming, setRenaming] = useState<IRoom | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      const [roomRes, designRes] = await Promise.all([
        RoomService.getRooms(),
        DesignService.getDesigns(),
      ]);
      setData({rooms: roomRes.data, designs: designRes.data, loading: false});
      return true;
    } catch (err: any) {
      console.warn('Failed to load rooms:', errorText(err));
      setData(d => ({...d, loading: false}));
      return false;
    }
  }, []);

  useRefetchOnFocus(fetchRooms, ['rooms', 'designs'], 5 * 60 * 1000);

  // Most recently edited first, by the room or any of its designs.
  const rows: RoomRow[] = useMemo(() => {
    const latestByRoom = new Map<string, IDesign>();
    for (const d of designs) {
      const current = d.room_id ? latestByRoom.get(d.room_id) : undefined;
      if (d.room_id && (!current || d.updatedAt > current.updatedAt)) {
        latestByRoom.set(d.room_id, d);
      }
    }
    return rooms
      .map(room => {
        const latest = latestByRoom.get(room.id) ?? null;
        return {
          room,
          latest,
          editedAt: latest
            ? latestTime(room.updatedAt, latest.updatedAt)
            : room.updatedAt,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.editedAt).getTime() - new Date(a.editedAt).getTime(),
      );
  }, [rooms, designs]);

  // "2 of 3 rooms used" once plan limits are on, else "3 rooms"
  const roomUsage = usage?.enforced
    ? usageLine('room.active', usage.features['room.active'])
    : null;

  // Runs a change to one room, showing a spinner on its row.
  const run = async (
    room: IRoom,
    action: () => Promise<unknown>,
    done: string,
  ) => {
    setBusyId(room.id);
    try {
      await action();
      await fetchRooms();
      Toast.show({type: 'success', text1: done});
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
        text2: errorText(err),
      });
    } finally {
      setBusyId(null);
    }
  };

  const showLocked = () =>
    showUpgrade({code: 'ROOM_LOCKED', feature: undefined});

  const startNewDesign = (room: IRoom) => {
    if (room.status === 'locked') {
      showLocked();
      return;
    }
    if (gate('design.create')) {
      startDesignFromRoom(navigation, room);
    }
  };

  const seeDesigns = (room: IRoom) => {
    if (room.status === 'locked') {
      showLocked();
    } else {
      navigateTo(navigation, 'RecentDesigns', {room});
    }
  };

  // ── Delete (FRD 1.4) ──
  // No designs: a normal confirmation. With designs: delete them too
  // (confirmed twice, naming the count), or keep them detached.
  const confirmDelete = (room: IRoom) => {
    const n = room.design_count;
    const designsText = plural(n, 'design');
    if (n === 0) {
      Alert.alert('Delete room?', `“${room.name}” will be removed.`, [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            run(room, () => RoomService.deleteRoom(room.id), 'Room deleted'),
        },
      ]);
      return;
    }
    Alert.alert(`This room has ${designsText}`, 'What should happen to them?', [
      {
        text: 'Keep designs',
        onPress: () =>
          run(
            room,
            () => RoomService.deleteRoom(room.id, 'keep'),
            'Room deleted. Your designs were kept.',
          ),
      },
      {
        text: 'Delete room and designs',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            `Delete ${designsText}?`,
            `“${room.name}” and its ${designsText} will be deleted. This can’t be undone.`,
            [
              {text: 'Cancel', style: 'cancel'},
              {
                text: `Delete ${designsText}`,
                style: 'destructive',
                onPress: () =>
                  run(
                    room,
                    () => RoomService.deleteRoom(room.id, 'delete'),
                    'Room and designs deleted',
                  ),
              },
            ],
          ),
      },
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  const openMenu = (room: IRoom) => {
    const options: {
      text: string;
      style?: 'cancel' | 'destructive';
      onPress?: () => void;
    }[] = [
      {text: 'Design this room', onPress: () => startNewDesign(room)},
      {
        text: `See designs (${room.design_count})`,
        onPress: () => seeDesigns(room),
      },
      {text: 'Rename', onPress: () => setRenaming(room)},
    ];
    if (room.source === 'manual' && room.spec) {
      options.push({
        text: 'Edit dimensions',
        onPress: () => navigateTo(navigation, 'RoomBuilder', {editRoom: room}),
      });
    }
    if (room.previous_model_path) {
      options.push({
        text: 'Undo last edit',
        onPress: () =>
          run(room, () => RoomService.undo(room.id), 'Last edit undone'),
      });
    }
    options.push(
      {text: 'Delete', style: 'destructive', onPress: () => confirmDelete(room)},
      {text: 'Cancel', style: 'cancel'},
    );
    Alert.alert(room.name, undefined, options);
  };

  const renderRow = ({item}: {item: RoomRow}) => {
    const {room, latest, editedAt} = item;
    const source = SOURCE[room.source];
    const SourceIcon = source.icon;
    const picture = latest?.thumbnail_url ?? room.thumbnail_url;
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => seeDesigns(room)}
        activeOpacity={0.7}>
        <View style={styles.thumb}>
          {picture ? (
            <Image
              source={{uri: picture, cache: 'force-cache'}}
              style={styles.thumbImage}
              resizeMode="cover"
            />
          ) : (
            <SourceIcon size={30} color={colors.brand} />
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {room.name}
          </Text>
          <Text style={styles.meta}>
            {source.label} · {plural(room.design_count, 'design')}
          </Text>
          <Text style={styles.meta}>{editedAgo(editedAt)}</Text>
          {room.status === 'locked' && (
            <View style={styles.lockedTag}>
              <Lock size={12} color={colors.brand} />
              <Text style={styles.lockedText}>Locked</Text>
            </View>
          )}
        </View>
        {busyId === room.id ? (
          <ActivityIndicator color={colors.brand} />
        ) : (
          <TouchableOpacity
            onPress={() => openMenu(room)}
            accessibilityLabel={`Options for ${room.name}`}
            hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
            <MoreHorizontal size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <PageHeader
        title="My Rooms"
        subtitle="Continue where you left off"
        count={
          loading
            ? undefined
            : roomUsage
              ? `${roomUsage} used`
              : plural(rooms.length, 'room')
        }
        onBack={() => goBack(navigation)}
      />
      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={r => r.room.id}
          renderItem={renderRow}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No rooms yet</Text>
              <Text style={styles.emptyText}>
                Scan a room or enter its measurements once, then start as many
                designs from it as you like.
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() =>
                  navigation.navigate('HomeTabs', {screen: 'Design'})
                }>
                <Plus size={16} color={colors.onBrand} />
                <Text style={styles.addButtonText}>Add a room</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <RenameModal
        room={renaming}
        onClose={() => setRenaming(null)}
        onSave={(room, name) => {
          setRenaming(null);
          run(room, () => RoomService.rename(room.id, name), 'Room renamed');
        }}
      />
    </SafeAreaView>
  );
}

function RenameModal({
  room,
  onClose,
  onSave,
}: {
  room: IRoom | null;
  onClose: () => void;
  onSave: (room: IRoom, name: string) => void;
}) {
  const styles = useStyles();
  const {colors} = useTheme();
  const [name, setName] = useState('');

  return (
    <Modal
      visible={room !== null}
      transparent
      animationType="fade"
      onShow={() => setName(room?.name ?? '')}
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Rename room</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholderTextColor={colors.textMuted}
            maxLength={80}
            autoFocus
            selectTextOnFocus
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalSecondary} onPress={onClose}>
              <Text style={styles.modalSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalPrimary, !name.trim() && styles.disabled]}
              disabled={!name.trim()}
              onPress={() => room && onSave(room, name.trim())}>
              <Text style={styles.addButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = makeStyles(c => ({
  root: {flex: 1, backgroundColor: c.background},
  loader: {marginVertical: 32},
  list: {paddingHorizontal: 24, paddingBottom: 40, gap: 26},
  row: {flexDirection: 'row', alignItems: 'flex-start'},
  thumb: {
    width: 98,
    height: 84,
    borderRadius: 12,
    backgroundColor: c.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 14,
  },
  thumbImage: {width: '100%', height: '100%'},
  info: {flex: 1, marginRight: 8},
  name: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 22,
    fontWeight: '600',
    color: c.textPrimary,
    marginBottom: 4,
  },
  meta: {
    fontFamily: 'DM Sans',
    fontSize: 15,
    lineHeight: 21,
    color: c.textMuted,
  },
  lockedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: c.brandSoft,
  },
  lockedText: {fontFamily: 'DM Sans', fontSize: 12, color: c.brand},
  empty: {alignItems: 'stretch', paddingVertical: 32},
  emptyTitle: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 24,
    fontWeight: '600',
    color: c.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'DM Sans',
    fontSize: 15,
    lineHeight: 22,
    color: c.textSecondary,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: c.brand,
  },
  addButtonText: {
    fontFamily: 'DM Sans',
    fontSize: 15,
    fontWeight: '600',
    color: c.onBrand,
  },
  backdrop: {
    flex: 1,
    backgroundColor: c.overlay,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {backgroundColor: c.surface, borderRadius: 20, padding: 24},
  modalTitle: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 24,
    fontWeight: '600',
    color: c.textPrimary,
    marginBottom: 16,
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
  },
  modalButtons: {flexDirection: 'row', gap: 12, marginTop: 20},
  modalSecondary: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.borderStrong,
  },
  modalSecondaryText: {fontFamily: 'DM Sans', fontSize: 15, color: c.text},
  modalPrimary: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: c.brand,
  },
  disabled: {opacity: 0.5},
}));
