import React, { useEffect, useState } from 'react';
import PageContainer from '../components/PageContainer';
import TopBar from '../components/TopBar';
import withAuth from '../components/withAuth';
import { Success } from '../model/apiResponse';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Movie } from '../model/movieModel';
import { RootStackParamList } from '../navigation/navigationTypes';
import { searchMovie } from '../services/movieService';
import { getCollectionDetail } from '../services/collectionService';
import { Collection } from '../model/collectionModel';
import Toast from 'react-native-toast-message';
import { View, StyleSheet, Text, ActivityIndicator, Image, TouchableOpacity, FlatList } from 'react-native';
import { COLORS } from '../styles/colors';
import MovieCard from '../components/MovieCard';

const CollectionDetail = withAuth(() => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'CollectionDetail'>>();
    const route = useRoute();
    const collectionId = (route.params as { collectionId: string }).collectionId;
    const [collection, setCollection] = useState(null as Collection | null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchCollectionDetail = async () => {
            setIsLoading(true);
            const result = await getCollectionDetail(collectionId);
            if (result instanceof Success) {
                setCollection(result.data);
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

        fetchCollectionDetail();
    }, [collectionId]);

    const handleEmptyButton = () => {
        navigation.navigate('SearchPage');
    }

    const renderMovieItem = ({ item, index }: { item: Movie, index: number }) => (
        <TouchableOpacity 
        style={[styles.movieCard, { marginRight: index % 2 === 0 ? 16 : 0 }]}
        onPress={() => navigation.navigate('MovieDetail', { movie: item })} 
        >
            <MovieCard 
                movie={item}
            />
            {
                item.collectionNotes ? (
                    <Text style={styles.collectionNote}>
                        {item.collectionNotes}
                    </Text>
                ) : null
            }
        </TouchableOpacity>
    );

    return (
        <PageContainer>
            <TopBar
                title={ collection?.name ? collection?.name : 'Collection' }
                backButton={ {
                    isShow: true,
                    onClick: () => navigation.goBack()
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
                            source={require('../../assets/empty_search.png')} 
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
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        
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
    row: {
      justifyContent: 'flex-start',
    },
    movieCard: {
        width: '48%', 
        marginBottom: 16, 
        alignContent: 'center'
    },
    collectionNote: {
        marginTop: 4,
        fontSize: 12,
        textAlign: 'left',
        fontWeight: '300'
    }
})

export default CollectionDetail;
