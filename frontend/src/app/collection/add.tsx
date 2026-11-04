import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, Image, TouchableOpacity, View, Text, ScrollView } from 'react-native';
import { Movie } from '../../model/movieModel';
import { getUserCollections, getCheckMovieExistInCollection } from '../../services/collectionService';
import { CollectionCard } from '../../model/collectionModel';
import Toast from 'react-native-toast-message';
import CollectionAddCard from '../../components/CollectionAddCard';
import { Success } from '../../model/apiResponse';
import PageContainer from '../../components/PageContainer';
import TopBar from '../../components/TopBar';
import withAuth from '../../components/withAuth';
import { router } from '../../navigation/router';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { usePreventRemove } from '@react-navigation/native';
import { parseBooleanParam } from '../../utils/util';
import CreateCollectionSheet from '../../components/CreateCollectionSheet';
import { fetchMovieDetails } from '../../services/movieService';
import { CollectionStateStore } from '../../stores/collectionStateStore';
import { MovieStore } from '../../stores/movieStore';

const AddToCollectionPage = withAuth(() => {
    const params = useLocalSearchParams();
    const rawId = Array.isArray(params.movie_id) ? params.movie_id[0] : params.movie_id;
    const movieId = rawId && /^\d+$/.test(rawId) ? Number(rawId) : NaN;
    const isTvShow = parseBooleanParam(params.is_tv_show);
    
    const [movie, setMovie] = useState<Movie | null>(null);
    const shortTitle = movie?.title ? movie.title.substring(0, 20) : 'title';
    const [collectionCards, setCollectionCards] = useState<CollectionCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const [draining, setDraining] = useState(false);
    const [creating, setCreating] = useState(false);
    const saves = useRef(new Map<string, () => Promise<boolean>>());
    const leaving = useRef(false);
    const navigation = useNavigation();
    const registerSave = useCallback((id: string, save: (() => Promise<boolean>) | null) => {
        if (save) saves.current.set(id, save);
        else saves.current.delete(id);
    }, []);
    const leave = useCallback(async (next: () => void) => {
        if (leaving.current) return;
        leaving.current = true;
        setDraining(true);
        try {
            const results = await Promise.all([...saves.current.values()].map(save => save()));
            if (results.every(Boolean)) {
                next();
            }
        } finally { leaving.current = false; setDraining(false); }
    }, []);
    usePreventRemove(true, ({ data }) => {
        void leave(() => navigation.dispatch(data.action));
    });

    useEffect(() => {
        let current = true;
        setMovie(null);
        setIsLoading(true);
        setError('');
        const load = async () => {
            try {
                if (!Number.isSafeInteger(movieId) || movieId <= 0) throw new globalThis.Error('Invalid title URL');
                const cached = MovieStore.getCachedMovieAndDelete(String(movieId), isTvShow);
                const [details, membership, collections] = await Promise.all([
                    cached ? Promise.resolve(new Success(cached)) : fetchMovieDetails(String(movieId), isTvShow),
                    getCheckMovieExistInCollection(String(movieId), isTvShow), getUserCollections()
                ]);
                if (!current) return;
                if (!(details instanceof Success)) throw details;
                if (!(membership instanceof Success)) throw membership;
                if (!(collections instanceof Success)) throw collections;
                const restored = new Movie({ ...details.data, isTvShow, collections: membership.data });
                setMovie(restored);
                setCollectionCards(collections.data.map(c => new CollectionCard(c.id, c.name, membership.data.some(m => m.id === c.id))));
            } catch (failure: any) {
                if (current) setError(failure.message || 'Unable to load title');
            } finally { if (current) setIsLoading(false); }
        };
        void load();
        return () => { current = false; };
    }, [movieId, isTvShow, attempt]);
    const refreshCollections = async () => {
        const result = await getUserCollections();
        if (result instanceof Success) {
            setCollectionCards(previous => result.data.map(c => previous.find(p => p.id === c.id) || new CollectionCard(c.id, c.name, false)));
            CollectionStateStore.setLastUpdated(Date.now());
        } else Toast.show({ type: 'error', text1: 'Unable to refresh collections', text2: result.message });
    };
    const handleCreateCollection = () => setCreating(true);

    return (
            <PageContainer>
                <TopBar
                    title= { `Add ${shortTitle} to Collection` }
                    backButton={{
                      isShow: true,
                      onClick: () => router.goBackSafely()
                    }}
                />
                <ScrollView style={styles.content}>
                    {
                        isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator style={styles.loadingItem} size="large" color="tomato" />
                            </View>
                        ) : error ? (
                            <View><Text>{error}</Text><TouchableOpacity accessibilityRole="button" onPress={() => setAttempt(n => n + 1)}><Text>Retry</Text></TouchableOpacity></View>
                        ) : collectionCards.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Image 
                                    source={require('../../../assets/empty_search.png')} 
                                    style={styles.emptyImage} 
                                />
                                <Text style={styles.emptyText}>
                                    You don't have any collections yet.
                                </Text>
                                <TouchableOpacity 
                                    style={styles.createButton}
                                    disabled={draining}
                                    onPress={handleCreateCollection}
                                >
                                    <Text style={styles.createButtonText}>Create Collection</Text>
                                </TouchableOpacity>
                            </View>

                        ) : (
                            <View style={styles.listContent}>
                                {collectionCards.map(item => <CollectionAddCard key={`${movieId}-${isTvShow}-${item.id}`} collection={item} movie={movie!} registerSave={registerSave} disabled={draining}/>)}
                            </View>
                        )
                    }
                </ScrollView>
                <CreateCollectionSheet visible={creating} onClose={(success) => {
                    setCreating(false);
                    if (success) void refreshCollections();
                }}/>
                <Toast />
            </PageContainer> 
    )
})

const styles = StyleSheet.create({
    content: {
        padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingItem: {
      height: 100
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    emptyImage: {
      width: 120,
      height: 120,
      marginBottom: 20,
      opacity: 0.8,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      textAlign: 'center',
      marginBottom: 8,
    },
    createButton: {
      backgroundColor: 'tomato',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      width: '80%',
      alignItems: 'center',
      marginTop: 16,
    },
    createButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    listContent: {
        paddingBottom: 16,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 4,
    },
})

export default AddToCollectionPage;