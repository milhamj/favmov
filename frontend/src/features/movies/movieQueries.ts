import { favoritesKey } from '@/features/collections/collectionKeys';
import { useRefetchStaleOnFocus } from '@/hooks/useRefetchStaleOnFocus';
import { parseTmdbId } from '@/lib/util';
import { Movie } from './movieModel';
import { useInfiniteQuery, useQuery, QueryClient } from '@tanstack/react-query';
import {
  fetchTrendingMovies,
  fetchTrendingShows,
  fetchPopularMovies,
  fetchFavoriteMovies,
  searchMovie,
  fetchMovieDetails,
} from './movieService';

const sections: Record<string, typeof fetchTrendingMovies> = {
  'Trending Movies': fetchTrendingMovies,
  'Trending TV Shows': fetchTrendingShows,
  'Popular Movies': fetchPopularMovies,
};

export function useHomeMovies(section: string, authenticated: boolean, userId?: string) {
  const favorites = section === 'Your Favorites';
  const query = useQuery({
    queryKey: favorites ? favoritesKey(authenticated, userId) : ['movies', 'home', section, null],
    queryFn: async () => (favorites ? fetchFavoriteMovies() : sections[section]()),
    enabled: favorites ? authenticated : Object.keys(sections).includes(section),
    staleTime: Infinity,
  });
  useRefetchStaleOnFocus(query, favorites && authenticated);
  return query;
}

export function useExploreMovies(section: string) {
  return useInfiniteQuery({
    queryKey: ['movies', 'explore', section],
    queryFn: async ({ pageParam }) => sections[section](pageParam),
    enabled: Object.keys(sections).includes(section),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages, page) =>
      lastPage.length && page < 500 ? page + 1 : undefined,
    staleTime: Infinity,
  });
}

export function useSearchMovies(query: string, isTvShow: boolean, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['movies', 'search', { query, isTvShow }],
    queryFn: async ({ pageParam }) => searchMovie(query, pageParam, isTvShow),
    enabled: Boolean(query) && enabled,
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages, page) =>
      lastPage.movies.length && page < lastPage.totalPages && page < 500 ? page + 1 : undefined,
    staleTime: Infinity,
  });
}

export const movieDetailKey = (id: string, isTvShow = false) =>
  ['movies', 'detail', { id, isTvShow }] as const;

export function seedMovieDetails(client: QueryClient, movie: Movie) {
  const key = movieDetailKey(String(movie.id), movie.isTvShow === true);
  if (!client.getQueryData(key)) client.setQueryData(key, movie, { updatedAt: 0 });
}

export function movieDetailsOptions(id: string, isTvShow: boolean) {
  return {
    queryKey: movieDetailKey(id, isTvShow),
    queryFn: async () => fetchMovieDetails(id, isTvShow),
    staleTime: 0,
  };
}

export function useMovieDetails(id: string, isTvShow: boolean) {
  return useQuery({ ...movieDetailsOptions(id, isTvShow), enabled: parseTmdbId(id) !== null });
}
