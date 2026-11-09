import {SetStateAction, useCallback, useEffect, useRef, useState} from 'react';
import BlogService from '../services/BlogService';
import {BlogPost} from '../../interface/blog.interface';

const LIMIT = 15;

// `enabled` holds the first request back until the feed is actually on
// screen. Once started it stays loaded, so leaving the Blog tab and coming
// back doesn't fetch again.
export default function useBlogFeed(enabled: boolean = true) {
  const [started, setStarted] = useState(enabled);
  useEffect(() => {
    if (enabled) {
      setStarted(true);
    }
  }, [enabled]);

  // Everything about the loaded list, updated together per request.
  const [feed, setFeed] = useState<{
    posts: BlogPost[];
    page: number;
    totalPages: number;
    loading: boolean;
    loadingMore: boolean;
  }>({posts: [], page: 1, totalPages: 1, loading: true, loadingMore: false});
  const {posts, page, totalPages, loading, loadingMore} = feed;

  // What the user asked for: the search box and the sort order.
  const [query, setQuery] = useState<{search: string; sort: 'ASC' | 'DESC'}>({
    search: '',
    sort: 'DESC',
  });
  const {search, sort} = query;
  const setSearch = useCallback(
    (next: string) => setQuery(q => ({...q, search: next})),
    [],
  );
  const setSort = useCallback(
    (next: SetStateAction<'ASC' | 'DESC'>) =>
      setQuery(q => ({
        ...q,
        sort: typeof next === 'function' ? next(q.sort) : next,
      })),
    [],
  );

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
      setFeed(f =>
        replace ? {...f, loading: true} : {...f, loadingMore: true},
      );
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
        setFeed(f => ({
          ...f,
          posts: replace ? res.data : [...f.posts, ...res.data],
          page: res.page,
          totalPages: res.totalPages,
        }));
      } catch (error) {
        console.error('Failed to fetch blog posts:', error);
      } finally {
        if (thisRequest === requestId.current) {
          setFeed(f => ({...f, loading: false, loadingMore: false}));
        }
      }
    },
    [debouncedSearch, sort],
  );

  // Reset to page 1 whenever the search term or sort order changes
  // (also covers the initial load on mount)
  useEffect(() => {
    if (!started) {
      return;
    }
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, sort, started]);

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
