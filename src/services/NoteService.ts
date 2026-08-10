import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';
import {
  ICreateNotePayload,
  INoteResponse,
  INotesResponse,
} from '../../interface/note.interface';

// A note jotted from the AR viewer before its design has been saved has
// nowhere to attach to yet — it's held here as a single pending draft until
// the design is saved, at which point it's created with that design's id.
const PENDING_AR_NOTE_DRAFT_KEY = 'pendingArNoteDraft';

const NoteService = {
  async getNotes(params: {
    isActive: boolean;
    search?: string;
    tag?: string;
    page?: number;
    limit?: number;
  }): Promise<INotesResponse> {
    const res = await api.get('/notes', {
      params: {
        is_active: String(params.isActive),
        search: params.search || undefined,
        tag: params.tag || undefined,
        page: params.page ?? 1,
        limit: params.limit ?? 50,
      },
    });
    return res.data;
  },

  async createNote(payload: ICreateNotePayload): Promise<INoteResponse> {
    const res = await api.post('/notes', payload);
    return res.data;
  },

  async updateNote(
    id: string,
    payload: Partial<ICreateNotePayload>,
  ): Promise<INoteResponse> {
    const res = await api.patch(`/notes/${id}`, payload);
    return res.data;
  },

  async softDelete(id: string): Promise<INoteResponse> {
    const res = await api.patch(`/notes/${id}/soft-delete`);
    return res.data;
  },

  async restore(id: string): Promise<INoteResponse> {
    const res = await api.patch(`/notes/${id}/restore`);
    return res.data;
  },

  async deleteForever(id: string): Promise<void> {
    await api.delete(`/notes/${id}`);
  },

  async saveDraftNote(payload: ICreateNotePayload): Promise<void> {
    await AsyncStorage.setItem(PENDING_AR_NOTE_DRAFT_KEY, JSON.stringify(payload));
  },

  async getDraftNote(): Promise<ICreateNotePayload | null> {
    const raw = await AsyncStorage.getItem(PENDING_AR_NOTE_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  async clearDraftNote(): Promise<void> {
    await AsyncStorage.removeItem(PENDING_AR_NOTE_DRAFT_KEY);
  },
};

export default NoteService;
