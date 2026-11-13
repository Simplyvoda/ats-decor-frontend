import {
  ChevronLeft,
  Eye,
  FileDown,
  Globe,
  MoreVertical,
  NotebookPen,
  Flag,
  RotateCcw,
  Save,
  ScanLine,
  Trash2,
  X,
} from 'lucide-react-native';
import React, {SetStateAction, useEffect, useRef, useState} from 'react';
import {openLegal} from '../utils/openLegal';
import {openModerationMenu} from '../utils/moderationMenu';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  Share,
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
  captureTopViewSnapshotCommand,
  exportDesignPdfCommand,
  exportFurnitureLayoutCommand,
  loadFurnitureCommand,
  FurniturePlacement,
  placeFurnitureFromLayoutCommand,
  removeSelectedFurnitureCommand,
  resetCameraCommand,
  toggleTopViewCommand,
} from '../components/RoomScanner/RealityKitView.native';
import DesignService from '../services/DesignService';
import FurnitureService from '../services/FurnitureService';
import NoteService from '../services/NoteService';
import {IFurniture} from '../../interface/furniture.interface';
import {IPlacedFurniture} from '../../interface/design.interface';
import {images} from '../../assets/constants/images';
import {makeStyles, useTheme} from '../theme/useTheme';
import {useUserContext} from '../context/UserContext';
import {usePlan} from '../context/PlanContext';
import ConsentScreen from '../components/shared/ConsentScreen';
import {ROOM_DATA_CONSENT} from '../config/consent';
import {track} from '../services/analytics';

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
  // Where the piece may be placed — sourced from category rather than
  // inferred from the model's own bounds, which proved unreliable for some
  // assets (thin decorative borders etc. throw off a geometry guess).
  placement: FurniturePlacement;
};

type FurnitureCategory = {
  id: string;
  name: string;
  items: FurnitureItem[];
};

// No bundled dev assets any more — test_chair.usdz was removed from the app
// bundle when the catalogue went fully remote (furniture and design
// templates both stream from R2 now). Kept as an empty list so a bundled
// test category can be re-added here easily if offline dev work needs one.
const DEV_CATALOGUE: FurnitureCategory[] = [];

