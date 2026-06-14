// view moodboards screen
import React, {useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {ChevronLeft, Grid3x3, Heart, AlignJustify, Plus} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {goBack} from '../../../utils/navigation';

type ViewMode = 'grid' | 'list';
type Filter = 'All' | 'Furniture';

interface MoodItem {
  id: number;
  title: string;
  style: string;
  description: string;
  liked: boolean;
}

const MOCK_ITEMS: MoodItem[] = [
  {id: 1, title: 'Bohemian Living Room', style: 'Artistic', description: 'Perfect for artist', liked: true},
  {id: 2, title: 'Bohemian Living Room', style: 'Artistic', description: 'Perfect for artist', liked: false},
  {id: 3, title: 'Bohemian Living Room', style: 'Artistic', description: 'Perfect for artist', liked: true},
];

const ViewMoodboards = () => {
  const navigation = useNavigation();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeFilter, setActiveFilter] = useState<Filter>('All');

  const filters: Filter[] = ['All', 'Furniture'];

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
            <Text style={styles.itemCount}>{MOCK_ITEMS.length} Items Saved</Text>
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
            <TouchableOpacity style={styles.filterChip}>
              <Plus size={14} color="#2C2C2C" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Item list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}>
        {MOCK_ITEMS.map(item => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.imageWrapper}>
              <View style={styles.imagePlaceholder} />
              <TouchableOpacity style={styles.heartBtn} activeOpacity={0.8}>
                <Heart
                  size={16}
                  color="#C1A36A"
                  fill={item.liked ? '#C1A36A' : 'transparent'}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemStyle}>{item.style}</Text>
              <Text style={styles.itemDesc}>{item.description}</Text>
            </View>
          </View>
        ))}
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
  itemCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#2C2C2C20',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    height: 110,
  },
  imageWrapper: {
    width: 120,
    position: 'relative',
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
