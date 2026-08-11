export interface BlogAuthorBox {
  name: string;
  title?: string;
  bio?: string;
  image?: {
    asset: {_id: string; url: string};
  };
  socialLinks?: {
    platform: string;
    url: string;
  }[];
}

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
  authorBox?: BlogAuthorBox;
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

export interface BlogCommentAuthor {
  name: string;
  profilePicture: string | null;
}

export interface BlogComment {
  id: string;
  body: string;
  createdAt: string;
  author: BlogCommentAuthor;
}

export interface BlogCommentsResponse {
  status: string;
  message: string;
  data: BlogComment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BlogCommentResponse {
  status: string;
  message: string;
  data: BlogComment;
}

export interface BlogLikeStatus {
  likes_count: number;
  liked_by_me: boolean;
}

export interface BlogLikeResponse {
  status: string;
  message: string;
  data: BlogLikeStatus;
}
