import api from '../config/api';
import {
  IMoodboard,
  IMoodboardResponse,
  IMoodboardSummary,
} from '../../interface/design.interface';
import {bumpDataVersion} from '../utils/dataVersion';

// Saved designs are what the heart adds; boards are named collections of
// them. Unliking a design takes it off every board.
const MoodboardService = {
  async getMoodboard(): Promise<IMoodboardResponse> {
    const res = await api.get('/moodboard');
    return res.data;
  },

  async like(designId: string): Promise<void> {
    await api.post(`/moodboard/${designId}`);
    bumpDataVersion('moodboard');
  },

  async unlike(designId: string): Promise<void> {
    await api.delete(`/moodboard/${designId}`);
    bumpDataVersion('moodboard');
  },

  // Clears one saved item by its own id (e.g. the placeholder left when a
  // saved design is deleted). Takes it off every board.
  async removeItem(itemId: string): Promise<void> {
    await api.delete(`/moodboard/items/${itemId}`);
    bumpDataVersion('moodboard');
  },

  // ── Boards ──

  async getBoards(): Promise<IMoodboardSummary[]> {
    const res = await api.get('/moodboard/boards');
    return res.data.data;
  },

  async createBoard(name: string): Promise<IMoodboard> {
    const res = await api.post('/moodboard/boards', {name});
    bumpDataVersion('moodboard');
    return res.data.data;
  },

  async renameBoard(id: string, name: string): Promise<IMoodboard> {
    const res = await api.patch(`/moodboard/boards/${id}`, {name});
    bumpDataVersion('moodboard');
    return res.data.data;
  },

  async deleteBoard(id: string): Promise<void> {
    await api.delete(`/moodboard/boards/${id}`);
    bumpDataVersion('moodboard');
  },

  // Saves the design too if it isn't saved yet.
  async addToBoard(boardId: string, designId: string): Promise<void> {
    await api.post(`/moodboard/boards/${boardId}/designs/${designId}`);
    bumpDataVersion('moodboard');
  },

  async removeFromBoard(boardId: string, designId: string): Promise<void> {
    await api.delete(`/moodboard/boards/${boardId}/designs/${designId}`);
    bumpDataVersion('moodboard');
  },
};

export default MoodboardService;
