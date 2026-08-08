import api from '../config/api';
import {
  ICreateNotePayload,
  INoteResponse,
  INotesResponse,
} from '../../interface/note.interface';

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
};

export default NoteService;
