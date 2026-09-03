import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';
import {
  ICreateNotePayload,
  IDraftNote,
  INoteResponse,
  INotesResponse,
} from '../../interface/note.interface';

// Notes jotted from the AR viewer before its design has been saved have
// nowhere to attach to yet — they're held here as pending drafts until the
// design is saved, at which point each is created with that design's id.
const PENDING_NOTE_DRAFTS_KEY = 'pendingNoteDrafts';

const NoteService = {
  async getNotes(params: {
    isActive: boolean;
    search?: string;
    tag?: string;
    page?: number;
    limit?: number;
    projectId?: string;
  }): Promise<INotesResponse> {
    const res = await api.get('/notes', {
      params: {
        is_active: String(params.isActive),
        search: params.search || undefined,
        tag: params.tag || undefined,
        page: params.page ?? 1,
        limit: params.limit ?? 50,
        project_id: params.projectId || undefined,
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

  async getDraftNotes(): Promise<IDraftNote[]> {
    const raw = await AsyncStorage.getItem(PENDING_NOTE_DRAFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  async saveDraftNote(payload: ICreateNotePayload): Promise<IDraftNote> {
    const drafts = await this.getDraftNotes();
    const draft: IDraftNote = {
      localId: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: payload.title,
      description: payload.description ?? '',
      is_private: payload.is_private ?? false,
      project_id: payload.project_id ?? null,
      tags: payload.tags ?? [],
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(
      PENDING_NOTE_DRAFTS_KEY,
      JSON.stringify([...drafts, draft]),
    );
    return draft;
  },

  async updateDraftNote(
    localId: string,
    payload: ICreateNotePayload,
  ): Promise<void> {
    const drafts = await this.getDraftNotes();
    const updated = drafts.map(d =>
      d.localId === localId
        ? {
            ...d,
            title: payload.title,
            description: payload.description ?? '',
            is_private: payload.is_private ?? false,
            tags: payload.tags ?? [],
          }
        : d,
    );
    await AsyncStorage.setItem(PENDING_NOTE_DRAFTS_KEY, JSON.stringify(updated));
  },

  async deleteDraftNote(localId: string): Promise<void> {
    const drafts = await this.getDraftNotes();
    await AsyncStorage.setItem(
      PENDING_NOTE_DRAFTS_KEY,
      JSON.stringify(drafts.filter(d => d.localId !== localId)),
    );
  },

  async clearDraftNotes(): Promise<void> {
    await AsyncStorage.removeItem(PENDING_NOTE_DRAFTS_KEY);
  },
};

export default NoteService;
