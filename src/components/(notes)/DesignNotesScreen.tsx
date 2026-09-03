import {Calendar, ChevronLeft, ClipboardList, Plus} from 'lucide-react-native';
import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import NoteService from '../../services/NoteService';
import {IDraftNote, INote} from '../../../interface/note.interface';
import {goBack, navigateTo} from '../../utils/navigation';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};

type ListItem =
  | {kind: 'note'; key: string; note: INote}
  | {kind: 'draft'; key: string; draft: IDraftNote};

export default function DesignNotesScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const designId: string | undefined = route.params?.designId;
  const designName: string | undefined = route.params?.designName;
  // No designId means the design hasn't been saved yet — notes created here
  // have nowhere to attach to, so they're held as local drafts until it is.
  const fromARViewer = !designId;

  const [notes, setNotes] = useState<INote[]>([]);
  const [drafts, setDrafts] = useState<IDraftNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    try {
      const [savedRes, draftList] = await Promise.all([
        designId
          ? NoteService.getNotes({isActive: true, projectId: designId})
          : Promise.resolve(null),
        NoteService.getDraftNotes(),
      ]);
      setNotes(savedRes?.data ?? []);
      setDrafts(draftList);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not load notes',
        text2: err.response?.data?.message || err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [designId]);

  useFocusEffect(
    useCallback(() => {
      fetchNotes();
    }, [fetchNotes]),
  );

  const items: ListItem[] = [
    ...drafts.map(d => ({kind: 'draft' as const, key: d.localId, draft: d})),
    ...notes.map(n => ({kind: 'note' as const, key: n.id, note: n})),
  ];

  const goToCreate = () => {
    navigateTo(navigation, 'CreateNote', {
      projectId: designId,
      fromARViewer,
    });
  };

  const openItem = (item: ListItem) => {
    if (item.kind === 'draft') {
      navigateTo(navigation, 'CreateNote', {draft: item.draft, fromARViewer});
    } else {
      navigateTo(navigation, 'CreateNote', {note: item.note});
    }
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View className="items-center py-16">
          <ActivityIndicator size="large" color="#C1A36A" />
        </View>
      );
    }
    return (
      <View className="px-4 mt-6">
        <View className="bg-white border border-[#E5E0D5] rounded-[16px] items-center py-14 px-6">
          <ClipboardList size={44} color="#8A8A8A" strokeWidth={1.4} />
          <Text className="font-cormorant text-[20px] text-gray-primary mt-4">
            No notes yet
          </Text>
          <Text className="font-dm-sans text-[#7A7A7A] text-[14px] mt-2 text-center">
            Create a note to keep track of ideas for this design
          </Text>
          <TouchableOpacity
            onPress={goToCreate}
            className="bg-brand rounded-[12px] px-6 py-3 flex-row items-center mt-6">
            <Plus color="white" size={18} />
            <Text className="font-dm-sans text-white text-[15px] font-semibold ml-2">
              Create Note
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderItem = ({item}: {item: ListItem}) => {
    const isDraft = item.kind === 'draft';
    const title = isDraft ? item.draft.title : item.note.title;
    const description = isDraft ? item.draft.description : item.note.description;
    const createdAt = isDraft ? item.draft.createdAt : item.note.createdAt;

    return (
      <View className="px-4 mt-4">
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => openItem(item)}
          className="bg-white border border-[#E5E0D5] rounded-[16px] p-4">
          <View className="flex-row items-start justify-between">
            <Text
              className="font-cormorant text-[20px] text-gray-primary flex-1"
              numberOfLines={1}>
              {title}
            </Text>
            {isDraft && (
              <View className="bg-[#F2E9D8] rounded-full px-3 py-1 ml-2">
                <Text className="font-dm-sans text-[11px] text-brand font-semibold">
                  Draft
                </Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center mt-1">
            <Calendar size={14} color="#C1A36A" />
            <Text className="font-dm-sans text-[#7A7A7A] text-[13px] ml-1">
              {formatDate(createdAt)}
            </Text>
          </View>
          {description ? (
            <Text
              numberOfLines={2}
              className="font-dm-sans text-[#9A9A9A] text-[13px] mt-1">
              {description}
            </Text>
          ) : null}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-offWhite" edges={['top']}>
      <View className="px-5 pt-2 pb-4 flex-row items-center">
        <ChevronLeft
          color="#2C2C2C"
          size={24}
          onPress={() => goBack(navigation)}
        />
        <View className="ml-4 flex-1">
          <Text className="font-cormorant text-gray-primary text-[24px]">
            Notes
          </Text>
          {designName ? (
            <Text
              className="font-dm-sans text-[#7A7A7A] text-[13px]"
              numberOfLines={1}>
              {designName}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={goToCreate}
          className="bg-brand rounded-full px-4 py-2 flex-row items-center">
          <Plus color="white" size={16} />
          <Text className="font-dm-sans text-white text-[13px] font-semibold ml-1">
            Add Notes
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty()}
        contentContainerStyle={{paddingBottom: 32}}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
