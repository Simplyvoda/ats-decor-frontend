import api from '../config/api';
import {
  IRoom,
  IRoomResponse,
  IRoomSpec,
  IRoomsResponse,
  RoomSource,
} from '../../interface/room.interface';
import {bumpDataVersion} from '../utils/dataVersion';

type UploadKind = 'model' | 'scan_data';

// Gets a one-time link from the server and uploads straight to storage
// with it, so big room models don't pass through the API server.
// Returns the storage key to hand back to the server.
async function uploadToStorage(
  kind: UploadKind,
  body: Blob | string,
): Promise<string> {
  const res = await api.post('/rooms/upload-url', {kind});
  const {upload_url, headers, key} = res.data.data;
  const put = await fetch(upload_url, {method: 'PUT', headers, body});
  if (!put.ok) {
    throw new Error(`Upload failed (${put.status})`);
  }
  return key;
}

async function uploadModel(fileUrl: string): Promise<string> {
  const file = await (await fetch(fileUrl)).blob();
  try {
    return await uploadToStorage('model', file);
  } finally {
    // Frees the native copy of the file held behind the blob
    (file as any).close?.();
  }
}

export type NewRoom =
  | {
      source: 'scanned';
      name: string;
      modelFileUrl: string; // file:// .usdz from the scan
      scanData?: string; // the scan's metadata JSON, if any
    }
  | {
      source: 'manual';
      name: string;
      modelFileUrl: string; // file:// .usdz from the room builder
      spec: IRoomSpec;
    };

const RoomService = {
  async getRooms(): Promise<IRoomsResponse> {
    const res = await api.get('/rooms');
    return res.data;
  },

  async getRoom(id: string): Promise<IRoomResponse> {
    const res = await api.get(`/rooms/${id}`);
    return res.data;
  },

  async createRoom(room: NewRoom): Promise<IRoom> {
    const form = new FormData();
    form.append('name', room.name);
    form.append('source', room.source satisfies RoomSource);
    form.append('model_key', await uploadModel(room.modelFileUrl));
    if (room.source === 'manual') {
      form.append('spec', JSON.stringify(room.spec));
    } else if (room.scanData && room.scanData !== '{}') {
      // Not essential: a failed upload just means no raw scan data kept.
      try {
        form.append(
          'scan_data_key',
          await uploadToStorage('scan_data', room.scanData),
        );
      } catch {}
    }
    const res = await api.post('/rooms', form, {
      headers: {'Content-Type': 'multipart/form-data'},
      timeout: 120_000,
    });
    bumpDataVersion('rooms');
    return res.data.data;
  },

  async rename(id: string, name: string): Promise<IRoom> {
    const form = new FormData();
    form.append('name', name);
    const res = await api.patch(`/rooms/${id}`, form, {
      headers: {'Content-Type': 'multipart/form-data'},
    });
    bumpDataVersion('rooms');
    return res.data.data;
  },

  // New dimensions for a manual room. Every design made from it follows.
  async updateDimensions(
    id: string,
    spec: IRoomSpec,
    modelFileUrl: string,
  ): Promise<IRoom> {
    const form = new FormData();
    form.append('spec', JSON.stringify(spec));
    form.append('model_key', await uploadModel(modelFileUrl));
    const res = await api.patch(`/rooms/${id}`, form, {
      headers: {'Content-Type': 'multipart/form-data'},
      timeout: 120_000,
    });
    bumpDataVersion('rooms', 'designs');
    return res.data.data;
  },

  async undo(id: string): Promise<IRoom> {
    const res = await api.post(`/rooms/${id}/undo`);
    bumpDataVersion('rooms', 'designs');
    return res.data.data;
  },

  // `designs` is needed when the room has designs: delete them too, or
  // keep them (they're detached and show "Room deleted").
  async deleteRoom(id: string, designs?: 'delete' | 'keep'): Promise<void> {
    await api.delete(`/rooms/${id}`, {params: designs ? {designs} : {}});
    bumpDataVersion('rooms', 'designs');
  },
};

export default RoomService;
