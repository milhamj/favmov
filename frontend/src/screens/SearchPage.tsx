import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Image, Text, StyleSheet, ScrollView } from 'react-native';
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
    const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Home'>>();
    const [searchQuery, setSearchQuery]  = useState('');
    const [movies, setMovies] = useState([] as Movie[]);

    useEffect(() => {
        const fetchMovies = async () => {
        const result = await searchMovie(searchQuery, 1);
            if (result instanceof Success) {
                setMovies(result.data);
            }
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
                onClick={() => navigation.navigate('MovieDetail', { movie: item })} 
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
                style={styles.searchBox}
                placeholder="Type any Movie title..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            <ScrollView style={{paddingHorizontal: 16}}>
                {
                    isEmptyQuery || isEmptyResult ? (
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
            </ScrollView>
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
  row: {
    justifyContent: 'flex-start',
  },
  flatListContent: {
    paddingHorizontal: 16,
  },
  scrollContainer: {
    
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default SearchPage;