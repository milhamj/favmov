import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Image, Text, StyleSheet } from 'react-native';
import PageContainer  from '../components/PageContainer';
import { Movie } from '../model/movieModel';
import { searchMovie } from '../services/movieService';
import { Success } from '../model/apiResponse';

const SearchPage = () => {
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

  const renderMovieItem = ({ item }: { item: Movie }) => (
    <View style={styles.movieItem}>
      <Image source={{ uri: item.smallPosterUrl() }} style={styles.poster} />
      <Text style={styles.title}>{ item.title }</Text>
    </View>
  );

  const isEmptyResult = movies?.length === 0
  const isEmptyQuery = searchQuery?.length == 0

  return (
    <PageContainer>
      <TextInput
        style={styles.searchBox}
        placeholder="Type any Movie title..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

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
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  searchBox: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  row: {
    justifyContent: 'space-between',
  },
  movieItem: {
    flex: 1,
    marginBottom: 10,
    alignItems: 'center',
  },
  poster: {
    width: 100,
    height: 150,
  },
  title: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: 'bold',
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