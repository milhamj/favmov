import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, ScrollView } from 'react-native';
import { fetchTrendingMovies, fetchPopularMovies, fetchFavoriteMovies, fetchTrendingShows } from '../services/movieService';
import { Movie } from '../model/movieModel';
import TopBar from '../components/TopBar';
import { Result, Success, Error } from '../model/apiResponse';
import Toast from 'react-native-toast-message';

const Homepage = () => {
  const defaultMovies: Movie[] = [];
  const [trendingMovies, setTrendingMovies] = useState(defaultMovies);
  const [trendingShows, setTrendingShows] = useState(defaultMovies);
  const [popularMovies, setPopularMovies] = useState(defaultMovies);
  const [favoriteMovies, setFavoriteMovies] = useState(defaultMovies);

  useEffect(() => {
    const loadMovies = async () => {
      const trendingMoviesResult: Result = await fetchTrendingMovies();
      const trendingShowsResult: Result = await fetchTrendingShows();
      const popularResult: Result = await fetchPopularMovies();
      const favoritesResult: Result = await fetchFavoriteMovies();

      if (trendingMoviesResult instanceof Success) {
        setTrendingMovies(trendingMoviesResult.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: trendingMoviesResult.message,
        });
      }

      if (trendingShowsResult instanceof Success) {
        setTrendingShows(trendingShowsResult.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: trendingShowsResult.message,
        });
      }

      if (popularResult instanceof Success) {
        setPopularMovies(popularResult.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: popularResult.message,
        });
      }

      if (favoritesResult instanceof Success) {
        setFavoriteMovies(favoritesResult.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: favoritesResult.message,
        });
      }
    };
    loadMovies();
  }, []);

  const renderMoviePoster = ({ item }: { item: Movie }) => (
    <View style={styles.posterContainer}>
      <Image source={{ uri: item.posterUrl }} style={styles.poster} />
      <Text style={styles.posterTitle}>{item.title}</Text>
    </View>
  );

  const renderSection = (title: string, data: Movie[]) => (
    <View style={styles.section}>
      <Text style={styles.header}>{title}</Text>
      <FlatList
        data={data}
        renderItem={renderMoviePoster}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <TopBar
        title="CineVerse"
        icons={[
          { name: 'search', onClick: () => console.log('Search clicked') }
        ]}
      />
      <ScrollView>
        {renderSection('Trending Movies', trendingMovies)}
        {renderSection('Trending TV Shows', trendingShows)}
        {renderSection('Popular Movies', popularMovies)}
        {renderSection('Your Favorites', favoriteMovies)}
      </ScrollView>
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  posterContainer: {
    marginRight: 8,
    alignItems: 'center',
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  posterTitle: {
    marginTop: 4,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default Homepage;