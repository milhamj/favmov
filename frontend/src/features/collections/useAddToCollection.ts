import { useAuth } from '@/features/auth/useAuth';
import { CollectionCard } from '@/features/collections/collectionModel';
import {
  collectionsOptions,
  containingCollectionsOptions,
} from '@/features/collections/collectionQueries';
import { Movie } from '@/features/movies/movieModel';
import { movieDetailKey, movieDetailsOptions } from '@/features/movies/movieQueries';
import { parseBooleanParam, parseTmdbId } from '@/lib/util';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

const LEAVE_TIMEOUT = 15000;

export function useAddToCollection(params: ReturnType<typeof useLocalSearchParams>) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const titleId = parseTmdbId(params.movie_id);
  const movieId = titleId ?? NaN;
  const isTvShow = parseBooleanParam(params.is_tv_show);
  const validMovieId = titleId !== null;

  const [movie, setMovie] = useState<Movie | null>(null);
  const shortTitle = movie
    ? movie.title.length > 20
      ? movie.title.substring(0, 20) + '...'
      : movie.title
    : '';
  const [collectionCards, setCollectionCards] = useState<CollectionCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [draining, setDraining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [refreshError, setRefreshError] = useState('');
  const [refreshingCollections, setRefreshingCollections] = useState(false);
  const [pendingCards, setPendingCards] = useState<Set<string>>(new Set());
  const updatePending = useCallback((id: string, pending: boolean) => {
    setPendingCards((previous) => {
      if (previous.has(id) === pending) return previous;
      const next = new Set(previous);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  const saves = useRef(new Map<string, () => Promise<boolean>>());
  const leaving = useRef(false);
  const pendingAction = useRef<NavigationAction | null>(null);
  const [leaveFailed, setLeaveFailed] = useState(false);
  const [discard, setDiscard] = useState(false);
  const navigation = useNavigation();
  const registerSave = useCallback((id: string, save: (() => Promise<boolean>) | null) => {
    if (save) saves.current.set(id, save);
    else saves.current.delete(id);
  }, []);
  const leave = useCallback(
    async (action: NavigationAction) => {
      if (leaving.current) return;
      leaving.current = true;
      pendingAction.current = action;
      setLeaveFailed(false);
      setDraining(true);
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const results = await Promise.race([
          Promise.all([...saves.current.values()].map((save) => save())),
          // A stalled request must not hide the way out.
          new Promise<boolean[]>((resolve) => {
            timer = setTimeout(() => resolve([false]), LEAVE_TIMEOUT);
          }),
        ]);
        if (results.every(Boolean)) {
          pendingAction.current = null;
          navigation.dispatch(action);
        } else setLeaveFailed(true);
      } finally {
        clearTimeout(timer);
        leaving.current = false;
        setDraining(false);
      }
    },
    [navigation],
  );
  usePreventRemove(!discard && pendingCards.size > 0, ({ data }) => {
    void leave(data.action);
  });
  useEffect(() => {
    if (pendingCards.size === 0 && !leaving.current) {
      setLeaveFailed(false);
      pendingAction.current = null;
    }
  }, [pendingCards, leaveFailed]);
  useEffect(() => {
    if (discard && pendingAction.current) {
      const action = pendingAction.current;
      pendingAction.current = null;
      navigation.dispatch(action);
    }
  }, [discard, navigation]);

  useEffect(() => {
    let current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset loading before the asynchronous editor load without changing save/leave timing.
    setMovie(null);
    setIsLoading(true);
    setError('');
    const load = async () => {
      try {
        if (!validMovieId) throw new globalThis.Error('Invalid title URL');
        const cached = queryClient.getQueryData<Movie>(movieDetailKey(String(movieId), isTvShow));
        // Always re-read membership: cached notes can be stale, and saving over them would lose newer text.
        const [details, membership, collections] = await Promise.all([
          cached?.title.trim()
            ? Promise.resolve(cached)
            : queryClient.fetchQuery(movieDetailsOptions(String(movieId), isTvShow)),
          queryClient.fetchQuery(containingCollectionsOptions(String(movieId), isTvShow, user?.id)),
          queryClient.fetchQuery({ ...collectionsOptions(user?.id), staleTime: 0 }),
        ]);
        if (!current) return;

        const restored: Movie = { ...details, isTvShow, collections: membership };
        setMovie(restored);
        setCollectionCards(
          collections
            .map((c) => ({
              id: c.id,
              name: c.name,
              isInCollection: membership.some((m) => m.id === c.id),
            }))
            .sort((a, b) => Number(b.isInCollection) - Number(a.isInCollection)),
        );
      } catch (failure: unknown) {
        if (current)
          setError(
            (failure instanceof globalThis.Error && failure.message) || 'Unable to load title',
          );
      } finally {
        if (current) setIsLoading(false);
      }
    };
    void load();
    return () => {
      current = false;
    };
  }, [movieId, validMovieId, isTvShow, attempt, queryClient, user?.id]);
  const refreshCollections = async () => {
    setRefreshingCollections(true);
    try {
      const data = await queryClient.fetchQuery({ ...collectionsOptions(user?.id), staleTime: 0 });
      // Mounted cards own their saved state and pending edits, so keep them and only add new collections.
      setCollectionCards((cards) => [
        ...cards,
        ...data
          .filter((c) => !cards.some((card) => card.id === c.id))
          .map((c) => ({ id: c.id, name: c.name, isInCollection: false })),
      ]);
      setRefreshError('');
    } catch (failure: unknown) {
      setRefreshError(failure instanceof globalThis.Error ? failure.message : '');
    }
    setRefreshingCollections(false);
  };
  const handleCreateCollection = () => setCreating(true);

  return {
    movie,
    shortTitle,
    collectionCards,
    isLoading,
    error,
    setAttempt,
    draining,
    creating,
    setCreating,
    refreshError,
    refreshingCollections,
    pendingCards,
    updatePending,
    leaveFailed,
    discard,
    setDiscard,
    registerSave,
    refreshCollections,
    handleCreateCollection,
    validMovieId,
  };
}
