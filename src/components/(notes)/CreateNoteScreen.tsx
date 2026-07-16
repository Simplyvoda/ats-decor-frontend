import {Lock, Paperclip, Save, Tag as TagIcon, X} from 'lucide-react-native';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import NoteService from '../../services/NoteService';
import DesignService from '../../services/DesignService';
import {INote} from '../../../interface/note.interface';
import {IDesign} from '../../../interface/design.interface';
import {goBack} from '../../utils/navigation';
import {NOTES_LIMIT} from './NotesScreen';

export default function CreateNoteScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();

  // Edit mode when an existing note is passed; projectId can be preset
  // (e.g. jotting a note from the AR viewer)
  const existingNote: INote | undefined = route.params?.note;
  const presetProjectId: string | undefined = route.params?.projectId;

  const [title, setTitle] = useState(existingNote?.title ?? '');
  const [description, setDescription] = useState(
    existingNote?.description ?? '',
  );
  const [isPrivate, setIsPrivate] = useState(existingNote?.is_private ?? false);
  const [projectId, setProjectId] = useState<string | null>(
    existingNote?.project_id ?? presetProjectId ?? null,
  );
  const [tags, setTags] = useState<string[]>(
    existingNote?.tags?.map(t => t.name) ?? [],
  );
  const [tagInput, setTagInput] = useState('');
  const [projects, setProjects] = useState<IDesign[]>([]);
  const [notesUsed, setNotesUsed] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    DesignService.getDesigns()
      .then(res => setProjects(res.data))
      .catch(() => {});
    NoteService.getNotes({isActive: true})
      .then(res => setNotesUsed(res.total))
      .catch(() => {});
  }, []);

  const canSave = title.trim().length > 0 && !isSaving;

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  const handleSave = async () => {
    if (!canSave) {
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        is_private: isPrivate,
        project_id: projectId ?? undefined,
        tags,
      };
      if (existingNote) {
        await NoteService.updateNote(existingNote.id, payload);
      } else {
        await NoteService.createNote(payload);
      }
      Toast.show({
        type: 'success',
        text1: existingNote ? 'Note updated' : 'Note saved',
      });
      goBack(navigation);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not save note',
        text2: err.response?.data?.message || err.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-offWhite">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-4">
          <TouchableOpacity onPress={() => goBack(navigation)} hitSlop={10}>
            <X size={24} color="#2C2C2C" />
          </TouchableOpacity>
          <Text className="font-cormorant text-[28px] text-gray-primary">
            Notes
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave}
            className={`flex-row items-center rounded-[12px] px-4 py-2 ${
              canSave ? 'bg-brand' : 'bg-[#E8DFC9]'
            }`}>
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Save size={16} color="white" />
            )}
            <Text className="font-dm-sans text-white font-semibold ml-2">
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-5"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View className="bg-white border border-[#E5E0D5] rounded-[14px] px-4 mb-4">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Notes title..."
              placeholderTextColor="#8A8A8A"
              className="font-cormorant text-[18px] text-gray-primary py-4"
            />
          </View>

          {/* Body */}
          <View className="bg-white border border-[#E5E0D5] rounded-[14px] px-4 py-3 mb-4 min-h-[220px]">
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Start writing your note..."
              placeholderTextColor="#8A8A8A"
              multiline
              textAlignVertical="top"
              className="font-dm-sans text-[15px] text-gray-primary min-h-[200px]"
            />
          </View>

          {/* Tags */}
          <View className="bg-white border border-[#E5E0D5] rounded-[14px] px-4 py-4 mb-4">
            <View className="flex-row items-center mb-2">
              <TagIcon size={16} color="#C1A36A" />
              <Text className="font-cormorant text-[17px] text-gray-primary ml-2">
                Tags
              </Text>
            </View>
            {tags.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => setTags(tags.filter(t => t !== tag))}
                    className="bg-[#EFEAE0] rounded-[8px] px-3 py-1 flex-row items-center">
                    <Text className="font-dm-sans text-[13px] text-gray-primary capitalize">
                      {tag}
                    </Text>
                    <X size={12} color="#7A7A7A" style={{marginLeft: 4}} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TextInput
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addTag}
              onBlur={addTag}
              placeholder="Add a tag and press return"
              placeholderTextColor="#999"
              autoCapitalize="none"
              className="font-dm-sans text-[14px] text-gray-primary border border-[#E5E0D5] rounded-[10px] px-3 py-2"
            />
          </View>

          {/* Private + project */}
          <View className="bg-white border border-[#E5E0D5] rounded-[14px] px-4 py-4 mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Lock size={16} color="#2C2C2C" />
                <Text className="font-cormorant text-[17px] text-gray-primary ml-2">
                  Private Note
                </Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{true: '#C1A36A', false: '#E5E0D5'}}
                thumbColor="white"
              />
            </View>

            <View className="flex-row items-center mb-2">
              <Paperclip size={16} color="#C1A36A" />
              <Text className="font-cormorant text-[17px] text-gray-primary ml-2">
                Attach to project
              </Text>
            </View>
            <Dropdown
              data={[
                {label: 'None', value: ''},
                ...projects.map(p => ({label: p.name, value: p.id})),
              ]}
              labelField="label"
              valueField="value"
              value={projectId ?? ''}
              onChange={item => setProjectId(item.value || null)}
              placeholder="Project (Optional)"
              placeholderStyle={{color: '#999', fontSize: 14}}
              selectedTextStyle={{color: '#2C2C2C', fontSize: 14}}
              style={{
                borderWidth: 1,
                borderColor: '#E5E0D5',
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            />
          </View>

          {/* Quota banner */}
          {notesUsed !== null && (
            <View className="bg-[#F2E9D8] border border-brand rounded-[12px] px-4 py-4 mb-8">
              <Text className="font-dm-sans text-[15px] text-gray-primary">
                {notesUsed}/{NOTES_LIMIT} notes used
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
