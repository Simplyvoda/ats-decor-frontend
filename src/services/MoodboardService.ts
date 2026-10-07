import api from '../config/api';
import {IMoodboardResponse} from '../../interface/design.interface';
import {bumpDataVersion} from '../utils/dataVersion';

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
};

export default MoodboardService;
