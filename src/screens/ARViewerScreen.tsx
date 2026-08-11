import {ChevronLeft, Eye, Globe, MoreVertical, NotebookPen, RotateCcw, Save, Trash2, X} from 'lucide-react-native';
import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  PanResponder,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Dropdown} from 'react-native-element-dropdown';
import Toast from 'react-native-toast-message';
import RealityKitNativeView, {
  captureSnapshotCommand,
  loadFurnitureCommand,
  removeSelectedFurnitureCommand,
  resetCameraCommand,
  toggleTopViewCommand,
} from '../components/RoomScanner/RealityKitView.native';
import DesignService from '../services/DesignService';
import FurnitureService from '../services/FurnitureService';
import NoteService from '../services/NoteService';
import {IFurniture} from '../../interface/furniture.interface';
import {images} from '../../assets/constants/images';

const STYLE_PRESETS = [
  'Minimalist',
  'Bohemian',
  'Modern',
  'Rustic',
  'Artistic',
  'Scandinavian',
].map(s => ({label: s, value: s}));

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

// Bundled dev asset — always available even without a backend
const DEV_CATALOGUE: FurnitureCategory[] = __DEV__
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
  : [];

// Group the flat /furniture list into catalogue sections
const buildCatalogue = (items: IFurniture[]): FurnitureCategory[] => {
  const byCategory = new Map<string, FurnitureItem[]>();
  items.forEach(f => {
    const entry: FurnitureItem = {
      id: f.id,
      name: f.name,
      thumbnail: f.thumbnail_url
        ? {uri: f.thumbnail_url}
        : images.scan_room_icon,
      modelUrl: f.model_url,
    };
    const list = byCategory.get(f.category) ?? [];
    list.push(entry);
    byCategory.set(f.category, list);
  });
  return Array.from(byCategory, ([name, categoryItems]) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    items: categoryItems,
  }));
};

// ─── Component ────────────────────────────────────────────────────────────

