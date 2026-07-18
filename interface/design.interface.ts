export interface IDesignTag {
  id: string;
  name: string;
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
  views_count: number;
  likes_count: number;
  tags?: IDesignTag[];
  liked_by_me?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IDesignsResponse {
  status: string;
  message: string;
  data: IDesign[];
}

export interface IDesignResponse {
  status: string;
  message: string;
  data: IDesign;
}

export interface IMoodboardItem {
  id: string;
  user_id: string;
  design_id: string;
  design: IDesign;
  createdAt: string;
}

export interface IMoodboardResponse {
  status: string;
  message: string;
  data: IMoodboardItem[];
}

export interface IPublishDesignPayload {
  name: string;
  style?: string;
  tags?: string[];
  isPublic: boolean;
  thumbnailPath: string; // local file path from the native snapshot
  modelUrl: string; // file:// uploads the USDZ; bundle:///https passes through
}
