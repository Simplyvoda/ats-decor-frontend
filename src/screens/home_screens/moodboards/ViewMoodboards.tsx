// Mood Board: every design you've saved with the heart in Explore. The
// chips are your boards ("All" = everything saved; "+" makes a board).
//   - Long-press a design to choose which boards it's on.
//   - Long-press a board chip to add designs, rename or delete it.
import React, {useCallback, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlignLeft,
  ChevronLeft,
  ImageOff,
  Grid3x3,
  Heart,
  Plus,
} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import useLightStatusBar from '../../../hooks/useLightStatusBar';
import Toast from 'react-native-toast-message';
import {goBack, navigateTo} from '../../../utils/navigation';
import MoodboardService from '../../../services/MoodboardService';
import DesignService from '../../../services/DesignService';
import {
  IMoodboardItem,
  IMoodboardSummary,
  SavedStatus,
} from '../../../../interface/design.interface';
import useRefetchOnFocus from '../../../hooks/useRefetchOnFocus';
import useAfterModalClose from '../../../hooks/useAfterModalClose';
import {makeStyles, useTheme} from '../../../theme/useTheme';
import {usePlan} from '../../../context/PlanContext';
import {
  BoardNameModal,
  ChecklistSheet,
  ROW_IMAGE,
} from '../../../components/(home)/(moodboard)/BoardParts';

type ViewMode = 'cards' | 'list';
const ALL = 'all';

const errorText = (err: any) =>
  err?.response?.data?.message || err?.message || 'Please try again';

// What a saved design's empty frame says once the design is gone
const GONE: Record<
  Exclude<SavedStatus, 'available'>,
  {title: string; body: string}
> = {
  design_deleted: {
    title: 'This design was deleted',
    body: 'Its creator removed it.',
  },
  account_deleted: {
    title: 'This design is no longer available',
    body: 'Its creator deleted their account.',
  },
  unpublished: {
    title: 'This design is no longer shared',
    body: 'Its creator made it private.',
  },
};

const tagText = (item: IMoodboardItem) =>
  (item.design?.tags ?? []).map(t => t.name).join(' · ');