export default function ARViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const modelUrl: string = route.params?.modelUrl ?? '';
  // Known when opened from Explore/Moodboard, or set after publishing —
  // notes taken here attach to this design automatically
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(
    route.params?.designId ?? null,
  );

  const realityKitRef = useRef(null);
  const [activeCategory, setActiveCategory] =
    useState<FurnitureCategory | null>(null);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [furnitureSelected, setFurnitureSelected] = useState(false);
  const [catalogue, setCatalogue] = useState<FurnitureCategory[]>(DEV_CATALOGUE);

  useEffect(() => {
    FurnitureService.getFurniture()
      .then(res => setCatalogue([...DEV_CATALOGUE, ...buildCatalogue(res.data)]))
      .catch(() => {
        // Backend unreachable — dev assets (if any) remain usable
      });
  }, []);

  // ── Publish design state ──
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [pubName, setPubName] = useState('');
  const [pubStyle, setPubStyle] = useState<string | null>(null);
  const [pubTags, setPubTags] = useState<string[]>([]);
  const [pubTagInput, setPubTagInput] = useState('');
  const [pubIsPublic, setPubIsPublic] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Fresh scans aren't saved automatically — nudge the user once
  useEffect(() => {
    if (route.params?.fromScan) {
      Toast.show({
        type: 'info',
        text1: 'Scan ready',
        text2: 'Use ⋮ → Save design to keep it (with a thumbnail)',
        visibilityTime: 5000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const snapshotCallback = useRef<
    ((result: {path?: string; error?: string}) => void) | null
  >(null);

  const handleSnapshotReady = (e: {
    nativeEvent: {path?: string; error?: string};
  }) => {
    snapshotCallback.current?.(e.nativeEvent);
    snapshotCallback.current = null;
  };

  const addPubTag = () => {
    const t = pubTagInput.trim().toLowerCase();
    if (t && !pubTags.includes(t)) {
      setPubTags(prev => [...prev, t]);
    }
    setPubTagInput('');
  };

  const handlePublish = () => {
    if (!pubName.trim() || isPublishing) {
      return;
    }
    setIsPublishing(true);

    snapshotCallback.current = async ({path, error}) => {
      if (error || !path) {
        Toast.show({type: 'error', text1: 'Could not capture thumbnail'});
        setIsPublishing(false);
        return;
      }
      try {
        const res = await DesignService.publish({
          name: pubName.trim(),
          style: pubStyle ?? undefined,
          tags: pubTags,
          isPublic: pubIsPublic,
          thumbnailPath: path,
          modelUrl,
        });
        setCurrentDesignId(res.data.id);
        Toast.show({
          type: 'success',
          text1: pubIsPublic ? 'Published to Explore' : 'Design saved',
        });
        setShowPublishModal(false);
        setPubName('');
        setPubStyle(null);
        setPubTags([]);

        // Attach any note jotted before this design had an id
        const draft = await NoteService.getDraftNote();
        if (draft) {
          try {
            await NoteService.createNote({...draft, project_id: res.data.id});
          } catch {
            // Best-effort — the design save itself already succeeded
          } finally {
            await NoteService.clearDraftNote();
          }
        }
      } catch (err: any) {
        Toast.show({
          type: 'error',
          text1: 'Publish failed',
          text2: err.response?.data?.message || err.message,
        });
      } finally {
        setIsPublishing(false);
      }
    };

    captureSnapshotCommand(realityKitRef);
  };

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
    handleCloseSheet();
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
        onSnapshotReady={handleSnapshotReady}
        onFurnitureSelectionChanged={e =>
          setFurnitureSelected(e.nativeEvent.selected)
        }
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
                    (navigation as any).navigate('CreateNote', {
                      projectId: currentDesignId ?? undefined,
                      fromARViewer: true,
                    });
                  }}>
                  <NotebookPen color="#C4A962" size={18} />
                  <Text style={styles.toolsMenuText}>Notes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toolsMenuItem}
                  onPress={() => {
                    setShowToolsMenu(false);
                    setShowPublishModal(true);
                  }}>
                  <Save color="#C4A962" size={18} />
                  <Text style={styles.toolsMenuText}>Save design</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => resetCameraCommand(realityKitRef)}>
              <RotateCcw color="#333" size={18} />
            </TouchableOpacity>

            {/* Delete selected furniture */}
            {furnitureSelected && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => removeSelectedFurnitureCommand(realityKitRef)}>
                <Trash2 color="#D21616" size={18} />
              </TouchableOpacity>
            )}
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
            {catalogue.length === 0 ? (
              <Text style={styles.emptyCatalogue}>
                No furniture available yet
              </Text>
            ) : (
              catalogue.map(renderCategoryRow)
            )}
          </>
        )}
      </Animated.View>

      {/* ── Publish design modal ── */}
      <Modal
        visible={showPublishModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPublishModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Save design</Text>
              <TouchableOpacity
                onPress={() => setShowPublishModal(false)}
                hitSlop={10}>
                <X color="#333" size={22} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={pubName}
              onChangeText={setPubName}
              placeholder="Design name..."
              placeholderTextColor="#999"
              style={styles.modalInput}
            />

            <Dropdown
              data={STYLE_PRESETS}
              labelField="label"
              valueField="value"
              value={pubStyle}
              onChange={item => setPubStyle(item.value)}
              placeholder="Style (Optional)"
              placeholderStyle={{color: '#999', fontSize: 14}}
              selectedTextStyle={{color: '#2C2C2C', fontSize: 14}}
              style={styles.modalDropdown}
            />

            {pubTags.length > 0 && (
              <View style={styles.tagRow}>
                {pubTags.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    onPress={() =>
                      setPubTags(pubTags.filter(t => t !== tag))
                    }
                    style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                    <X size={12} color="#7A7A7A" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TextInput
              value={pubTagInput}
              onChangeText={setPubTagInput}
              onSubmitEditing={addPubTag}
              onBlur={addPubTag}
              placeholder="Add a tag and press return"
              placeholderTextColor="#999"
              autoCapitalize="none"
              style={styles.modalInput}
            />

            <View style={styles.publicRow}>
              <View style={{flex: 1}}>
                <Text style={styles.publicLabel}>Share to Explore</Text>
                <Text style={styles.publicHint}>
                  {pubIsPublic
                    ? 'Everyone can see this design'
                    : 'Only you can see this design'}
                </Text>
              </View>
              <Switch
                value={pubIsPublic}
                onValueChange={setPubIsPublic}
                trackColor={{true: '#C4A962', false: '#E5E0D5'}}
                thumbColor="white"
              />
            </View>

            <TouchableOpacity
              onPress={handlePublish}
              disabled={!pubName.trim() || isPublishing}
              style={[
                styles.publishBtn,
                (!pubName.trim() || isPublishing) && styles.publishBtnDisabled,
              ]}>
              {isPublishing ? (
                <ActivityIndicator size="small" color="white" />
              ) : pubIsPublic ? (
                <Globe color="white" size={18} />
              ) : (
                <Save color="white" size={18} />
              )}
              <Text style={styles.publishBtnText}>
                {isPublishing
                  ? pubIsPublic
                    ? 'Publishing...'
                    : 'Saving...'
                  : pubIsPublic
                  ? 'Publish'
                  : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  // Publish modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {fontSize: 19, fontWeight: '600', color: '#1a1a1a'},
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E0D5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2C2C2C',
    marginBottom: 12,
  },
  modalDropdown: {
    borderWidth: 1,
    borderColor: '#E5E0D5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFEAE0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagChipText: {fontSize: 13, color: '#2C2C2C', textTransform: 'capitalize'},
  publicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 4,
  },
  publicLabel: {fontSize: 15, fontWeight: '500', color: '#1a1a1a'},
  publicHint: {fontSize: 12, color: '#999', marginTop: 2},
  publishBtn: {
    backgroundColor: '#C4A962',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  publishBtnDisabled: {opacity: 0.5},
  publishBtnText: {color: 'white', fontSize: 16, fontWeight: '600'},
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
  deleteBtn: {
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
  emptyCatalogue: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 24,
  },

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
