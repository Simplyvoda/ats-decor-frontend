import api from '../config/api';
import {
  BlogCommentResponse,
  BlogCommentsResponse,
  BlogLikeResponse,
  BlogPostsResponse,
} from '../../interface/blog.interface';

const BlogService = {
  async getPosts(params: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: 'ASC' | 'DESC';
  }): Promise<BlogPostsResponse> {
    const res = await api.get<BlogPostsResponse>('/blog-posts', {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 15,
        search: params.search || undefined,
        sort: params.sort ?? 'DESC',
      },
    });
    return res.data;
  },

  async getComments(
    postId: string,
    params: {page?: number; limit?: number} = {},
  ): Promise<BlogCommentsResponse> {
    const res = await api.get<BlogCommentsResponse>(
      `/blog-posts/${postId}/comments`,
      {params: {page: params.page ?? 1, limit: params.limit ?? 20}},
    );
    return res.data;
  },

  async postComment(
    postId: string,
    body: string,
    parentId?: string,
  ): Promise<BlogCommentResponse> {
    const res = await api.post<BlogCommentResponse>(
      `/blog-posts/${postId}/comments`,
      {body, parent_id: parentId},
    );
    return res.data;
  },

  async getLikeStatus(postId: string): Promise<BlogLikeResponse> {
    const res = await api.get<BlogLikeResponse>(`/blog-posts/${postId}/likes`);
    return res.data;
  },

  async like(postId: string): Promise<BlogLikeResponse> {
    const res = await api.post<BlogLikeResponse>(`/blog-posts/${postId}/like`);
    return res.data;
  },

  async unlike(postId: string): Promise<BlogLikeResponse> {
    const res = await api.delete<BlogLikeResponse>(`/blog-posts/${postId}/like`);
    return res.data;
  },
};

export default BlogService;
