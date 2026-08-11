import api from '../config/api';
import {BlogPostsResponse} from '../../interface/blog.interface';

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
};

export default BlogService;
