import {Calendar, ChevronLeft, ClipboardList, Plus} from 'lucide-react-native';
import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import NoteService from '../../services/NoteService';
import {INote} from '../../../interface/note.interface';
import {goBack, navigateTo} from '../../utils/navigation';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};

export default function DesignNotesScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const designId: string = route.params?.designId;
  const designName: string | undefined = route.params?.designName;

  const [notes, setNotes] = useState<INote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await NoteService.getNotes({isActive: true, projectId: designId});
      setNotes(res.data);
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

  const goToCreate = () => {
    navigateTo(navigation, 'CreateNote', {projectId: designId});
  };

  const openNote = (note: INote) => {
    navigateTo(navigation, 'CreateNote', {note});
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

  const renderNote = ({item}: {item: INote}) => (
    <View className="px-4 mt-4">
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => openNote(item)}
        className="bg-white border border-[#E5E0D5] rounded-[16px] p-4">
        <Text className="font-cormorant text-[20px] text-gray-primary">
          {item.title}
        </Text>
        <View className="flex-row items-center mt-1">
          <Calendar size={14} color="#C1A36A" />
          <Text className="font-dm-sans text-[#7A7A7A] text-[13px] ml-1">
            {formatDate(item.createdAt)}
          </Text>
        </View>
        {item.description ? (
          <Text
            numberOfLines={2}
            className="font-dm-sans text-[#9A9A9A] text-[13px] mt-1">
            {item.description}
          </Text>
        ) : null}
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-offWhite">
      <View className="bg-brand px-5 pt-14 pb-5 flex-row items-center">
        <ChevronLeft color="white" size={24} onPress={() => goBack(navigation)} />
        <View className="ml-4 flex-1">
          <Text className="font-cormorant text-white text-[24px]">Notes</Text>
          {designName ? (
            <Text className="font-dm-sans text-white opacity-90 text-[13px]" numberOfLines={1}>
              {designName}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={goToCreate} hitSlop={10}>
          <Plus color="white" size={24} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notes}
        keyExtractor={item => item.id}
        renderItem={renderNote}
        ListEmptyComponent={renderEmpty()}
        contentContainerStyle={{paddingBottom: 32}}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
