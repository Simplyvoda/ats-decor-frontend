export interface IDesign {
  id: string;
  name: string;
  user_id: string;
  storage_path: string;
  file_url: string;
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
