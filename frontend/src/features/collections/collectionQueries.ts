import { useRefetchStaleOnFocus } from '@/hooks/useRefetchStaleOnFocus';
import { useCallback, useRef, useLayoutEffect } from 'react';
import { useFocusEffect } from 'expo-router/react-navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { parseTmdbId } from '@/lib/util';
import {
  getUserCollections,
  getCollectionDetail,
  getCheckMovieExistInCollection,
} from './collectionService';

export const containingCollectionsKey = (id: string, isTvShow: boolean) =>
  ['collections', 'containing', { id, isTvShow }] as const;

export const containingCollectionsOptions = (id: string, isTvShow: boolean, userId?: string) => ({
  queryKey: [...containingCollectionsKey(id, isTvShow), { userId }] as const,
  queryFn: async () => getCheckMovieExistInCollection(id, isTvShow),
  staleTime: 0,
});

export function useContainingCollections(id: string, isTvShow: boolean) {
  const { isAuthenticated, user } = useAuth();
  const query = useQuery({
    ...containingCollectionsOptions(id, isTvShow, user?.id),
    enabled: isAuthenticated && parseTmdbId(id) !== null,
    gcTime: 0,
  });
  const { refetch } = query;
  const current = useRef({ query, isAuthenticated });
  useLayoutEffect(() => {
    current.current = { query, isAuthenticated };
  });
  useFocusEffect(
    useCallback(() => {
      if (current.current.isAuthenticated && current.current.query.isFetchedAfterMount)
        void refetch();
    }, [refetch]),
  );
  return query;
}

export const collectionsOptions = (userId?: string) => ({
  queryKey: ['collections', 'list', { userId }] as const,
  queryFn: async () => getUserCollections(),
  staleTime: Infinity,
});

export function useCollections() {
  const { isAuthenticated, user } = useAuth();
  const query = useQuery({ ...collectionsOptions(user?.id), enabled: isAuthenticated });
  useRefetchStaleOnFocus(query, isAuthenticated);
  return query;
}

export function useCollection(id: string) {
  const { isAuthenticated, user } = useAuth();
  const query = useQuery({
    queryKey: ['collections', 'detail', { id, userId: user?.id }],
    queryFn: async () => getCollectionDetail(id),
    enabled: isAuthenticated,
    staleTime: Infinity,
  });
  useRefetchStaleOnFocus(query, isAuthenticated);
  return query;
}