// Rugs lie flat on the floor; small items such as table lamps may also go
// on tables and other tops; everything else stands on the floor.
const placementFor = (category: string): FurniturePlacement => {
  if (/rug|mat\b/i.test(category)) {
    return 'flat';
  }
  if (/lamp|vase|plant|decor|ornament/i.test(category)) {
    return 'surface';
  }
  return 'floor';
};

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
      placement: placementFor(f.category),
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
  const styles = useStyles();
  const {colors} = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const justSavedRef = useRef(false);
  const modelUrl: string = route.params?.modelUrl ?? '';
  // The saved room this design is in. New designs from a room share its
  // model, so saving sends the room's id rather than a model file.
  const roomId: string | undefined = route.params?.roomId;
  // Explore/Moodboard open other people's designs for inspiration: you can
  // look around and keep your own notes on them, nothing else. No
  // furniture editing, saving or exporting, and no "unsaved changes"
  // prompt on the way out.
  const viewOnly: boolean = route.params?.viewOnly === true;
  // Someone else's published design: offer Report / Block in the menu
  const reportable: boolean = viewOnly && route.params?.reportable === true;
  // Known when opened from Explore/Moodboard, or set after publishing —
  // notes taken here attach to this design automatically
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(
    route.params?.designId ?? null,
  );

  const realityKitRef = useRef(null);
  // Which panels are open: a furniture category's list, the ⋮ tools menu.
  const [{activeCategory, showToolsMenu}, setPanels] = useState<{
    activeCategory: FurnitureCategory | null;
    showToolsMenu: boolean;
  }>({activeCategory: null, showToolsMenu: false});
  const setActiveCategory = (cat: FurnitureCategory | null) =>
    setPanels(p => ({...p, activeCategory: cat}));
  const setShowToolsMenu = (next: SetStateAction<boolean>) =>
    setPanels(p => ({
      ...p,
      showToolsMenu:
        typeof next === 'function' ? next(p.showToolsMenu) : next,
    }));

  // What the native 3D view reports. The room model can take a while to
  // download and read — show progress until it's on screen (onRoomLoaded).
  const [{roomStatus, furnitureSelected}, setScene] = useState<{
    roomStatus: 'loading' | 'ready' | 'error';
    furnitureSelected: boolean;
  }>({roomStatus: 'loading', furnitureSelected: false});
  const [catalogue, setCatalogue] =
    useState<FurnitureCategory[]>(DEV_CATALOGUE);

  useEffect(() => {
    FurnitureService.getFurniture()
      .then(res =>
        setCatalogue([...DEV_CATALOGUE, ...buildCatalogue(res.data)]),
      )
      .catch(() => {
        // Backend unreachable — dev assets (if any) remain usable
      });
  }, []);

  // ── Publish design state ── prefilled from route params when reopening an
  // already-saved design, so re-saving doesn't reset name/style/tags/visibility.
  const [publish, setPublish] = useState<{
    // Room-data consent, asked before the first save of a typed-in room
    // (scans already asked on the scan screen).
    showConsent: boolean;
    savingConsent: boolean;
    showPublishModal: boolean;
    pubName: string;
    pubStyle: string | null;
    pubTags: string[];
    pubTagInput: string;
    pubIsPublic: boolean;
    isPublishing: boolean;
  }>(() => ({
    showConsent: false,
    savingConsent: false,
    showPublishModal: false,
    pubName: route.params?.designName ?? '',
    pubStyle: route.params?.designStyle ?? null,
    pubTags: route.params?.designTags ?? [],
    pubTagInput: '',
    pubIsPublic: route.params?.designIsPublic ?? false,
    isPublishing: false,
  }));
  const {
    showConsent,
    savingConsent,
    showPublishModal,
    pubName,
    pubStyle,
    pubTags,
    pubTagInput,
    pubIsPublic,
    isPublishing,
  } = publish;
  const {user, giveRoomDataConsent} = useUserContext();
  const {gate, usage, showUpgrade} = usePlan();
  // This design has had a watermark-free export unlocked for it
  const [exportUnlocked, setExportUnlocked] = useState<boolean>(
    route.params?.exportUnlocked === true,
  );

  // "Save design": a room the user built or scanned needs their room-data
  // consent first. Designs from Explore / house models don't, and nor do
  // saved rooms (consent was given when the room was saved).
  const openSaveForm = () => {
    const needsConsent =
      route.params?.fromScan === true &&
      !roomId &&
      !user?.room_data_consent_at;
    setPublish(p => ({
      ...p,
      showConsent: needsConsent,
      showPublishModal: !needsConsent,
    }));
  };

  const agreeAndContinue = async () => {
    setPublish(p => ({...p, savingConsent: true}));
    try {
      await giveRoomDataConsent();
      setPublish(p => ({
        ...p,
        savingConsent: false,
        showConsent: false,
        showPublishModal: true,
      }));
    } catch (err: any) {
      setPublish(p => ({...p, savingConsent: false}));
      Toast.show({
        type: 'error',
        text1: 'Could not save your choice',
        text2: err.response?.data?.message || err.message,
      });
    }
  };

  const setPub =
    <K extends keyof typeof publish>(key: K) =>
    (value: (typeof publish)[K]) =>
      setPublish(p => ({...p, [key]: value}));

  // A new design isn't saved automatically — nudge the user once
  useEffect(() => {
    if (roomId && !route.params?.designId) {
      Toast.show({
        type: 'info',
        text1: route.params?.roomName ?? 'Your room',
        text2: 'Add furniture, then use ⋮ → Save design to keep it',
        visibilityTime: 5000,
      });
    } else if (route.params?.fromScan) {
      Toast.show({
        type: 'info',
        // fromRoomBuilder: a room built from typed-in measurements
        // (RoomBuilderScreen), handled like a fresh scan otherwise
        text1: route.params?.fromRoomBuilder ? 'Room ready' : 'Scan ready',
        text2: 'Use ⋮ → Save design to keep it',
        visibilityTime: 5000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Warn before leaving with unsaved work
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (viewOnly || justSavedRef.current) {
        return; // nothing editable here, or already saved — let it leave without asking
      }
      e.preventDefault();
      Alert.alert(
        'Discard changes?',
        "Your design hasn't been saved yet. If you leave now, your changes will be lost.",
        [
          {text: 'Keep editing', style: 'cancel'},
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ],
      );
    });
    return unsubscribe;
  }, [navigation, viewOnly]);

  // Reopening a saved design: replay its furniture layout piece by piece.
  // Self-contained on the native side (each piece is anchored to its saved
  // world position directly), so this doesn't need to wait for the room model.
  useEffect(() => {
    const layout = route.params?.furnitureLayout as
      | IPlacedFurniture[]
      | undefined;
    layout?.forEach(item => {
      placeFurnitureFromLayoutCommand(realityKitRef, JSON.stringify(item));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snapshotCallback = useRef<
    ((result: {path?: string; error?: string}) => void) | null
  >(null);
  const layoutCallback = useRef<
    ((result: {layout?: string; error?: string}) => void) | null
  >(null);

  const handleSnapshotReady = (e: {
    nativeEvent: {path?: string; error?: string};
  }) => {
    snapshotCallback.current?.(e.nativeEvent);
    snapshotCallback.current = null;
  };

  const handleFurnitureLayoutExported = (e: {
    nativeEvent: {layout?: string; error?: string};
  }) => {
    layoutCallback.current?.(e.nativeEvent);
    layoutCallback.current = null;
  };

  // ── PDF export ──
  const [isExporting, setIsExporting] = useState(false);

  const handlePdfExported = async (e: {
    nativeEvent: {path?: string; error?: string};
  }) => {
    const {path, error} = e.nativeEvent;
    setIsExporting(false);
    if (error || !path) {
      Toast.show({type: 'error', text1: 'Export failed', text2: error});
      return;
    }
    try {
      await Share.share({url: `file://${path}`});
    } catch {
      // User dismissed the share sheet — nothing to do
    }
  };

  const exportPdf = (watermark: boolean) => {
    setIsExporting(true);
    Toast.show({type: 'info', text1: 'Preparing PDF…'});
    exportDesignPdfCommand(
      realityKitRef,
      route.params?.designName ?? 'PlaDomus Design',
      watermark,
    );
  };

  // Spends the plan's watermark-free export on this design, then exports.
  const unlockAndExport = async () => {
    if (!currentDesignId) {
      return;
    }
    try {
      await DesignService.unlockExport(currentDesignId);
      setExportUnlocked(true);
      exportPdf(false);
    } catch (err: any) {
      // A plan limit opens the upgrade sheet by itself.
      if (err?.response?.data?.code !== 'PLAN_LIMIT_REACHED') {
        Toast.show({
          type: 'error',
          text1: 'Could not remove the watermark',
          text2: err?.response?.data?.message || err?.message,
        });
      }
    }
  };

  // Free-plan exports carry a "Made with PlaDomus" watermark, unless the
  // design was unlocked with the plan's free watermark-free export.
  const handleExportPdf = () => {
    setShowToolsMenu(false);
    if (isExporting) {
      return;
    }
    const allowance = usage?.features['export.watermark_free'];
    const clean =
      !usage?.enforced ||
      !allowance ||
      allowance.limit === null ||
      exportUnlocked;
    if (clean) {
      exportPdf(false);
      return;
    }

    const left = Math.max(0, (allowance.limit ?? 0) - allowance.used);
    const withWatermark = {
      text: 'Export with watermark',
      onPress: () => exportPdf(true),
    };
    const cancel = {text: 'Cancel', style: 'cancel' as const};
    if (left > 0 && currentDesignId) {
      Alert.alert(
        'Remove the watermark?',
        `Exports on your plan carry a “Made with PlaDomus” watermark. You can remove it from ${left === 1 ? 'one design' : `${left} designs`} for free. Use it on this design?`,
        [
          {text: 'Remove watermark', onPress: unlockAndExport},
          withWatermark,
          cancel,
        ],
      );
    } else if (left > 0) {
      Alert.alert(
        'Export with watermark?',
        'Exports on your plan carry a “Made with PlaDomus” watermark. Save this design first to remove it with your free watermark-free export.',
        [withWatermark, cancel],
      );
    } else {
      Alert.alert(
        'Export with watermark?',
        'Exports on your plan carry a “Made with PlaDomus” watermark. Upgrade to export without it.',
        [
          withWatermark,
          {
            text: 'See plans',
            onPress: () =>
              showUpgrade({
                code: 'PLAN_LIMIT_REACHED',
                feature: 'export.watermark_free',
              }),
          },
          cancel,
        ],
      );
    }
  };

  const addPubTag = () => {
    const t = pubTagInput.trim().toLowerCase();
    setPublish(p => ({
      ...p,
      pubTags: t && !p.pubTags.includes(t) ? [...p.pubTags, t] : p.pubTags,
      pubTagInput: '',
    }));
  };

  const handlePublish = () => {
    if (!pubName.trim() || isPublishing) {
      return;
    }
    // A new design uses one of the plan's designs; sharing to Explore
    // needs a plan that allows posting. (The server checks both too.)
    if (!currentDesignId && !gate('design.create')) {
      return;
    }
    if (pubIsPublic && !route.params?.designIsPublic && !gate('community.post')) {
      return;
    }
    setPub('isPublishing')(true);

    snapshotCallback.current = async ({path, error}) => {
      if (error || !path) {
        Toast.show({type: 'error', text1: 'Could not capture thumbnail'});
        setPub('isPublishing')(false);
        return;
      }
      try {
        const layoutResult = await new Promise<{
          layout?: string;
          error?: string;
        }>(resolve => {
          layoutCallback.current = resolve;
          exportFurnitureLayoutCommand(realityKitRef);
        });

        const payload = {
          name: pubName.trim(),
          style: pubStyle ?? undefined,
          tags: pubTags,
          isPublic: pubIsPublic,
          thumbnailPath: path,
          modelUrl,
          roomId,
          furnitureLayout: layoutResult.layout,
        };
        // Editing an already-saved design replaces it in place rather than
        // publishing a duplicate.
        const res = currentDesignId
          ? await DesignService.update(currentDesignId, payload)
          : await DesignService.publish(payload);
        setCurrentDesignId(res.data.id);
        const roomSource = route.params?.roomSource;
        track.roomSaved(
          route.params?.fromRoomBuilder || roomSource === 'manual'
            ? 'room_builder'
            : route.params?.fromScan || roomSource === 'scanned'
              ? 'scan'
              : 'house_model',
          !!currentDesignId,
          pubIsPublic,
        );
        // Counted when it becomes public, not on re-saves of a public one.
        if (pubIsPublic && !route.params?.designIsPublic) {
          track.publishedToExplore('save');
        }
        Toast.show({
          type: 'success',
          text1: currentDesignId
            ? 'Design updated'
            : pubIsPublic
              ? 'Published to Explore'
              : 'Design saved',
        });

        // Attach any notes jotted before this design had an id
        const drafts = await NoteService.getDraftNotes();
        if (drafts.length > 0) {
          try {
            await Promise.all(
              drafts.map(d =>
                NoteService.createNote({
                  title: d.title,
                  description: d.description,
                  project_id: res.data.id,
                  tags: d.tags,
                }),
              ),
            );
          } catch {
            // Best-effort — the design save itself already succeeded
          } finally {
            await NoteService.clearDraftNotes();
          }
        }

        // Saving ends the editing session — drop ScanScreen/ChooseModel/ARViewer
        // from the stack so the user lands on Home with no way back into this session.
        justSavedRef.current = true;
        (navigation as any).reset({
          index: 0,
          routes: [{name: 'HomeTabs'}],
        });
      } catch (err: any) {
        Toast.show({
          type: 'error',
          text1: 'Publish failed',
          text2: err.response?.data?.message || err.message,
        });
      } finally {
        setPub('isPublishing')(false);
      }
    };

    captureTopViewSnapshotCommand(realityKitRef);
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
    loadFurnitureCommand(realityKitRef, item.modelUrl, item.placement);
    track.productPlaced(user?.id, activeCategory?.name ?? 'unknown', item.id);
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
      {/* <Text style={styles.furnitureName} numberOfLines={2}>
        {item.name}
      </Text> */}
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
        color={colors.textMuted}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* ── Full-screen AR view ── */}
      <RealityKitNativeView
        ref={realityKitRef}
        modelUrl={modelUrl}
        editingEnabled={!viewOnly}
        // Open on a zoomed-out overview of the whole room, not inside it
        startFromAbove
        onSnapshotReady={handleSnapshotReady}
        onFurnitureLayoutExported={handleFurnitureLayoutExported}
        onDesignPdfExported={handlePdfExported}
        // Read the event straight away: React Native clears it once this
        // handler returns, before the setScene update below runs.
        onFurnitureSelectionChanged={e => {
          const selected = e.nativeEvent.selected;
          setScene(sc => ({...sc, furnitureSelected: selected}));
        }}
        onRoomLoaded={e => {
          const roomStatus = e.nativeEvent.success ? 'ready' : 'error';
          setScene(sc => ({...sc, roomStatus}));
        }}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Room loading / failed state ── */}
      {roomStatus !== 'ready' && (
        <View style={styles.roomStatusOverlay} pointerEvents="none">
          {roomStatus === 'loading' && (
            <ActivityIndicator color={colors.brand} size="large" />
          )}
          <Text style={styles.roomStatusText}>
            {roomStatus === 'loading'
              ? 'Loading room…'
              : "This room couldn't be loaded. Go back and try again."}
          </Text>
        </View>
      )}

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
                <Eye color={colors.brand} size={20} />
              </TouchableOpacity>
              <View style={styles.toolDivider} />
              <TouchableOpacity
                style={styles.toolBtn}
                onPress={() => setShowToolsMenu(v => !v)}>
                <MoreVertical color={colors.brand} size={20} />
              </TouchableOpacity>
            </View>

            {/* 3-dot dropdown menu */}
            {showToolsMenu && (
              <View style={styles.toolsMenu}>
                <TouchableOpacity
                    style={styles.toolsMenuItem}
                    onPress={() => {
                      setShowToolsMenu(false);
                      // Notes taken before the design is saved show up here
                      // too, held as local drafts until it is.
                      (navigation as any).navigate('DesignNotes', {
                        designId: currentDesignId,
                        designName: route.params?.designName,
                      });
                    }}>
                    <NotebookPen color={colors.brand} size={18} />
                    <Text style={styles.toolsMenuText}>Notes</Text>
                  </TouchableOpacity>
                {reportable && currentDesignId && (
                  <TouchableOpacity
                    style={styles.toolsMenuItem}
                    onPress={async () => {
                      setShowToolsMenu(false);
                      const outcome = await openModerationMenu(
                        'design',
                        currentDesignId,
                      );
                      // It's hidden for this user now
                      if (outcome) {
                        navigation.goBack();
                      }
                    }}>
                    <Flag color={colors.brand} size={18} />
                    <Text style={styles.toolsMenuText}>Report or block</Text>
                  </TouchableOpacity>
                )}
                {!viewOnly && (
                  <TouchableOpacity
                    style={styles.toolsMenuItem}
                    onPress={() => {
                      setShowToolsMenu(false);
                      openSaveForm();
                    }}>
                    <Save color={colors.brand} size={18} />
                    <Text style={styles.toolsMenuText}>
                      {currentDesignId ? 'Update Design' : 'Save design'}
                    </Text>
                  </TouchableOpacity>
                )}
                {!viewOnly && (
                  <TouchableOpacity
                    style={styles.toolsMenuItem}
                    onPress={handleExportPdf}>
                    <FileDown color={colors.brand} size={18} />
                    <Text style={styles.toolsMenuText}>
                      {isExporting ? 'Exporting…' : 'Export PDF'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => resetCameraCommand(realityKitRef)}>
              <RotateCcw color={colors.icon} size={18} />
            </TouchableOpacity>

            {/* Delete selected furniture */}
            {furnitureSelected && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => removeSelectedFurnitureCommand(realityKitRef)}>
                <Trash2 color={colors.danger} size={18} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* ── Bottom sheet (furniture browsing/placement — editing only) ── */}
      {!viewOnly && (
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
                  <ChevronLeft color={colors.icon} size={22} />
                </TouchableOpacity>
                <Text style={styles.sheetTitle}>{activeCategory.name}</Text>
                <TouchableOpacity
                  onPress={handleCloseSheet}
                  hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
                  <X color={colors.icon} size={22} />
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
                  <X color={colors.icon} size={22} />
                </TouchableOpacity>
              </View>
              {catalogue.length === 0 ? (
                <Text style={styles.emptyCatalogue}>
                  No furniture available yet
                </Text>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {catalogue.map(renderCategoryRow)}
                </ScrollView>
              )}
            </>
          )}
        </Animated.View>
      )}

      {/* ── Room-data consent (before saving a typed-in room) ── */}
      <Modal
        visible={showConsent}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPub('showConsent')(false)}>
        <ConsentScreen
          icon={ScanLine}
          {...ROOM_DATA_CONSENT}
          // Opens over the consent sheet; Done returns to it
          onFootnotePress={() => openLegal('privacy')}
          busy={savingConsent}
          onAccept={agreeAndContinue}
          onDecline={() => setPub('showConsent')(false)}
        />
      </Modal>

      {/* ── Publish design modal ── */}
      <Modal
        visible={showPublishModal}
        transparent
        animationType="fade"
        onRequestClose={() => setPub('showPublishModal')(false)}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {currentDesignId ? 'Update Design' : 'Save design'}
              </Text>
              <TouchableOpacity
                onPress={() => setPub('showPublishModal')(false)}
                hitSlop={10}>
                <X color={colors.icon} size={22} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={pubName}
              onChangeText={setPub('pubName')}
              placeholder="Design name..."
              placeholderTextColor={colors.textMuted}
              style={styles.modalInput}
            />

            <Dropdown
              data={STYLE_PRESETS}
              labelField="label"
              valueField="value"
              value={pubStyle}
              onChange={item => setPub('pubStyle')(item.value)}
              placeholder="Style (Optional)"
              placeholderStyle={{color: colors.textMuted, fontSize: 14}}
              selectedTextStyle={{color: colors.text, fontSize: 14}}
              // The dropdown's pop-up list is white with black text
              // unless told otherwise
              containerStyle={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
              itemTextStyle={{color: colors.text}}
              activeColor={colors.highlight}
              style={styles.modalDropdown}
            />

            {pubTags.length > 0 && (
              <View style={styles.tagRow}>
                {pubTags.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => setPub('pubTags')(pubTags.filter(t => t !== tag))}
                    style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                    <X size={12} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TextInput
              value={pubTagInput}
              onChangeText={setPub('pubTagInput')}
              onSubmitEditing={addPubTag}
              onBlur={addPubTag}
              placeholder="Add a tag and press return"
              placeholderTextColor={colors.textMuted}
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
                onValueChange={on => {
                  if (on && !gate('community.post')) {
                    return;
                  }
                  setPub('pubIsPublic')(on);
                }}
                trackColor={{true: colors.brand, false: colors.border}}
                ios_backgroundColor={colors.border}
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
                <ActivityIndicator size="small" color={colors.onBrand} />
              ) : pubIsPublic ? (
                <Globe color={colors.onBrand} size={18} />
              ) : (
                <Save color={colors.onBrand} size={18} />
              )}
              <Text style={styles.publishBtnText}>
                {currentDesignId
                  ? isPublishing
                    ? 'Updating...'
                    : 'Update Design'
                  : isPublishing
                    ? pubIsPublic
                      ? 'Publishing...'
                      : 'Saving...'
                    : pubIsPublic
                      ? 'Publish'
                      : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const ITEM_SIZE = (Dimensions.get('window').width - 48) / 3;

const useStyles = makeStyles(c => ({
  root: {flex: 1, backgroundColor: '#000'},

  roomStatusOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  roomStatusText: {
    fontFamily: 'DM Sans',
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
  },

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
    backgroundColor: c.surface,
    borderRadius: 14,
    paddingVertical: 4,
    shadowColor: c.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  toolBtn: {
    width: 44,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolDivider: {height: 1, backgroundColor: c.border, marginHorizontal: 8},
  toolsMenu: {
    backgroundColor: c.surface,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 4,
    shadowColor: c.shadow,
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
  toolsMenuText: {fontSize: 15, color: c.text, marginLeft: 10},

  // Publish modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: c.surface,
    borderRadius: 18,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {fontSize: 19, fontWeight: '600', color: c.textPrimary},
  modalInput: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: c.text,
    marginBottom: 12,
  },
  modalDropdown: {
    borderWidth: 1,
    borderColor: c.border,
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
    backgroundColor: c.surfaceMuted,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagChipText: {fontSize: 13, color: c.text, textTransform: 'capitalize'},
  publicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 4,
  },
  publicLabel: {fontSize: 15, fontWeight: '500', color: c.textPrimary},
  publicHint: {fontSize: 12, color: c.textMuted, marginTop: 2},
  publishBtn: {
    backgroundColor: c.brand,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  publishBtnDisabled: {opacity: 0.5},
  publishBtnText: {color: c.onBrand, fontSize: 16, fontWeight: '600'},
  resetBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: c.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: c.shadow,
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
    backgroundColor: c.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: c.shadow,
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
    backgroundColor: c.borderStrong,
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
    color: c.textPrimary,
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
    borderBottomColor: c.border,
  },
  categoryName: {fontSize: 15, color: c.textPrimary, flex: 1},
  categoryCount: {fontSize: 13, color: c.textMuted, marginRight: 8},
  emptyCatalogue: {
    textAlign: 'center',
    color: c.textMuted,
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
    backgroundColor: c.surfaceMuted,
    resizeMode: 'contain',
  },
  furnitureName: {
    fontSize: 11,
    color: c.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
}));
