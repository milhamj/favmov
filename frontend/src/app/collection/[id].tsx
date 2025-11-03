import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Image, TouchableOpacity, FlatList } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import PageContainer from '../../components/PageContainer';
import TopBar from '../../components/TopBar';
import withAuth from '../../components/withAuth';
import { Success } from '../../model/apiResponse';
import { Movie } from '../../model/movieModel';
import { getCollectionDetail } from '../../services/collectionService';
import { Collection } from '../../model/collectionModel';
import { COLORS } from '../../styles/colors';
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
    const [isLoading, setIsLoading] = useState(false);
    const lastFetchedTimestamp = useRef<number | null>(null);

    const fetchCollectionDetail = async () => {
        setIsLoading(true);
        const result = await getCollectionDetail(collectionId);
        if (result instanceof Success) {
            setCollection(result.data);
            lastFetchedTimestamp.current = Date.now();
        } else {
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
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="tomato" />
                    </View>
                ) : collection?.movies?.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Image 
                            source={require('../../../assets/empty_search.png')} 
                            style={styles.emptyImage} 
                        />
                        <Text style={styles.emptyText}>
                            No movies or TV show in this collection.
                        </Text>
                        <Text style={styles.emptySubText}>
                            Browse movies and TV shows to add them to this collection.
                        </Text>
                        <TouchableOpacity 
                          style={styles.createButton}
                          onPress={handleEmptyButton}
                        >
                            <Text style={styles.createButtonText}>Search Movies or TV Shows</Text>
                        </TouchableOpacity>
                    </View>
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
    emptySubText: {
      fontSize: 16,
      color: COLORS.text_gray,
      textAlign: 'center',
      marginBottom: 32,
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
    movieCard: {
        width: '100%',
        marginBottom: 8,
        paddingHorizontal: 2,
        alignContent: 'center'
    },
    collectionNote: {
        marginTop: 4,
        fontSize: 12,
        textAlign: 'left',
        fontWeight: '300'
    }
})

export default CollectionDetailPage;
