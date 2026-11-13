import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Box, Plus} from 'lucide-react-native';
import DesignService from '../../services/DesignService';
import {IDesign} from '../../../interface/design.interface';
import useRefetchOnFocus from '../../hooks/useRefetchOnFocus';
import {makeStyles, useTheme} from '../../theme/useTheme';
import {openDesign} from '../../utils/designs';
import {goBack} from '../../utils/navigation';
import {editedAgo, plural} from '../../utils/time';
import PageHeader from '../../components/shared/PageHeader';
import {IRoom} from '../../../interface/room.interface';
import {usePlan} from '../../context/PlanContext';
import {startDesignFromRoom} from '../../utils/designs';

// Every design the user has saved, most recently edited first, as a
// two-column grid (Recent Designs mockup). Tap to open; long-press for
// options: share to / remove from Explore, or delete. Designs on Explore
// carry an "On Explore" tag.
//
// With a `room` param it shows just that room's designs, with a "Design
// this room" button to start another (opened from My Rooms).
export default function RecentDesignsScreen() {
  const navigation = useNavigation<any>();
  const room: IRoom | undefined = useRoute<any>().params?.room;
  const styles = useStyles();
  const {colors} = useTheme();
  const {gate, showUpgrade} = usePlan();

  const designThisRoom = () => {
    if (!room) {
      return;
    }
    if (room.status === 'locked') {
      showUpgrade({code: 'ROOM_LOCKED'});
    } else if (gate('design.create')) {
      startDesignFromRoom(navigation, room);
    }
  };
  const [{designs, loading}, setList] = useState<{
    designs: IDesign[];
    loading: boolean;
  }>({designs: [], loading: true});

  const fetchDesigns = useCallback(async () => {
    try {
      const res = await DesignService.getDesigns();
      const mine = room
        ? res.data.filter(d => d.room_id === room.id)
        : res.data;
      const sorted = [...mine].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      setList({designs: sorted, loading: false});
      return true;
    } catch (err: any) {
      console.warn('Failed to load designs:', err?.message ?? err);
      setList(l => ({...l, loading: false}));
      return false;
    }
  }, [room]);

  useRefetchOnFocus(fetchDesigns, ['designs'], 5 * 60 * 1000);

  const confirmDelete = (design: IDesign) => {
    Alert.alert('Delete design?', `“${design.name}” will be removed.`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await DesignService.deleteDesign(design.id);
            setList(l => ({
              ...l,
              designs: l.designs.filter(d => d.id !== design.id),
            }));
          } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Failed to delete');
          }
        },
      },
    ]);
  };

  // Publish to or remove from Explore. Removing is instant and reversible;
  // sharing checks the plan first (the server checks again).
  const setPublic = async (design: IDesign, isPublic: boolean) => {
    if (isPublic && !gate('community.post')) {
      return;
    }
    const patch = (value: boolean) =>
      setList(l => ({
        ...l,
        designs: l.designs.map(d =>
          d.id === design.id ? {...d, is_public: value} : d,
        ),
      }));
    patch(isPublic);
    try {
      await DesignService.setVisibility(design.id, isPublic);
      Toast.show({
        type: 'success',
        text1: isPublic ? 'Shared to Explore' : 'Removed from Explore',
        text2: isPublic ? undefined : 'Only you can see it now.',
      });
    } catch (err: any) {
      patch(!isPublic);
      Toast.show({
        type: 'error',
        text1: isPublic
          ? 'Could not share to Explore'
          : 'Could not remove from Explore',
        text2: err?.response?.data?.message || err?.message,
      });
    }
  };

  const openOptions = (design: IDesign) =>
    Alert.alert(design.name, undefined, [
      design.is_public
        ? {
            text: 'Remove from Explore',
            onPress: () => setPublic(design, false),
          }
        : {text: 'Share to Explore', onPress: () => setPublic(design, true)},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => confirmDelete(design),
      },
      {text: 'Cancel', style: 'cancel'},
    ]);

  const renderItem = ({item: design}: {item: IDesign}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openDesign(navigation, design)}
      onLongPress={() => openOptions(design)}
      activeOpacity={0.8}
      accessibilityHint="Long-press for options">
      <View style={styles.imageWrap}>
        {design.thumbnail_url ? (
          <Image
            // Thumbnail URLs are unique per upload, so the cached copy is
            // always the right one.
            source={{uri: design.thumbnail_url, cache: 'force-cache'}}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <Box size={32} color={colors.brand} />
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.name} numberOfLines={1}>
          {design.name}
        </Text>
        <Text style={styles.edited}>{editedAgo(design.updatedAt)}</Text>
        {design.is_public ? (
          <View style={styles.tag}>
            <Text style={styles.tagText}>On Explore</Text>
          </View>
        ) : null}
        {design.room_detached_at ? (
          <View style={styles.tag}>
            <Text style={styles.tagText}>Room deleted</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <PageHeader
        title={room ? room.name : 'Recent Designs'}
        subtitle={
          room
            ? 'Every design made in this room'
            : 'Your saved inspirations and ideas'
        }
        count={loading ? undefined : plural(designs.length, 'design')}
        onBack={() => goBack(navigation)}
      />
      {room && (
        <TouchableOpacity style={styles.designButton} onPress={designThisRoom}>
          <Plus size={18} color={colors.onBrand} />
          <Text style={styles.designButtonText}>Design this room</Text>
        </TouchableOpacity>
      )}
      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : (
        <FlatList
          data={designs}
          keyExtractor={d => d.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.columns}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {room
                ? 'No designs in this room yet. Tap “Design this room” to start one.'
                : 'No designs yet. Open one of your rooms to start designing.'}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles(c => ({
  root: {flex: 1, backgroundColor: c.background},
  loader: {marginVertical: 32},
  designButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: c.brand,
  },
  designButtonText: {
    fontFamily: 'DM Sans',
    fontSize: 16,
    fontWeight: '600',
    color: c.onBrand,
  },
  list: {paddingHorizontal: 24, paddingBottom: 40, gap: 20},
  columns: {gap: 20},
  emptyText: {
    fontSize: 15,
    color: c.textMuted,
    fontFamily: 'DM Sans',
    textAlign: 'center',
    paddingVertical: 32,
  },
  card: {
    flex: 1,
    // Keeps a lone last card at half width
    maxWidth: '50%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    overflow: 'hidden',
  },
  imageWrap: {
    aspectRatio: 1.23,
    backgroundColor: c.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {width: '100%', height: '100%'},
  cardBody: {paddingHorizontal: 14, paddingTop: 12, paddingBottom: 16},
  name: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 20,
    fontWeight: '600',
    color: c.textPrimary,
  },
  edited: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    color: c.textMuted,
    marginTop: 4,
  },
  tag: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: c.surfaceMuted,
  },
  tagText: {fontFamily: 'DM Sans', fontSize: 12, color: c.textSecondary},
}));
