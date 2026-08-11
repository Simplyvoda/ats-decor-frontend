export interface BlogPost {
  _id: string;
  title: string;
  short_description: string;
  slug: {current: string};
  mainImage: {
    asset: {_id: string; url: string};
    alt?: string;
  };
  body: any[];
  datePosted: string;
  author: string;
}

export interface BlogPostsResponse {
  status: string;
  message: string;
  data: BlogPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
