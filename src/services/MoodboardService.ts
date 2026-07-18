import api from '../config/api';
import {IMoodboardResponse} from '../../interface/design.interface';

const MoodboardService = {
  async getMoodboard(): Promise<IMoodboardResponse> {
    const res = await api.get('/moodboard');
    return res.data;
  },

  async like(designId: string): Promise<void> {
    await api.post(`/moodboard/${designId}`);
  },

  async unlike(designId: string): Promise<void> {
    await api.delete(`/moodboard/${designId}`);
  },
};

export default MoodboardService;
