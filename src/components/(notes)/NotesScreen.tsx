import {
  Calendar,
  ClipboardList,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  Share2,
  Tag as TagIcon,
  Trash2,
  Upload,
} from 'lucide-react-native';
import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import NoteService from '../../services/NoteService';
import {INote} from '../../../interface/note.interface';
import {navigateTo} from '../../utils/navigation';

export const NOTES_LIMIT = 50;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};

export default function NotesScreen() {
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState<'active' | 'trash'>('active');
  const [notes, setNotes] = useState<INote[]>([]);
  const [trashedNotes, setTrashedNotes] = useState<INote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [menuNoteId, setMenuNoteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchNotes = useCallback(async () => {
    try {
      const [active, trash] = await Promise.all([
        NoteService.getNotes({isActive: true}),
        NoteService.getNotes({isActive: false}),
      ]);
      setNotes(active.data);
      setTrashedNotes(trash.data);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not load notes',
        text2: err.response?.data?.message || err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotes();
    }, [fetchNotes]),
  );

  // Tag chips come from the active notes so the filter row stays stable
  const allTags = useMemo(() => {
    const seen = new Map<string, string>();
    notes.forEach(n => n.tags?.forEach(t => seen.set(t.id, t.name)));
    return Array.from(seen, ([id, name]) => ({id, name}));
  }, [notes]);

  const visibleNotes = useMemo(() => {
    const source = activeTab === 'active' ? notes : trashedNotes;
    const q = search.trim().toLowerCase();
    return source.filter(n => {
      if (q && !n.title.toLowerCase().includes(q) && !(n.description || '').toLowerCase().includes(q)) {
        return false;
      }
      if (activeTag && !n.tags?.some(t => t.id === activeTag)) {
        return false;
      }
      return true;
    });
  }, [activeTab, notes, trashedNotes, search, activeTag]);

  const inSelectMode = selectedIds.length > 0;

  const toggleSelect = (id: string) => {
    setMenuNoteId(null);
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
  };

  const handleShare = async (note: INote) => {
    setMenuNoteId(null);
    await Share.share({message: `${note.title}\n\n${note.description || ''}`});
  };

  const handleExport = async (note: INote) => {
    setMenuNoteId(null);
    const tags = note.tags?.map(t => `#${t.name}`).join(' ') || '';
    await Share.share({
      message: `${note.title}\n${formatDate(note.createdAt)}\n${tags}\n\n${note.description || ''}`,
    });
  };

  const handleSoftDelete = (note: INote) => {
    setMenuNoteId(null);
    Alert.alert('Delete note?', 'It will stay in Trash for 30 days.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await NoteService.softDelete(note.id);
            fetchNotes();
          } catch (err: any) {
            Toast.show({type: 'error', text1: 'Delete failed'});
          }
        },
      },
    ]);
  };

  const handleRestore = async (note: INote) => {
    try {
      await NoteService.restore(note.id);
      Toast.show({type: 'success', text1: 'Note restored'});
      fetchNotes();
    } catch (err: any) {
      Toast.show({type: 'error', text1: 'Restore failed'});
    }
  };

  const handleDeleteSelected = () => {
    const count = selectedIds.length;
    const permanent = activeTab === 'trash';
    Alert.alert(
      permanent ? 'Delete forever?' : 'Delete selected notes?',
      permanent
        ? `${count} note${count > 1 ? 's' : ''} will be permanently deleted.`
        : `${count} note${count > 1 ? 's' : ''} will move to Trash.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(
                selectedIds.map(id =>
                  permanent
                    ? NoteService.deleteForever(id)
                    : NoteService.softDelete(id),
                ),
              );
              setSelectedIds([]);
              fetchNotes();
            } catch (err: any) {
              Toast.show({type: 'error', text1: 'Delete failed'});
            }
          },
        },
      ],
    );
  };

  const openNote = (note: INote) => {
    if (inSelectMode) {
      toggleSelect(note.id);
      return;
    }
    if (activeTab === 'trash') {
      return;
    }
    navigateTo(navigation, 'CreateNote', {note});
  };

  const canCreate = notes.length < NOTES_LIMIT;

  const goToCreate = () => {
    if (!canCreate) {
      Toast.show({type: 'error', text1: `Limit of ${NOTES_LIMIT} notes reached`});
      return;
    }
    navigateTo(navigation, 'CreateNote');
  };

  // ── Render pieces ─────────────────────────────────────────────────────────

  const renderHeader = () => (
    <View>
      {/* Gold hero */}
      <View className="h-[170px] bg-brand w-full px-5 pt-6">
        <Text className="font-cormorant text-white text-[32px] mb-1">Notes</Text>
        <Text className="font-dm-sans text-white text-[16px]">
          Keep Your Thoughts in One Place
        </Text>
      </View>

      {/* New Notes card overlapping the hero */}
      <View className="px-4 mt-[-55px]">
        <View className="bg-white rounded-[18px] p-4 shadow-sm shadow-slate-600">
          <TouchableOpacity
            onPress={goToCreate}
            activeOpacity={0.8}
            className="bg-brand rounded-[14px] py-4 flex-row items-center justify-center">
            <Plus color="white" size={20} />
            <Text className="font-cormorant text-white text-[18px] ml-2">
              New Notes
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View className="px-4 mt-5">
        <View className="flex-row items-center bg-white border border-[#E5E0D5] rounded-[12px] px-4">
          <Search size={18} color="#999" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search notes..."
            placeholderTextColor="#999"
            className="flex-1 ml-2 py-3 font-dm-sans text-[15px] text-gray-primary"
          />
        </View>
        <Text className="font-dm-sans text-[#7A7A7A] text-[14px] mt-3">
          {notes.length}/{NOTES_LIMIT} notes used
        </Text>
      </View>

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <View className="px-4 mt-3 flex-row flex-wrap gap-2">
          <TouchableOpacity
            onPress={() => setActiveTag(null)}
            className={`px-4 py-2 rounded-[8px] ${
              activeTag === null ? 'bg-brand' : 'bg-white border border-[#E5E0D5]'
            }`}>
            <Text
              className={`font-dm-sans text-[14px] ${
                activeTag === null ? 'text-white' : 'text-gray-primary'
              }`}>
              All
            </Text>
          </TouchableOpacity>
          {allTags.map(tag => (
            <TouchableOpacity
              key={tag.id}
              onPress={() => setActiveTag(activeTag === tag.id ? null : tag.id)}
              className={`px-4 py-2 rounded-[8px] flex-row items-center ${
                activeTag === tag.id ? 'bg-brand' : 'bg-white border border-[#E5E0D5]'
              }`}>
              <TagIcon
                size={14}
                color={activeTag === tag.id ? 'white' : '#2C2C2C'}
              />
              <Text
                className={`font-dm-sans text-[14px] ml-1 capitalize ${
                  activeTag === tag.id ? 'text-white' : 'text-gray-primary'
                }`}>
                {tag.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Active / Trash tabs */}
      <View className="px-4 mt-4">
        <View className="flex-row bg-white rounded-[12px] p-1">
          {(['active', 'trash'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                setActiveTab(tab);
                setSelectedIds([]);
                setMenuNoteId(null);
              }}
              className={`flex-1 py-3 rounded-[10px] items-center ${
                activeTab === tab ? 'bg-offWhite' : ''
              }`}>
              <Text
                className={`font-dm-sans text-[15px] ${
                  activeTab === tab
                    ? 'text-gray-primary font-semibold'
                    : 'text-[#999]'
                }`}>
                {tab === 'active' ? 'Active Notes' : 'Trash'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Multi-select bar */}
      {inSelectMode && (
        <View className="px-4 mt-3">
          <View className="flex-row items-center bg-white rounded-[12px] px-4 py-3">
            <Text className="font-dm-sans text-[#999] text-[14px] flex-1">
              {selectedIds.length} Selected
            </Text>
            <TouchableOpacity onPress={handleDeleteSelected} hitSlop={10}>
              <Trash2 size={20} color="#D92D20" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedIds([])}
              hitSlop={10}
              className="ml-6">
              <Text className="font-dm-sans text-gray-primary text-[16px]">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View className="items-center py-16">
          <ActivityIndicator size="large" color="#C1A36A" />
        </View>
      );
    }
    return (
      <View className="px-4 mt-4">
        <View className="bg-white border border-[#E5E0D5] rounded-[16px] items-center py-14 px-6">
          {activeTab === 'active' ? (
            <>
              <ClipboardList size={44} color="#8A8A8A" strokeWidth={1.4} />
              <Text className="font-cormorant text-[20px] text-gray-primary mt-4">
                No notes yet
              </Text>
              <Text className="font-dm-sans text-[#7A7A7A] text-[14px] mt-2 text-center">
                Create your first note to get started
              </Text>
              <TouchableOpacity
                onPress={goToCreate}
                className="bg-brand rounded-[12px] px-6 py-3 flex-row items-center mt-6">
                <Plus color="white" size={18} />
                <Text className="font-dm-sans text-white text-[15px] font-semibold ml-2">
                  Create Note
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Trash2 size={44} color="#8A8A8A" strokeWidth={1.4} />
              <Text className="font-cormorant text-[20px] text-gray-primary mt-4">
                Trash is empty
              </Text>
              <Text className="font-dm-sans text-[#7A7A7A] text-[14px] mt-2 text-center">
                Deleted notes will appear here for 30 days
              </Text>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderNote = ({item}: {item: INote}) => {
    const isSelected = selectedIds.includes(item.id);
    const menuOpen = menuNoteId === item.id;

    return (
      <View className="px-4 mt-4">
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => (menuOpen ? setMenuNoteId(null) : openNote(item))}
          onLongPress={() => activeTab === 'active' && toggleSelect(item.id)}
          className="bg-white border border-[#E5E0D5] rounded-[16px] p-4">
          <View className="flex-row items-start">
            {/* Selection circle (active tab) */}
            {activeTab === 'active' && (
              <TouchableOpacity
                onPress={() => toggleSelect(item.id)}
                hitSlop={8}
                className={`w-[20px] h-[20px] rounded-full border mr-3 mt-1 items-center justify-center ${
                  isSelected ? 'bg-brand border-brand' : 'border-brand'
                }`}>
                {isSelected && (
                  <Text className="text-white text-[11px] font-bold">✓</Text>
                )}
              </TouchableOpacity>
            )}

            <View className="flex-1">
              <Text className="font-cormorant text-[20px] text-gray-primary">
                {item.title}
              </Text>
              <View className="flex-row items-center mt-1 flex-wrap">
                <Calendar size={14} color="#C1A36A" />
                <Text className="font-dm-sans text-[#7A7A7A] text-[13px] ml-1">
                  {formatDate(item.createdAt)}
                </Text>
                {item.project_id ? (
                  <Text className="font-dm-sans text-[#7A7A7A] text-[13px] ml-2">
                    • Attached to project
                  </Text>
                ) : null}
              </View>
              {item.description ? (
                <Text
                  numberOfLines={2}
                  className="font-dm-sans text-[#9A9A9A] text-[13px] mt-1">
                  {item.description}
                </Text>
              ) : null}

              {item.tags?.length > 0 && (
                <View className="flex-row flex-wrap gap-2 mt-2">
                  {item.tags.map(tag => (
                    <View
                      key={tag.id}
                      className="bg-[#EFEAE0] rounded-[8px] px-3 py-1">
                      <Text className="font-dm-sans text-[12px] text-gray-primary capitalize">
                        {tag.name}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Right-side action: menu (active) or restore (trash) */}
            {activeTab === 'active' ? (
              <TouchableOpacity
                onPress={() => setMenuNoteId(menuOpen ? null : item.id)}
                hitSlop={10}
                className="ml-2 mt-1">
                <MoreVertical size={20} color="#2C2C2C" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => handleRestore(item)}
                hitSlop={10}
                className="ml-2 mt-1">
                <RotateCcw size={20} color="#C1A36A" />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>

        {/* Popover menu */}
        {menuOpen && (
          <View
            className="absolute right-8 top-12 bg-white rounded-[14px] px-4 py-2 z-50"
            style={{
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 4},
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}>
            <TouchableOpacity
              onPress={() => handleShare(item)}
              className="flex-row items-center py-2">
              <Share2 size={18} color="#2C2C2C" />
              <Text className="font-dm-sans text-[15px] text-gray-primary ml-3">
                Share
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleExport(item)}
              className="flex-row items-center py-2">
              <Upload size={18} color="#2C2C2C" />
              <Text className="font-dm-sans text-[15px] text-gray-primary ml-3">
                Export
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleSoftDelete(item)}
              className="flex-row items-center py-2">
              <Trash2 size={18} color="#D92D20" />
              <Text className="font-dm-sans text-[15px] text-[#D92D20] ml-3">
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-offWhite">
      <FlatList
        data={visibleNotes}
        keyExtractor={item => item.id}
        renderItem={renderNote}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={renderEmpty()}
        contentContainerStyle={{paddingBottom: 32}}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        // Keep the open popover menu above the cards below it
        CellRendererComponent={({children, style, ...props}: any) => (
          <View
            style={[style, menuNoteId ? {zIndex: props.index === visibleNotes.findIndex(n => n.id === menuNoteId) ? 10 : 0} : null]}
            {...props}>
            {children}
          </View>
        )}
      />
    </View>
  );
}
