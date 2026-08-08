import api from '../config/api';
import {BlogPost, BlogPostsResponse} from '../../interface/blog.interface';

const BlogService = {
  async getPosts(): Promise<BlogPost[]> {
    const res = await api.get<BlogPostsResponse>('/blog-posts');
    return res.data.data ?? [];
  },
};

export default BlogService;
