import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, ScrollView } from 'react-native';
import { Movie } from '../../model/movieModel';
import { getUserCollections, getCheckMovieExistInCollection } from '../../services/collectionService';
import { CollectionCard } from '../../model/collectionModel';
import Toast from 'react-native-toast-message';
import RetryButton from '../../components/RetryButton';
import CollectionAddCard from '../../components/CollectionAddCard';
import { Success } from '../../model/apiResponse';
import PageContainer from '../../components/PageContainer';
import TopBar from '../../components/TopBar';
import AppButton from '../../components/AppButton';
import EmptyState from '../../components/EmptyState';
import FullPageLoader from '../../components/FullPageLoader';
import withAuth from '../../components/withAuth';
import { router } from '../../navigation/router';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from '@react-navigation/native';
import { parseBooleanParam, parseStrParam } from '../../utils/util';
import CreateCollectionSheet from '../../components/CreateCollectionSheet';
import { fetchMovieDetails } from '../../services/movieService';
import { CollectionStateStore } from '../../stores/collectionStateStore';
import { MovieStore } from '../../stores/movieStore';

const LEAVE_TIMEOUT = 15000;

const AddToCollectionPage = withAuth(() => {
    const params = useLocalSearchParams();
    const rawId = parseStrParam(params.movie_id);
    const movieId = /^\d+$/.test(rawId) ? Number(rawId) : NaN;
    const isTvShow = parseBooleanParam(params.is_tv_show);
    const validMovieId = Number.isSafeInteger(movieId) && movieId > 0;
    
    const [movie, setMovie] = useState<Movie | null>(null);
    const shortTitle = movie ? (movie.title.length > 20 ? movie.title.substring(0, 20) + '...' : movie.title) : '';
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
        setPendingCards(previous => {
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
    const leave = useCallback(async (action: NavigationAction) => {
        if (leaving.current) return;
        leaving.current = true;
        pendingAction.current = action;
        setLeaveFailed(false);
        setDraining(true);
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
            const results = await Promise.race([
                Promise.all([...saves.current.values()].map(save => save())),
                // A stalled request must not hide the way out.
                new Promise<boolean[]>(resolve => { timer = setTimeout(() => resolve([false]), LEAVE_TIMEOUT); }),
            ]);
            if (results.every(Boolean)) {
                pendingAction.current = null;
                navigation.dispatch(action);
            } else setLeaveFailed(true);
        } finally { clearTimeout(timer); leaving.current = false; setDraining(false); }
    }, [navigation]);
    usePreventRemove(!discard && pendingCards.size > 0, ({ data }) => { void leave(data.action); });
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
        setMovie(null);
        setIsLoading(true);
        setError('');
        const load = async () => {
            try {
                if (!validMovieId) throw new globalThis.Error('Invalid title URL');
                const cached = MovieStore.getCachedMovie(String(movieId), isTvShow);
                // Always re-read membership: cached notes can be stale, and saving over them would lose newer text.
                const [details, membership, collections] = await Promise.all([
                    cached?.title.trim() ? Promise.resolve(new Success(cached)) : fetchMovieDetails(String(movieId), isTvShow),
                    getCheckMovieExistInCollection(String(movieId), isTvShow), getUserCollections()
                ]);
                if (!current) return;
                if (!(details instanceof Success)) throw details;
                if (!(membership instanceof Success)) throw membership;
                if (!(collections instanceof Success)) throw collections;
                const restored = new Movie({ ...details.data, isTvShow, collections: membership.data });
                MovieStore.deleteMovie(String(movieId), isTvShow);
                setMovie(restored);
                setCollectionCards(collections.data.map(c => new CollectionCard(c.id, c.name, membership.data.some(m => m.id === c.id))).sort((a, b) => Number(b.isInCollection) - Number(a.isInCollection)));
            } catch (failure: any) {
                if (current) setError(failure.message || 'Unable to load title');
            } finally { if (current) setIsLoading(false); }
        };
        void load();
        return () => { current = false; };
    }, [movieId, validMovieId, isTvShow, attempt]);
    const refreshCollections = async () => {
        setRefreshingCollections(true);
        const result = await getUserCollections();
        if (result instanceof Success) {
            setCollectionCards(result.data.map(c => new CollectionCard(c.id, c.name, false)));
            setRefreshError('');
        } else setRefreshError(result.message);
        setRefreshingCollections(false);
    };
    const handleCreateCollection = () => setCreating(true);

    return (
            <PageContainer>
                <TopBar
                    title={movie ? `Add ${shortTitle} to Collection` : 'Add to Collection'}
                    backButton={{
                      isShow: true,
                      onClick: () => router.goBackSafely()
                    }}
                />
                {leaveFailed && pendingCards.size > 0 && <View accessibilityRole="alert" style={styles.leaveError}>
                    <Text>Your latest edits could not be saved.</Text>
                    <Text>Try again, or leave and discard your unsaved edits.</Text>
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Leave without saving" style={styles.discardButton} onPress={() => setDiscard(true)}><Text>Leave without saving</Text></TouchableOpacity>
                </View>}
                <ScrollView style={styles.content}>
                    {
                        isLoading ? (
                            <View style={styles.loadingContainer}>
                                <FullPageLoader />
                            </View>
                        ) : error ? (
                            <RetryButton message={error} onPress={validMovieId ? () => setAttempt(n => n + 1) : undefined}/>
                        ) : refreshError && collectionCards.length === 0 ? null : collectionCards.length === 0 ? (
                            <EmptyState title="You don't have any collections yet." illustration={require('../../../assets/empty_search.png')}>
                                <AppButton label="Create Collection" style={styles.createButton} onPress={handleCreateCollection} disabled={draining} />
                            </EmptyState>

                        ) : (
                            <View style={styles.listContent}>
                                {collectionCards.map(item => <CollectionAddCard key={`${movie!.id}-${movie!.isTvShow}-${item.id}`} collection={item} movie={movie!} registerSave={registerSave} onPendingChange={updatePending} disabled={draining || discard} discarding={discard}/>)}
                            </View>
                        )
                    }
                    {refreshError && <RetryButton message={`Unable to refresh collections: ${refreshError}`} disabled={draining || refreshingCollections} onPress={() => void refreshCollections()}/>}
                </ScrollView>
                <CreateCollectionSheet visible={creating} onClose={(success) => {
                    setCreating(false);
                    if (success) {
                        CollectionStateStore.setLastUpdated(Date.now());
                        void refreshCollections();
                    }
                }}/>
                <Toast />
            </PageContainer> 
    )
})

const styles = StyleSheet.create({
    leaveError: { padding: 16, backgroundColor: '#fff0ec' },
    discardButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, marginTop: 8, borderWidth: 1, borderColor: '#b8321c', borderRadius: 6, alignSelf: 'flex-start' },
    content: {
        padding: 16,
    },
    loadingContainer: {
      minHeight: 100,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    createButton: { width: '80%', marginTop: 16 },
    listContent: {
        paddingBottom: 16,
    },
})

export default AddToCollectionPage;