const ViewMoodboards = () => {
  const styles = useStyles();
  const {colors} = useTheme();
  const navigation = useNavigation();
  const {gate} = usePlan();
  // The gold header runs up behind the status bar, as in the design
  const insets = useSafeAreaInsets();
  useLightStatusBar();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  // ALL, or a board id
  const [selected, setSelected] = useState<string>(ALL);
  const [{items, boards, isLoading}, setData] = useState<{
    items: IMoodboardItem[];
    boards: IMoodboardSummary[];
    isLoading: boolean;
  }>({items: [], boards: [], isLoading: true});
  // Which sheet is open: the boards for one design, or the saved designs
  // for one board
  const [sheet, setSheet] = useState<
    | {kind: 'boardsFor'; itemId: string}
    | {kind: 'designsFor'; boardId: string}
    | null
  >(null);
  // Naming a board: a new one (optionally for a design), or a rename
  const [naming, setNaming] = useState<
    | {kind: 'new'; forItemId?: string}
    | {kind: 'rename'; board: IMoodboardSummary}
    | null
  >(null);
  const afterSheet = useAfterModalClose();
  const afterNaming = useAfterModalClose();
  // True once the name dialog has fully closed (iOS reports it)
  const namingGone = useRef(true);

  const fetchAll = useCallback(async () => {
    try {
      const [saved, list] = await Promise.all([
        MoodboardService.getMoodboard(),
        MoodboardService.getBoards(),
      ]);
      // Boards in the order they were made, so chips don't jump around
      const ordered = [...list].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
      );
      setData({items: saved.data, boards: ordered, isLoading: false});
      setSelected(s => (s === ALL || ordered.some(b => b.id === s) ? s : ALL));
      return true;
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not load your mood board',
        text2: errorText(err),
      });
      setData(d => ({...d, isLoading: false}));
      return false;
    }
  }, []);

  useRefetchOnFocus(fetchAll, ['moodboard', 'designs'], 5 * 60 * 1000);

  const setItemBoards = (itemId: string, ids: string[]) =>
    setData(d => ({
      ...d,
      items: d.items.map(i => (i.id === itemId ? {...i, board_ids: ids} : i)),
    }));

  // Put a saved design on a board, or take it off.
  const toggle = async (item: IMoodboardItem, boardId: string, on: boolean) => {
    const designId = item.design_id;
    if (!designId) {
      return;
    }
    const before = item.board_ids ?? [];
    setItemBoards(
      item.id,
      on ? [...before, boardId] : before.filter(b => b !== boardId),
    );
    try {
      if (on) {
        await MoodboardService.addToBoard(boardId, designId);
      } else {
        await MoodboardService.removeFromBoard(boardId, designId);
      }
    } catch (err: any) {
      setItemBoards(item.id, before);
      Toast.show({
        type: 'error',
        text1: 'Could not update the board',
        text2: errorText(err),
      });
    }
  };

  // ── Boards ──

  const startNewBoard = (forItemId?: string) => {
    if (gate('moodboard.active')) {
      setNaming({kind: 'new', forItemId});
    }
  };

  const saveName = async (name: string) => {
    const current = naming;
    namingGone.current = false;
    setNaming(null);
    if (!current) {
      return;
    }
    try {
      if (current.kind === 'rename') {
        await MoodboardService.renameBoard(current.board.id, name);
        setData(d => ({
          ...d,
          boards: d.boards.map(b =>
            b.id === current.board.id ? {...b, name} : b,
          ),
        }));
        return;
      }
      const board = await MoodboardService.createBoard(name);
      const item = items.find(i => i.id === current.forItemId);
      if (item?.design_id) {
        await MoodboardService.addToBoard(board.id, item.design_id);
        Toast.show({type: 'success', text1: `Added to “${board.name}”`});
      }
      await fetchAll();
      setSelected(board.id);
      // A new empty board: offer the saved designs to fill it
      if (!item && items.length) {
        const open = () => setSheet({kind: 'designsFor', boardId: board.id});
        // The dialog may already be gone by the time the server answers
        if (namingGone.current) {
          open();
        } else {
          afterNaming.run(open);
        }
      }
    } catch (err: any) {
      // Over the plan's limit, the upgrade sheet opens by itself.
      if (err?.response?.data?.code !== 'PLAN_LIMIT_REACHED') {
        Toast.show({
          type: 'error',
          text1:
            current.kind === 'rename'
              ? 'Could not rename the board'
              : 'Could not create the board',
          text2: errorText(err),
        });
      }
    }
  };

  const deleteBoard = (board: IMoodboardSummary) =>
    Alert.alert(
      `Delete “${board.name}”?`,
      'The designs on it stay in your saved designs.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await MoodboardService.deleteBoard(board.id);
              setSelected(ALL);
              fetchAll();
            } catch (err: any) {
              Toast.show({
                type: 'error',
                text1: 'Could not delete the board',
                text2: errorText(err),
              });
            }
          },
        },
      ],
    );

  const boardMenu = (board: IMoodboardSummary) =>
    Alert.alert(board.name, undefined, [
      {
        text: 'Add saved designs',
        onPress: () => setSheet({kind: 'designsFor', boardId: board.id}),
      },
      {text: 'Rename', onPress: () => setNaming({kind: 'rename', board})},
      {
        text: 'Delete board',
        style: 'destructive',
        onPress: () => deleteBoard(board),
      },
      {text: 'Cancel', style: 'cancel'},
    ]);

  // ── Saved designs ──

  const handleUnlike = (item: IMoodboardItem) => {
    const remove = async () => {
      setData(d => ({...d, items: d.items.filter(i => i.id !== item.id)}));
      try {
        await MoodboardService.removeItem(item.id);
      } catch {
        setData(d => ({...d, items: [item, ...d.items]}));
        Toast.show({type: 'error', text1: 'Could not remove item'});
      }
    };
    const onBoards = item.board_ids?.length ?? 0;
    // A placeholder for a gone design just goes
    if (!onBoards || item.status !== 'available') {
      remove();
      return;
    }
    Alert.alert(
      'Remove from your mood board?',
      `It will also come off ${onBoards === 1 ? 'the board' : `the ${onBoards} boards`} it’s on.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Remove', style: 'destructive', onPress: remove},
      ],
    );
  };

  const openDesign = (item: IMoodboardItem) => {
    if (!item.design?.file_url) {
      return;
    }
    DesignService.addView(item.design.id).catch(() => {});
    navigateTo(navigation, 'ARViewer', {
      modelUrl: item.design.file_url,
      designId: item.design.id,
      designName: item.design.name,
      furnitureLayout: item.design.furniture_layout,
      // Saved designs are someone else's: look and take notes only
      viewOnly: true,
    });
  };

  const board = boards.find(b => b.id === selected);
  const visibleItems = board
    ? items.filter(i => i.board_ids?.includes(board.id))
    : items;

  // ── Rendering ──

  const heart = (item: IMoodboardItem, large: boolean) => (
    <TouchableOpacity
      style={large ? styles.heartLarge : styles.heartSmall}
      activeOpacity={0.8}
      hitSlop={8}
      accessibilityLabel="Remove from your mood board"
      onPress={() => handleUnlike(item)}>
      <Heart
        size={large ? 18 : 13}
        color={colors.brand}
        fill={colors.brand}
      />
    </TouchableOpacity>
  );

  const thumbnail = (item: IMoodboardItem, style: object) =>
    item.design?.thumbnail_url ? (
      <Image
        source={{uri: item.design.thumbnail_url, cache: 'force-cache'}}
        style={style}
        resizeMode="cover"
      />
    ) : (
      <View style={[style, styles.imagePlaceholder]} />
    );

  // The empty frame left where a saved design used to be, saying why.
  const renderGone = (item: IMoodboardItem, large: boolean) => {
    const gone = GONE[item.status as Exclude<SavedStatus, 'available'>] ??
      GONE.design_deleted;
    const remove = (
      <TouchableOpacity
        onPress={() => handleUnlike(item)}
        hitSlop={8}
        accessibilityLabel={`Remove: ${gone.title}`}>
        <Text style={styles.goneRemove}>Remove</Text>
      </TouchableOpacity>
    );
    return large ? (
      <View key={item.id} style={[styles.largeCard, styles.goneCard]}>
        <View style={[styles.largeImage, styles.goneFrame]}>
          <ImageOff size={32} color={colors.iconMuted} strokeWidth={1.4} />
        </View>
        <View style={styles.largeInfo}>
          <Text style={styles.goneTitle}>{gone.title}</Text>
          <Text style={styles.goneBody}>{gone.body}</Text>
          {remove}
        </View>
      </View>
    ) : (
      <View key={item.id} style={[styles.listCard, styles.goneCard]}>
        <View style={[styles.listImage, styles.goneFrame]}>
          <ImageOff size={24} color={colors.iconMuted} strokeWidth={1.4} />
        </View>
        <View style={styles.listInfo}>
          <Text style={styles.goneTitle}>{gone.title}</Text>
          <Text style={styles.goneBody}>{gone.body}</Text>
          {remove}
        </View>
      </View>
    );
  };

  const renderListCard = (item: IMoodboardItem) => {
    if (item.status !== 'available') {
      return renderGone(item, false);
    }
    const tags = tagText(item);
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.listCard}
        activeOpacity={0.85}
        onPress={() => openDesign(item)}
        onLongPress={() => setSheet({kind: 'boardsFor', itemId: item.id})}>
        <View>
          {thumbnail(item, styles.listImage)}
          {heart(item, false)}
        </View>
        <View style={styles.listInfo}>
          <Text style={styles.listTitle} numberOfLines={2}>
            {item.design?.name ?? 'Design'}
          </Text>
          {!!item.design?.style && (
            <Text style={styles.listStyle}>{item.design.style}</Text>
          )}
          {!!tags && (
            <Text style={styles.listTags} numberOfLines={1}>
              {tags}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderLargeCard = (item: IMoodboardItem) => {
    if (item.status !== 'available') {
      return renderGone(item, true);
    }
    const tags = tagText(item);
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.largeCard}
        activeOpacity={0.85}
        onPress={() => openDesign(item)}
        onLongPress={() => setSheet({kind: 'boardsFor', itemId: item.id})}>
        <View>
          {thumbnail(item, styles.largeImage)}
          {!!item.design?.style && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.design.style}</Text>
            </View>
          )}
          {heart(item, true)}
        </View>
        <View style={styles.largeInfo}>
          <Text style={styles.largeTitle} numberOfLines={2}>
            {item.design?.name ?? 'Design'}
          </Text>
          {!!tags && (
            <Text style={styles.largeTags} numberOfLines={1}>
              {tags}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyCard}>
      <Heart size={40} color={colors.textMuted} strokeWidth={1.4} />
      {board ? (
        <>
          <Text style={styles.emptyTitle}>Nothing on “{board.name}” yet</Text>
          <Text style={styles.emptyText}>
            {items.length
              ? 'Add designs you’ve saved, or long-press any design to choose its boards'
              : 'Tap the heart on designs in Explore to save them, then add them here'}
          </Text>
          {items.length > 0 && (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() =>
                setSheet({kind: 'designsFor', boardId: board.id})
              }>
              <Plus size={16} color={colors.onBrand} />
              <Text style={styles.emptyButtonText}>Add saved designs</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <>
          <Text style={styles.emptyTitle}>No saved items yet</Text>
          <Text style={styles.emptyText}>
            Tap the heart on designs in Explore to save them here
          </Text>
        </>
      )}
    </View>
  );

  // The open sheet's contents
  const sheetItem =
    sheet?.kind === 'boardsFor'
      ? items.find(i => i.id === sheet.itemId)
      : undefined;
  const sheetBoard =
    sheet?.kind === 'designsFor'
      ? boards.find(b => b.id === sheet.boardId)
      : undefined;

  const closeSheet = () => {
    setSheet(null);
    // Board counts changed
    fetchAll();
  };

  return (
    <View style={styles.root}>
      {/* Gold header, from the very top of the screen */}
      <View
        style={[
          styles.header,
          {
            height: HEADER_HEIGHT + insets.top,
            paddingTop: HEADER_PADDING_TOP + insets.top,
          },
        ]}>
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => goBack(navigation)}
          accessibilityLabel="Back">
          <ChevronLeft size={24} color={colors.onBrand} />
          <Text style={styles.headerTitle}>Mood Board</Text>
        </TouchableOpacity>
        <Text style={styles.headerSubtitle}>
          Your saved inspirations and Ideas
        </Text>

        {/* Overlapping white info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardTop}>
            <Text style={styles.itemCount}>
              {visibleItems.length} Item{visibleItems.length === 1 ? '' : 's'}{' '}
              Saved
            </Text>
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  viewMode === 'cards' && styles.toggleBtnActive,
                ]}
                accessibilityLabel="Large cards"
                onPress={() => setViewMode('cards')}>
                <Grid3x3
                  size={18}
                  color={viewMode === 'cards' ? colors.onBrand : colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  viewMode === 'list' && styles.toggleBtnActive,
                ]}
                accessibilityLabel="List"
                onPress={() => setViewMode('list')}>
                <AlignLeft
                  size={18}
                  color={viewMode === 'list' ? colors.onBrand : colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {[{id: ALL, name: 'All'}, ...boards].map(b => {
                const active = selected === b.id;
                const summary = boards.find(x => x.id === b.id);
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSelected(b.id)}
                    onLongPress={summary ? () => boardMenu(summary) : undefined}>
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                      numberOfLines={1}>
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={styles.chip}
                accessibilityLabel="New board"
                onPress={() => startNewBoard()}>
                <Plus size={18} color={colors.brand} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          {paddingBottom: 40 + insets.bottom},
        ]}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        ) : visibleItems.length === 0 ? (
          renderEmpty()
        ) : viewMode === 'cards' ? (
          visibleItems.map(renderLargeCard)
        ) : (
          visibleItems.map(renderListCard)
        )}
      </ScrollView>

      <ChecklistSheet
        visible={sheet !== null}
        title={
          sheetBoard ? `Add to “${sheetBoard.name}”` : 'Add to mood boards'
        }
        subtitle={
          sheetBoard
            ? 'Tick the saved designs to put on this board'
            : sheetItem?.design?.name
        }
        emptyText={
          sheetBoard
            ? 'You haven’t saved any designs yet.'
            : 'You don’t have any boards yet.'
        }
        rows={
          sheetBoard
            ? items
                .filter(i => i.status === 'available')
                .map(i => ({
                id: i.id,
                title: i.design?.name ?? 'Design',
                subtitle: i.design?.style ?? undefined,
                image: thumbnail(i, styles.rowImage),
                checked: !!i.board_ids?.includes(sheetBoard.id),
              }))
            : boards.map(b => ({
                id: b.id,
                title: b.name,
                subtitle: `${b.item_count} design${b.item_count === 1 ? '' : 's'}`,
                checked: !!sheetItem?.board_ids?.includes(b.id),
              }))
        }
        footer={
          sheetItem
            ? {
                label: 'New board',
                onPress: () => {
                  const itemId = sheetItem.id;
                  setSheet(null);
                  afterSheet.run(() => startNewBoard(itemId));
                },
              }
            : undefined
        }
        onToggle={row => {
          if (sheetBoard) {
            const item = items.find(i => i.id === row.id);
            item && toggle(item, sheetBoard.id, !row.checked);
          } else if (sheetItem) {
            toggle(sheetItem, row.id, !row.checked);
          }
        }}
        onClose={closeSheet}
        onDismiss={afterSheet.onDismiss}
      />

      <BoardNameModal
        visible={naming !== null}
        title={naming?.kind === 'rename' ? 'Rename board' : 'New board'}
        initial={naming?.kind === 'rename' ? naming.board.name : ''}
        saveLabel={naming?.kind === 'rename' ? 'Save' : 'Create'}
        onClose={() => setNaming(null)}
        onSave={saveName}
        onDismiss={() => {
          namingGone.current = true;
          afterNaming.onDismiss();
        }}
      />
    </View>
  );
};

// Measurements from the design (points)
const GUTTER = 30;
const HEADER_HEIGHT = 164; // below the status bar
const HEADER_PADDING_TOP = 28;
const CARD_HEIGHT = 158;
const CARD_OVERLAP = 122; // how far the info card hangs below the header

const useStyles = makeStyles(c => ({
  root: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    backgroundColor: c.brand,
    paddingHorizontal: GUTTER,
    zIndex: 1,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 34,
    marginBottom: 32,
    alignSelf: 'flex-start',
  },
  headerTitle: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 24,
    color: c.onBrand,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontFamily: 'DM Sans',
    fontSize: 16,
    color: c.onBrand,
  },
  infoCard: {
    backgroundColor: c.surface,
    borderRadius: 20,
    position: 'absolute',
    bottom: -CARD_OVERLAP,
    left: GUTTER,
    right: GUTTER,
    height: CARD_HEIGHT,
    paddingHorizontal: 20,
    paddingTop: 34,
    shadowColor: c.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 10,
  },
  infoCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  itemCount: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 22,
    color: c.text,
    fontWeight: '600',
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 14,
  },
  toggleBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: c.brand,
    borderColor: c.brand,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 13,
    alignItems: 'center',
  },
  chip: {
    height: 35,
    minWidth: 34,
    maxWidth: 160,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: c.brand,
    paddingHorizontal: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: c.brand,
  },
  chipText: {
    fontFamily: 'DM Sans',
    fontSize: 15,
    color: c.text,
  },
  chipTextActive: {
    color: c.onBrand,
  },
  list: {
    marginTop: CARD_OVERLAP,
  },
  listContent: {
    paddingHorizontal: GUTTER,
    paddingTop: 50,
    paddingBottom: 40,
    gap: 25,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 48,
  },

  // List view
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 18,
  },
  listImage: {
    width: 123,
    height: 101,
    borderRadius: 4,
  },
  heartSmall: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#00000014',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listInfo: {
    flex: 1,
    gap: 6,
  },
  listTitle: {
    fontFamily: 'DM Sans',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: c.text,
  },
  listStyle: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    color: c.textSecondary,
  },
  listTags: {
    fontFamily: 'DM Sans',
    fontSize: 12,
    color: c.textMuted,
  },

  // Large-card view
  largeCard: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  largeImage: {
    width: '100%',
    height: 176,
  },
  badge: {
    position: 'absolute',
    top: 16,
    left: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    color: '#1f1f1f',
  },
  heartLarge: {
    position: 'absolute',
    top: 12,
    right: 18,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#00000033',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeInfo: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 6,
  },
  largeTitle: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 21,
    fontWeight: '600',
    color: c.text,
  },
  largeTags: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    fontStyle: 'italic',
    color: c.textMuted,
  },

  goneCard: {
    borderStyle: 'dashed',
  },
  goneFrame: {
    backgroundColor: c.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goneTitle: {
    fontFamily: 'DM Sans',
    fontSize: 15,
    fontWeight: '600',
    color: c.textSecondary,
  },
  goneBody: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    color: c.textMuted,
  },
  goneRemove: {
    fontFamily: 'DM Sans',
    fontSize: 13,
    fontWeight: '600',
    color: c.brand,
    marginTop: 4,
  },
  imagePlaceholder: {
    backgroundColor: c.surfaceMuted,
  },
  rowImage: {width: ROW_IMAGE, height: ROW_IMAGE, borderRadius: 10},

  emptyCard: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 16,
    backgroundColor: c.surface,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 20,
    color: c.text,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'DM Sans',
    fontSize: 14,
    color: c.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: c.brand,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginTop: 18,
  },
  emptyButtonText: {
    fontFamily: 'DM Sans',
    fontSize: 15,
    fontWeight: '600',
    color: c.onBrand,
  },
}));

export default ViewMoodboards;
