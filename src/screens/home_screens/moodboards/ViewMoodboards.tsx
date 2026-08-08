// view moodboards screen
import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {ChevronLeft, Grid3x3, Heart, AlignJustify} from 'lucide-react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {goBack, navigateTo} from '../../../utils/navigation';
import MoodboardService from '../../../services/MoodboardService';
import DesignService from '../../../services/DesignService';
import {IMoodboardItem} from '../../../../interface/design.interface';

type ViewMode = 'grid' | 'list';

const ViewMoodboards = () => {
  const navigation = useNavigation();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [items, setItems] = useState<IMoodboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMoodboard = useCallback(async () => {
    try {
      const res = await MoodboardService.getMoodboard();
      setItems(res.data);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not load moodboard',
        text2: err.response?.data?.message || err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMoodboard();
    }, [fetchMoodboard]),
  );

  const handleUnlike = async (item: IMoodboardItem) => {
    // Optimistic removal
    setItems(prev => prev.filter(i => i.id !== item.id));
    try {
      await MoodboardService.unlike(item.design_id);
    } catch {
      setItems(prev => [item, ...prev]);
      Toast.show({type: 'error', text1: 'Could not remove item'});
    }
  };

  const openDesign = (item: IMoodboardItem) => {
    if (!item.design?.file_url) {
      return;
    }
    DesignService.addView(item.design_id).catch(() => {});
    navigateTo(navigation, 'ARViewer', {
      modelUrl: item.design.file_url,
      designId: item.design_id,
    });
  };

  // Filters: All + styles found in saved items
  const styleFilters = Array.from(
    new Set(items.map(i => i.design?.style).filter(Boolean)),
  ) as string[];
  const filters = ['All', ...styleFilters];

  const visibleItems =
    activeFilter === 'All'
      ? items
      : items.filter(i => i.design?.style === activeFilter);

  const renderCard = (item: IMoodboardItem, grid: boolean) => (
    <TouchableOpacity
      key={item.id}
      style={grid ? styles.gridCard : styles.itemCard}
      activeOpacity={0.85}
      onPress={() => openDesign(item)}>
      <View style={grid ? styles.gridImageWrapper : styles.imageWrapper}>
        {item.design?.thumbnail_url ? (
          <Image
            source={{uri: item.design.thumbnail_url}}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
        <TouchableOpacity
          style={styles.heartBtn}
          activeOpacity={0.8}
          onPress={() => handleUnlike(item)}>
          <Heart size={16} color="#C1A36A" fill="#C1A36A" />
        </TouchableOpacity>
      </View>
      <View style={grid ? styles.gridItemInfo : styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.design?.name ?? 'Design'}
        </Text>
        {item.design?.style ? (
          <Text style={styles.itemStyle}>{item.design.style}</Text>
        ) : null}
        {item.design?.tags && item.design.tags.length > 0 ? (
          <Text style={styles.itemDesc} numberOfLines={1}>
            {item.design.tags.map(t => t.name).join(' · ')}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.root}>
      {/* Gold header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backRow} onPress={() => goBack(navigation)}>
            <ChevronLeft size={22} color="#fff" />
            <Text style={styles.headerTitle}>Mood Board</Text>
          </TouchableOpacity>
          <Text style={styles.headerSubtitle}>Your saved inspirations and Ideas</Text>
        </View>

        {/* Overlapping white info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardTop}>
            <Text style={styles.itemCount}>
              {items.length} Item{items.length === 1 ? '' : 's'} Saved
            </Text>
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}
                onPress={() => setViewMode('grid')}>
                <Grid3x3 size={18} color={viewMode === 'grid' ? '#fff' : '#2C2C2C'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
                onPress={() => setViewMode('list')}>
                <AlignJustify size={18} color={viewMode === 'list' ? '#fff' : '#2C2C2C'} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {filters.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                  onPress={() => setActiveFilter(f)}>
                  <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Item list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#C1A36A" />
          </View>
        ) : visibleItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Heart size={40} color="#8A8A8A" strokeWidth={1.4} />
            <Text style={styles.emptyTitle}>No saved items yet</Text>
            <Text style={styles.emptyText}>
              Tap the heart on designs in Explore to save them here
            </Text>
          </View>
        ) : viewMode === 'grid' ? (
          <View style={styles.gridWrap}>
            {visibleItems.map(item => renderCard(item, true))}
          </View>
        ) : (
          visibleItems.map(item => renderCard(item, false))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const CARD_HEIGHT = 128;
const CARD_OVERLAP = 56;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    backgroundColor: '#C1A36A',
    paddingTop: 16,
    height: 160,
    zIndex: 1,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  headerTitle: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 22,
    color: '#fff',
    fontWeight: '600',
  },
  headerSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    position: 'absolute',
    bottom: -CARD_OVERLAP,
    left: 0,
    right: 0,
    height: CARD_HEIGHT,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  infoCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  itemCount: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 20,
    color: '#2C2C2C',
    fontWeight: '600',
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2C2C2C20',
    padding: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#C1A36A',
    borderColor: '#C1A36A',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2C2C2C33',
    paddingHorizontal: 14,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#C1A36A',
    borderColor: '#C1A36A',
  },
  filterChipText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#2C2C2C',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  list: {
    marginTop: CARD_OVERLAP + 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 12,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: '#E5E0D5',
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 20,
    color: '#2C2C2C',
    marginTop: 12,
  },
  emptyText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: '#7A7A7A',
    marginTop: 6,
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#2C2C2C20',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    height: 110,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#2C2C2C20',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  imageWrapper: {
    width: 120,
    position: 'relative',
  },
  gridImageWrapper: {
    width: '100%',
    aspectRatio: 1.2,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D8CBBA',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffffffcc',
    borderRadius: 20,
    padding: 5,
  },
  itemInfo: {
    flex: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
    gap: 2,
  },
  gridItemInfo: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  itemTitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  itemStyle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#888',
  },
  itemDesc: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: '#BDBDBD',
  },
});

export default ViewMoodboards;
