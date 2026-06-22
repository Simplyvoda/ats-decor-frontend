import api from '../config/api';
import {IDesignResponse, IDesignsResponse} from '../../interface/design.interface';

const DesignService = {
  async upload(fileUrl: string, name: string): Promise<IDesignResponse> {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUrl,
      type: 'model/vnd.usdz+zip',
      name: 'scan.usdz',
    } as any);
    formData.append('name', name);

    const res = await api.post('/designs', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
      timeout: 120_000,
    });
    return res.data;
  },

  async getDesigns(): Promise<IDesignsResponse> {
    const res = await api.get('/designs');
    return res.data;
  },

  async deleteDesign(id: string): Promise<void> {
    await api.delete(`/designs/${id}`);
  },
};

export default DesignService;
