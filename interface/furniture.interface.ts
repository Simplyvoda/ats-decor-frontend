export interface IFurniture {
  id: string;
  name: string;
  category: string;
  model_url: string;
  thumbnail_url: string | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IFurnitureResponse {
  status: string;
  message: string;
  data: IFurniture[];
}
