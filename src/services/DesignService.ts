import api from '../config/api';
import {
  IDesignResponse,
  IDesignsResponse,
  IPublishDesignPayload,
} from '../../interface/design.interface';

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

  async publish(payload: IPublishDesignPayload): Promise<IDesignResponse> {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('is_public', String(payload.isPublic));
    if (payload.style) {
      formData.append('style', payload.style);
    }
    if (payload.tags?.length) {
      formData.append('tags', JSON.stringify(payload.tags));
    }
    if (payload.furnitureLayout) {
      formData.append('furniture_layout', payload.furnitureLayout);
    }

    const thumbUri = payload.thumbnailPath.startsWith('file://')
      ? payload.thumbnailPath
      : `file://${payload.thumbnailPath}`;
    formData.append('thumbnail', {
      uri: thumbUri,
      type: 'image/png',
      name: 'thumbnail.png',
    } as any);

    // Local scans upload the USDZ; bundled/hosted models pass the reference
    if (payload.modelUrl.startsWith('file://')) {
      formData.append('file', {
        uri: payload.modelUrl,
        type: 'model/vnd.usdz+zip',
        name: 'design.usdz',
      } as any);
    } else {
      formData.append('model_url', payload.modelUrl);
    }

    const res = await api.post('/designs/publish', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
      timeout: 120_000,
    });
    return res.data;
  },

  // Same shape as publish(), but replaces an already-saved design in place
  // instead of creating a new one.
  async update(
    id: string,
    payload: IPublishDesignPayload,
  ): Promise<IDesignResponse> {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('is_public', String(payload.isPublic));
    if (payload.style) {
      formData.append('style', payload.style);
    }
    if (payload.tags?.length) {
      formData.append('tags', JSON.stringify(payload.tags));
    }
    if (payload.furnitureLayout) {
      formData.append('furniture_layout', payload.furnitureLayout);
    }

    const thumbUri = payload.thumbnailPath.startsWith('file://')
      ? payload.thumbnailPath
      : `file://${payload.thumbnailPath}`;
    formData.append('thumbnail', {
      uri: thumbUri,
      type: 'image/png',
      name: 'thumbnail.png',
    } as any);

    // A design's room scan is set once at creation — there's no rescan
    // feature, so unlike publish() this never sends a model file/URL; the
    // backend ignores this route's file field regardless.

    const res = await api.patch(`/designs/${id}`, formData, {
      headers: {'Content-Type': 'multipart/form-data'},
      timeout: 120_000,
    });
    return res.data;
  },

  async getExplore(): Promise<IDesignsResponse> {
    const res = await api.get('/designs/explore');
    return res.data;
  },

  async addView(id: string): Promise<void> {
    await api.post(`/designs/${id}/view`);
  },

  // Publish to / remove from Explore without touching anything else
  async setVisibility(id: string, isPublic: boolean): Promise<IDesignResponse> {
    const res = await api.patch(`/designs/${id}/visibility`, {
      is_public: isPublic,
    });
    return res.data;
  },

  async deleteDesign(id: string): Promise<void> {
    await api.delete(`/designs/${id}`);
  },
};

export default DesignService;
