import {
  Calendar,
  Lock,
  Paperclip,
  Pencil,
  Save,
  Tag as TagIcon,
  X,
} from 'lucide-react-native';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
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
import {IDraftNote, INote} from '../../../interface/note.interface';
import {IDesign} from '../../../interface/design.interface';
import {goBack} from '../../utils/navigation';
import {NOTES_LIMIT} from './NotesScreen';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};

export default function CreateNoteScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();

  // View/edit an existing saved note, or a locally-held draft (a note
  // jotted before its design was saved — see NoteService's draft methods).
  const existingNote: INote | undefined = route.params?.note;
  const existingDraft: IDraftNote | undefined = route.params?.draft;
  const isEditingExisting = !!existingNote || !!existingDraft;
  const presetProjectId: string | undefined = route.params?.projectId;
  // Opened from the AR viewer's Notes shortcut — the note always belongs to
  // whatever design is open there, so there's nothing to pick manually. If
  // that design hasn't been saved yet (no presetProjectId), the note is held
  // as a draft until the design is saved.
  const fromARViewer: boolean = route.params?.fromARViewer ?? false;

  // Existing notes/drafts open read-only first; "Update" switches to the form.
  const [mode, setMode] = useState<'view' | 'edit'>(
    isEditingExisting ? 'view' : 'edit',
  );

  const [title, setTitle] = useState(
    existingNote?.title ?? existingDraft?.title ?? '',
  );
  const [description, setDescription] = useState(
    existingNote?.description ?? existingDraft?.description ?? '',
  );
  const [isPrivate, setIsPrivate] = useState(
    existingNote?.is_private ?? existingDraft?.is_private ?? false,
  );
  const [projectId, setProjectId] = useState<string | null>(
    existingNote?.project_id ?? existingDraft?.project_id ?? presetProjectId ?? null,
  );
  const [tags, setTags] = useState<string[]>(
    existingNote?.tags?.map(t => t.name) ?? existingDraft?.tags ?? [],
  );
  const [tagInput, setTagInput] = useState('');
  const [projects, setProjects] = useState<IDesign[]>([]);
  const [notesUsed, setNotesUsed] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!fromARViewer) {
      DesignService.getDesigns()
        .then(res => setProjects(res.data))
        .catch(() => {});
    }
    NoteService.getNotes({isActive: true})
      .then(res => setNotesUsed(res.total))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [initialSnapshot] = useState({
    title: existingNote?.title ?? existingDraft?.title ?? '',
    description: existingNote?.description ?? existingDraft?.description ?? '',
    isPrivate: existingNote?.is_private ?? existingDraft?.is_private ?? false,
    projectId:
      existingNote?.project_id ?? existingDraft?.project_id ?? presetProjectId ?? null,
    tags: existingNote?.tags?.map(t => t.name) ?? existingDraft?.tags ?? [],
  });

  const hasChanges =
    title !== initialSnapshot.title ||
    description !== initialSnapshot.description ||
    isPrivate !== initialSnapshot.isPrivate ||
    projectId !== initialSnapshot.projectId ||
    tags.length !== initialSnapshot.tags.length ||
    tags.some((t, i) => t !== initialSnapshot.tags[i]);

  const canSave = title.trim().length > 0 && !isSaving && hasChanges;

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  // `navigateAway: false` is used by the unsaved-changes guard below, which
  // drives navigation itself once the save has gone through.
  const handleSave = async (opts: {navigateAway?: boolean} = {}) => {
    const navigateAway = opts.navigateAway ?? true;
    if (!canSave) {
      return false;
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

      if (existingDraft) {
        await NoteService.updateDraftNote(existingDraft.localId, payload);
        Toast.show({type: 'success', text1: 'Draft updated'});
        if (navigateAway) {
          goBack(navigation);
        }
        return true;
      }

      // Design not saved yet — hold the note as a draft until it is.
      if (fromARViewer && !projectId && !existingNote) {
        await NoteService.saveDraftNote(payload);
        Toast.show({
          type: 'success',
          text1: 'Note saved as draft',
          text2: "It'll attach automatically when you save the design",
        });
        if (navigateAway) {
          goBack(navigation);
        }
        return true;
      }

      if (existingNote) {
        await NoteService.updateNote(existingNote.id, payload);
      } else {
        await NoteService.createNote(payload);
      }
      Toast.show({
        type: 'success',
        text1: existingNote ? 'Note updated' : 'Note saved',
      });
      if (navigateAway) {
        goBack(navigation);
      }
      return true;
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not save note',
        text2: err.response?.data?.message || err.message,
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Prompt before leaving the form with unsaved changes — covers the back
  // chevron, hardware back, and swipe-back gestures alike.
  useEffect(() => {
    const unsubscribe = (navigation as any).addListener(
      'beforeRemove',
      (e: any) => {
        if (mode !== 'edit' || !hasChanges || isSaving) {
          return;
        }
        e.preventDefault();
        Alert.alert(
          'Unsaved changes',
          'Do you want to save your changes before leaving?',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Discard',
              style: 'destructive',
              onPress: () => navigation.dispatch(e.data.action),
            },
            {
              text: 'Save',
              onPress: async () => {
                const saved = await handleSave({navigateAway: false});
                if (saved) {
                  navigation.dispatch(e.data.action);
                }
              },
            },
          ],
        );
      },
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, mode, hasChanges, isSaving, canSave, title, description, isPrivate, projectId, tags]);

  const isDraftNote = !!existingDraft;
  const attachedProjectName = projects.find(p => p.id === projectId)?.name;

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
          {mode === 'view' ? (
            <TouchableOpacity
              onPress={() => setMode('edit')}
              className="flex-row items-center rounded-[12px] px-4 py-2 bg-brand">
              <Pencil size={16} color="white" />
              <Text className="font-dm-sans text-white font-semibold ml-2">
                Update
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => handleSave()}
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
          )}
        </View>

        {mode === 'view' ? (
          <ScrollView
            className="flex-1 px-5"
            showsVerticalScrollIndicator={false}>
            <View className="bg-white border border-[#E5E0D5] rounded-[14px] px-4 py-4 mb-4">
              <View className="flex-row items-start justify-between mb-2">
                <Text
                  className="font-cormorant text-[22px] text-gray-primary flex-1 mr-2">
                  {title}
                </Text>
                {isDraftNote && (
                  <View className="bg-[#F2E9D8] rounded-full px-3 py-1">
                    <Text className="font-dm-sans text-[11px] text-brand font-semibold">
                      Draft
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center mb-3">
                <Calendar size={14} color="#C1A36A" />
                <Text className="font-dm-sans text-[#7A7A7A] text-[13px] ml-1">
                  {formatDate(
                    existingNote?.createdAt ?? existingDraft?.createdAt ?? '',
                  )}
                </Text>
                {isPrivate && (
                  <View className="flex-row items-center ml-3">
                    <Lock size={12} color="#2C2C2C" />
                    <Text className="font-dm-sans text-[#7A7A7A] text-[12px] ml-1">
                      Private
                    </Text>
                  </View>
                )}
              </View>

              {description ? (
                <Text className="font-dm-sans text-[15px] text-gray-primary leading-6">
                  {description}
                </Text>
              ) : (
                <Text className="font-dm-sans text-[14px] text-[#9A9A9A] italic">
                  No description
                </Text>
              )}
            </View>

            {tags.length > 0 && (
              <View className="bg-white border border-[#E5E0D5] rounded-[14px] px-4 py-4 mb-4">
                <View className="flex-row items-center mb-2">
                  <TagIcon size={16} color="#C1A36A" />
                  <Text className="font-cormorant text-[17px] text-gray-primary ml-2">
                    Tags
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {tags.map(tag => (
                    <View
                      key={tag}
                      className="bg-[#EFEAE0] rounded-[8px] px-3 py-1">
                      <Text className="font-dm-sans text-[13px] text-gray-primary capitalize">
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {attachedProjectName && (
              <View className="bg-white border border-[#E5E0D5] rounded-[14px] px-4 py-4 mb-4">
                <View className="flex-row items-center">
                  <Paperclip size={16} color="#C1A36A" />
                  <Text className="font-cormorant text-[17px] text-gray-primary ml-2">
                    Attached to {attachedProjectName}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        ) : (
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

              {/* Creating from a specific design's Notes page already implies
                  the project — nothing to pick, so skip the dropdown. */}
              {!fromARViewer && !presetProjectId && (
                <>
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
                </>
              )}
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
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
