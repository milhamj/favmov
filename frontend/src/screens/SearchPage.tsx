import React, { useState, useEffect, useRef } from 'react';
import { View, Platform, TextInput, FlatList, Image, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import PageContainer  from '../components/PageContainer';
import { Movie } from '../model/movieModel';
import { searchMovie } from '../services/movieService';
import { Success } from '../model/apiResponse';
import TopBar from '../components/TopBar';
import { useNavigation } from '@react-navigation/native';
import MovieCard from '../components/MovieCard';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/navigationTypes';

const SearchPage = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'SearchPage'>>();
    const [searchQuery, setSearchQuery]  = useState('');
    const [movies, setMovies] = useState([] as Movie[]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        const focusTimeout = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
        
        return () => clearTimeout(focusTimeout);
    }, []);

    useEffect(() => {
        const fetchMovies = async () => {
            setIsLoading(true);
            const result = await searchMovie(searchQuery, 1);
            if (result instanceof Success) {
                setMovies(result.data);
            }
            setIsLoading(false);
        };

        const debounceFetch = setTimeout(() => {
            if (searchQuery) {
                fetchMovies();
            }
        }, 300);

        return () => clearTimeout(debounceFetch);
    }, [searchQuery]);

    const renderMovieItem = ({ item, index }: { item: Movie, index: number }) => (
        <View style={{
            width: '48%', 
            marginRight: index % 2 === 0 ? 16 : 0,
            marginBottom: 16, 
            alignContent: 'center'
        }}>
            <MovieCard 
                movie={item}
                onClick={() => navigation.navigate('MovieDetailPage', { movie: item })} 
            />
        </View>
    );

    const isEmptyResult = movies?.length === 0
    const isEmptyQuery = searchQuery?.length == 0

    return (
        <PageContainer>
            <TopBar
                title= 'Search'
                backButton={{
                isShow: true,
                onClick: () => navigation.goBack()
                }}
            />
            <TextInput 
                ref={inputRef}
                style={styles.searchBox}
                placeholder="Type any Movie title..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={Platform.OS === 'web'}
            />
            <View style={styles.scrollContainer}>
                {
                    isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator style={styles.loadingItem} size="large" color="tomato" />
                        </View>
                    ) : isEmptyQuery || isEmptyResult ? (
                        <View style={styles.emptyState}>
                            <Image source={require('../../assets/empty_search.png')} style={styles.emptyImage} />
                            <Text style={styles.emptyText}>
                                {
                                    isEmptyQuery ? ('Type any Movie title...') :
                                    isEmptyResult ? ('No results found.') :
                                    null
                                }
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={movies}
                            renderItem={renderMovieItem}
                            keyExtractor={(item) => item.id.toString()}
                            numColumns={2}
                            columnWrapperStyle={styles.row}
                            
                        />
                    )
                }
            </View>
        </PageContainer>
    );
};

const styles = StyleSheet.create({
  searchBox: {
    minHeight: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 12
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingItem: {
    height: 100
  },
  row: {
    justifyContent: 'flex-start',
  },
  flatListContent: {
    paddingHorizontal: 16,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16
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
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
});

export default SearchPage;