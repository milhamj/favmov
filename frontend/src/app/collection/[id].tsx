import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import PageContainer from '../../components/PageContainer';
import TopBar from '../../components/TopBar';
import AppButton from '../../components/AppButton';
import EmptyState from '../../components/EmptyState';
import RetryButton from '../../components/RetryButton';
import FullPageLoader from '../../components/FullPageLoader';
import withAuth from '../../components/withAuth';
import { Success } from '../../model/apiResponse';
import { Movie } from '../../model/movieModel';
import { getCollectionDetail } from '../../services/collectionService';
import { Collection } from '../../model/collectionModel';
import { parseStrParam } from '../../utils/util';
import { router } from '../../navigation/router';
import { routes } from '../../navigation/routes';
import { MovieStore } from '../../stores/movieStore';
import MovieCardHorizontal from '../../components/MovieCardHorizontal';
import { CollectionStateStore } from '../../stores/collectionStateStore';

const CollectionDetailPage = withAuth(() => {
    const params = useLocalSearchParams();
    const collectionId = parseStrParam(params.id);
    const [collection, setCollection] = useState(null as Collection | null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const lastFetchedTimestamp = useRef<number | null>(null);

    const fetchCollectionDetail = async () => {
        setIsLoading(true);
        setError('');
        const result = await getCollectionDetail(collectionId);
        if (result instanceof Success) {
            setCollection(result.data);
            lastFetchedTimestamp.current = Date.now();
        } else {
            setError(result.message);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: result.message,
                position: 'bottom',
            });
        }
        setIsLoading(false);
    }

    useEffect(() => {
        fetchCollectionDetail();
    }, [collectionId]);

    useFocusEffect(
        useCallback(() => {
            const collectionLastUpdated = CollectionStateStore.getLastUpdated();
            if (collectionLastUpdated
                && lastFetchedTimestamp.current
                && collectionLastUpdated > lastFetchedTimestamp.current) {
                fetchCollectionDetail();
            }
        }, [collectionId])
    )

    const handleEmptyButton = () => {
        router.navigate(routes.search);
    }

    const renderMovieItem = ({ item, index }: { item: Movie, index: number }) => {
        const isFirstItem = index === 0;
        const isLastItem = collection?.movies?.length === index + 1;
        return (
            <View style={[
                styles.movieCard,
                {
                    marginTop: isFirstItem ? 16 : 0,
                    marginBottom: isLastItem ? 16 : 8
                }
                ]}>
                <MovieCardHorizontal
                    movie={item}
                    onClick={() => {
                        MovieStore.cacheMovie(item);
                        router.navigate(routes.movie(item.id, item.isTvShow))
                    }}
                />
            </View>
        );
    };

    return (
        <PageContainer>
            <TopBar
                title={ collection?.name ? collection.name : 'Collection' }
                backButton={ {
                    isShow: true,
                    onClick: () => router.goBackSafely()
                } }
            />
            <View style={styles.container}>
                { isLoading ? (
                    <FullPageLoader />
                ) : error ? (
                    <RetryButton message={error} onPress={() => void fetchCollectionDetail()} />
                ) : collection?.movies?.length === 0 ? (
                    <EmptyState title="No movies or TV show in this collection." description="Browse movies and TV shows to add them to this collection." illustration={require('../../../assets/empty_search.png')}>
                        <AppButton label="Search Movies or TV Shows" style={styles.createButton} onPress={handleEmptyButton} />
                    </EmptyState>
                ) : (
                    <FlatList
                        data={collection?.movies}
                        renderItem={renderMovieItem}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={1}
                    />
                )}
            </View>
            <Toast/>
        </PageContainer>
    )
});

const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
    },
    createButton: { width: '80%', marginTop: 16 },
    movieCard: {
        width: '100%',
        marginBottom: 8,
        paddingHorizontal: 2,
        alignContent: 'center'
    },

})

export default CollectionDetailPage;
