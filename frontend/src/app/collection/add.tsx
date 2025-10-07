import React, { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, Image, TouchableOpacity, View, Text, FlatList, ScrollView } from 'react-native';
import { Movie } from '../../model/movieModel';
import { getUserCollections } from '../../services/collectionService';
import { CollectionCard } from '../../model/collectionModel';
import Toast from 'react-native-toast-message';
import CollectionAddCard from '../../components/CollectionAddCard';
import { Success } from '../../model/apiResponse';
import PageContainer from '../../components/PageContainer';
import TopBar from '../../components/TopBar';
import withAuth from '../../components/withAuth';
import { router } from '../../navigation/router';
import { routes } from '../../navigation/routes';
import { useLocalSearchParams } from 'expo-router';
import { parseBooleanParam, parseIntParam } from '../../utils/util';
import { MovieStore } from '../../stores/movieStore';

const AddToCollectionPage = withAuth(() => {
    const params = useLocalSearchParams();
    const movieId = parseIntParam(params.movie_id);
    const isTvShow = parseBooleanParam(params.is_tv_show);
    
    const [movie] = useState(() => {
        const cached = MovieStore.getCachedMovie(movieId, isTvShow);
        return cached || new Movie({});
    });

    const shortTitle = movie.title.length > 20 ? movie.title.substring(0,20) + "..." : movie.title;

    const [collectionCards, setCollectionCards] = useState<CollectionCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if (!movie.collections) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Movie collections are needed',
                position: 'bottom'
            });
            router.goBackSafely();
        } else {
            setShouldRender(true);
        }
    }, []);

    const handleCreateCollection = () => {
        router.navigate(routes.home)
    }

    const fetchCollections = async () => {
        setIsLoading(true);
        const result = await getUserCollections();
        if (result instanceof Success) {
            const collectionCardsResult = [] as CollectionCard[];
            result.data.forEach((collection) => {
                const isInCollection = movie.collections?.find((movieCollection) => { 
                    return movieCollection.id === collection.id
                }) !== undefined;
                collectionCardsResult.push(new CollectionCard(collection.id, collection.name, isInCollection));
            })
            // Sort so that the collections the movie is already in appear first
            collectionCardsResult.sort((a, b) => {
                if (a.isInCollection && !b.isInCollection) {
                    return -1;
                } else if (!a.isInCollection && b.isInCollection) {
                    return 1;
                } else {
                    return 0;
                }
            })
            setCollectionCards(collectionCardsResult);
        } else {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: result.message,
                position: 'bottom'
            });
        }
        setIsLoading(false);
    };
      
    useEffect(() => {
        fetchCollections();
    }, []);

    const renderCollection = ({ item }: { item: CollectionCard }) => {
        return (
            <CollectionAddCard collection={item} movie={movie}/>
        )
    }

    return (
        shouldRender ? 
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
                                    onPress={handleCreateCollection}
                                >
                                    <Text style={styles.createButtonText}>Create Collection</Text>
                                </TouchableOpacity>
                            </View>

                        ) : (
                            <FlatList
                                data={collectionCards}
                                renderItem={renderCollection}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={styles.listContent}
                            />
                        )
                    }
                </ScrollView>
                <Toast />
            </PageContainer> 
        : null
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