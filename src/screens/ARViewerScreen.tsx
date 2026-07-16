import {ChevronLeft, Eye, MoreVertical, NotebookPen, RotateCcw, Settings, X} from 'lucide-react-native';
import React, {useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import RealityKitNativeView, {
  loadFurnitureCommand,
  resetCameraCommand,
  toggleTopViewCommand,
} from '../components/RoomScanner/RealityKitView.native';
import {images} from '../../assets/constants/images';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const SHEET_PEEK = 72;
const SHEET_OPEN = SCREEN_HEIGHT * 0.48;

// ─── Furniture catalogue ───────────────────────────────────────────────────
// thumbnails: swap in real images once you have them.
// modelUrl:   "bundle://filename.usdz" for bundled test assets,
//             or a full https:// URL once they're on the backend.

type FurnitureItem = {
  id: string;
  name: string;
  thumbnail: any;
  modelUrl: string;
};

type FurnitureCategory = {
  id: string;
  name: string;
  items: FurnitureItem[];
};

const CATALOGUE: FurnitureCategory[] = [
  // Only visible in dev builds (__DEV__ = false in production)
  ...(__DEV__
    ? [
        {
          id: 'dev-assets',
          name: '🧪 Test Assets',
          items: [
            {
              id: 'dev-sofa',
              name: 'Test Sofa',
              thumbnail: images.scan_room_icon,
              modelUrl: 'bundle://test_chair.usdz',
            },
          ],
        },
      ]
    : []),
  {
    id: 'bed-frames',
    name: 'Bed Frames',
    items: [
      {
        id: 'bed-1',
        name: 'Classic Bed',
        thumbnail: images.choose_model,
        modelUrl: 'bundle://classic_bed.usdz',
      },
      {
        id: 'bed-2',
        name: 'Platform Bed',
        thumbnail: images.choose_model,
        modelUrl: 'bundle://platform_bed.usdz',
      },
      {
        id: 'bed-3',
        name: 'Timber Bed',
        thumbnail: images.choose_model,
        modelUrl: 'bundle://timber_bed.usdz',
      },
    ],
  },
  {
    id: 'sofas',
    name: 'Sofas',
    items: [
      {
        id: 'sofa-1',
        name: '3-Seater',
        thumbnail: images.scan_room_icon,
        modelUrl: 'bundle://sofa_3seater.usdz',
      },
      {
        id: 'sofa-2',
        name: 'L-Shape',
        thumbnail: images.scan_room_icon,
        modelUrl: 'bundle://sofa_lshape.usdz',
      },
    ],
  },
  {
    id: 'tables',
    name: 'Tables',
    items: [
      {
        id: 'table-1',
        name: 'Coffee Table',
        thumbnail: images.scan_room_icon,
        modelUrl: 'bundle://coffee_table.usdz',
      },
    ],
  },
  {
    id: 'chairs',
    name: 'Chairs',
    items: [
      {
        id: 'chair-1',
        name: 'Armchair',
        thumbnail: images.scan_room_icon,
        modelUrl: 'bundle://armchair.usdz',
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────

export default function ARViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const modelUrl: string = route.params?.modelUrl ?? '';

  const realityKitRef = useRef(null);
  const [activeCategory, setActiveCategory] =
    useState<FurnitureCategory | null>(null);
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  const sheetAnim = useRef(new Animated.Value(SHEET_PEEK)).current;
  const isExpanded = useRef(false);

  const snapSheet = (open: boolean) => {
    isExpanded.current = open;
    Animated.spring(sheetAnim, {
      toValue: open ? SHEET_OPEN : SHEET_PEEK,
      useNativeDriver: false,
      bounciness: 3,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        const base = isExpanded.current ? SHEET_OPEN : SHEET_PEEK;
        sheetAnim.setValue(
          Math.max(SHEET_PEEK, Math.min(SHEET_OPEN, base - g.dy)),
        );
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -40) {
          snapSheet(true);
        } else if (g.dy > 40) {
          snapSheet(false);
        } else {
          snapSheet(!isExpanded.current);
        }
      },
    }),
  ).current;

  const handleSelectItem = (item: FurnitureItem) => {
    loadFurnitureCommand(realityKitRef, item.modelUrl);
  };

  const handleSelectCategory = (cat: FurnitureCategory) => {
    setActiveCategory(cat);
    snapSheet(true);
  };

  const handleBackFromCategory = () => {
    setActiveCategory(null);
  };

  const handleCloseSheet = () => {
    setActiveCategory(null);
    snapSheet(false);
  };

  const renderFurnitureItem = ({item}: {item: FurnitureItem}) => (
    <TouchableOpacity
      style={styles.furnitureItem}
      onPress={() => handleSelectItem(item)}
      activeOpacity={0.7}>
      <Image source={item.thumbnail} style={styles.furnitureThumbnail} />
      <Text style={styles.furnitureName} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderCategoryRow = (cat: FurnitureCategory) => (
    <TouchableOpacity
      key={cat.id}
      style={styles.categoryRow}
      onPress={() => handleSelectCategory(cat)}
      activeOpacity={0.7}>
      <Text style={styles.categoryName}>{cat.name}</Text>
      <Text style={styles.categoryCount}>{cat.items.length} items</Text>
      <ChevronLeft
        style={{transform: [{rotate: '180deg'}]}}
        size={18}
        color="#999"
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* ── Full-screen AR view ── */}
      <RealityKitNativeView
        ref={realityKitRef}
        modelUrl={modelUrl}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Top overlay ── */}
      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.topRow} pointerEvents="box-none">
          {/* Back */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}>
            <ChevronLeft color="white" size={24} />
          </TouchableOpacity>

          {/* Right side: tool card + reset */}
          <View style={styles.rightSide} pointerEvents="box-none">
            <View style={styles.toolCard}>
              <TouchableOpacity
                style={styles.toolBtn}
                onPress={() => toggleTopViewCommand(realityKitRef)}>
                <Eye color="#C4A962" size={20} />
              </TouchableOpacity>
              <View style={styles.toolDivider} />
              <TouchableOpacity style={styles.toolBtn}>
                <Settings color="#C4A962" size={20} />
              </TouchableOpacity>
              <View style={styles.toolDivider} />
              <TouchableOpacity
                style={styles.toolBtn}
                onPress={() => setShowToolsMenu(v => !v)}>
                <MoreVertical color="#C4A962" size={20} />
              </TouchableOpacity>
            </View>

            {/* 3-dot dropdown menu */}
            {showToolsMenu && (
              <View style={styles.toolsMenu}>
                <TouchableOpacity
                  style={styles.toolsMenuItem}
                  onPress={() => {
                    setShowToolsMenu(false);
                    navigation.navigate('CreateNote' as never);
                  }}>
                  <NotebookPen color="#C4A962" size={18} />
                  <Text style={styles.toolsMenuText}>Notes</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => resetCameraCommand(realityKitRef)}>
              <RotateCcw color="#333" size={18} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Bottom sheet ── */}
      <Animated.View style={[styles.sheet, {height: sheetAnim}]}>
        {/* Drag handle */}
        <View style={styles.handleArea} {...panResponder.panHandlers}>
          <View style={styles.handle} />
        </View>

        {activeCategory ? (
          // ── Furniture grid ──
          <>
            <View style={styles.sheetHeader}>
              <TouchableOpacity
                onPress={handleBackFromCategory}
                hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
                <ChevronLeft color="#333" size={22} />
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>{activeCategory.name}</Text>
              <TouchableOpacity
                onPress={handleCloseSheet}
                hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
                <X color="#333" size={22} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={activeCategory.items}
              keyExtractor={i => i.id}
              renderItem={renderFurnitureItem}
              numColumns={3}
              contentContainerStyle={styles.furnitureGrid}
              showsVerticalScrollIndicator={false}
            />
          </>
        ) : (
          // ── Category list ──
          <>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Furniture</Text>
              <TouchableOpacity
                onPress={handleCloseSheet}
                hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
                <X color="#333" size={22} />
              </TouchableOpacity>
            </View>
            {CATALOGUE.map(renderCategoryRow)}
          </>
        )}
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const ITEM_SIZE = (Dimensions.get('window').width - 48) / 3;

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#000'},

  // Top overlay
  topOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  rightSide: {alignItems: 'center', gap: 10},
  toolCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  toolBtn: {width: 44, height: 40, alignItems: 'center', justifyContent: 'center'},
  toolDivider: {height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 8},
  toolsMenu: {
    backgroundColor: 'white',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  toolsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toolsMenuText: {fontSize: 15, color: '#333', marginLeft: 10},
  resetBtn: {
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

  // Sheet
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e0',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },

  // Category list
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  categoryName: {fontSize: 15, color: '#1a1a1a', flex: 1},
  categoryCount: {fontSize: 13, color: '#999', marginRight: 8},

  // Furniture grid
  furnitureGrid: {paddingHorizontal: 12, paddingBottom: 20},
  furnitureItem: {
    width: ITEM_SIZE,
    margin: 4,
    alignItems: 'center',
  },
  furnitureThumbnail: {
    width: ITEM_SIZE - 8,
    height: ITEM_SIZE - 8,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    resizeMode: 'contain',
  },
  furnitureName: {
    fontSize: 11,
    color: '#444',
    textAlign: 'center',
    marginTop: 4,
  },
});
