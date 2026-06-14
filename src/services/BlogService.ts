import api from '../config/api';

const BlogService = {
  async getPosts() {
    const res = await api.get('/blog-posts');
    return res.data;
  },
};

export default BlogService;
