export interface IDesignTemplate {
  id: string;
  title: string;
  type: string;
  image_url: string | null;
  model_url: string;
  tags: {id: string; name: string}[];
  createdAt: string;
  updatedAt: string;
}

export interface IDesignTemplatesResponse {
  status: string;
  message: string;
  data: IDesignTemplate[];
}
