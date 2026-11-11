export interface IDesignTag {
  id: string;
  name: string;
}

// One placed furniture piece, as produced by the native AR view's
// exportFurnitureLayout() and consumed by placeFurnitureFromLayoutCommand().
export interface IPlacedFurniture {
  modelUrl: string;
  position: [number, number, number];
  rotation: [number, number, number, number];
  scale: [number, number, number];
  isFlat: boolean;
}

export interface IDesign {
  id: string;
  name: string;
  user_id: string;
  storage_path: string;
  file_url: string;
  is_public: boolean;
  thumbnail_url: string | null;
  style: string | null;
  furniture_layout: IPlacedFurniture[] | null;
  // The room this design was started from (null for a design whose room
  // was deleted; room_snapshot then has the room's name)
  room_id?: string | null;
  room_snapshot?: {name: string} | null;
  room_detached_at?: string | null;
  // Set once a free-plan user spends their watermark-free export on it
  export_unlocked_at?: string | null;
  views_count: number;
  likes_count: number;
  tags?: IDesignTag[];
  liked_by_me?: boolean;
  is_mine?: boolean; // set on the explore feed — enables "remove from Explore"
  createdAt: string;
  updatedAt: string;
}

export interface IDesignsResponse {
  status: string;
  message: string;
  data: IDesign[];
  // Only present on paged requests (see DesignService.getExplore)
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface IDesignResponse {
  status: string;
  message: string;
  data: IDesign;
}

// Whether a saved design can still be seen. Anything but 'available'
// means design is null and the app shows an empty frame saying why:
//   design_deleted  — its creator deleted it
//   account_deleted — its creator deleted their account
//   unpublished     — its creator took it off Explore
export type SavedStatus =
  | 'available'
  | 'design_deleted'
  | 'account_deleted'
  | 'unpublished';

export interface IMoodboardItem {
  id: string;
  user_id: string;
  // Null once the design is deleted
  design_id: string | null;
  design: IDesign | null;
  status: SavedStatus;
  createdAt: string;
  // Boards this saved design is on (only on the saved-designs list)
  board_ids?: string[];
}

export interface IMoodboardResponse {
  status: string;
  message: string;
  data: IMoodboardItem[];
}

// A named collection of saved designs
export interface IMoodboard {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMoodboardSummary extends IMoodboard {
  item_count: number;
  // Up to 4 thumbnails of its newest designs
  cover_urls: string[];
}


export interface IPublishDesignPayload {
  name: string;
  style?: string;
  tags?: string[];
  isPublic: boolean;
  thumbnailPath: string; // local file path from the native snapshot
  modelUrl: string; // file:// uploads the USDZ; bundle:///https passes through
  roomId?: string; // the saved room it starts from; no model is sent then
  furnitureLayout?: string; // JSON-encoded IPlacedFurniture[], from exportFurnitureLayoutCommand
}
