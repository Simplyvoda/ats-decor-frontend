import {useCallback, useEffect, useRef, useState} from 'react';
import BlogService from '../services/BlogService';
import {BlogPost} from '../../interface/blog.interface';

const LIMIT = 15;

export default function useBlogFeed() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'ASC' | 'DESC'>('DESC');

  // Debounce raw typing so we're not hitting the API on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Guards against a slow, now-stale request overwriting a newer one
  // (e.g. a search request that resolves after the user has typed again)
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      const thisRequest = ++requestId.current;
      if (replace) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      try {
        const res = await BlogService.getPosts({
          page: pageToLoad,
          limit: LIMIT,
          search: debouncedSearch || undefined,
          sort,
        });
        if (thisRequest !== requestId.current) {
          return;
        }
        setPosts(prev => (replace ? res.data : [...prev, ...res.data]));
        setPage(res.page);
        setTotalPages(res.totalPages);
      } catch (error) {
        console.error('Failed to fetch blog posts:', error);
      } finally {
        if (thisRequest === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [debouncedSearch, sort],
  );

  // Reset to page 1 whenever the search term or sort order changes
  // (also covers the initial load on mount)
  useEffect(() => {
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, sort]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || page >= totalPages) {
      return;
    }
    fetchPage(page + 1, false);
  }, [loading, loadingMore, page, totalPages, fetchPage]);

  return {
    posts,
    loading,
    loadingMore,
    hasMore: page < totalPages,
    search,
    setSearch,
    sort,
    setSort,
    loadMore,
  };
}
