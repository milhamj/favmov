import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { fetchTrendingMovies, fetchPopularMovies, fetchFavoriteMovies } from '../services/movieService';
import { Movie } from '../model/movieModel';

const Homepage = () => {
  const defaultMovies: Movie[] = []
  const [trendingMovies, setTrendingMovies] = useState(defaultMovies);
  const [popularMovies, setPopularMovies] = useState(defaultMovies);
  const [favoriteMovies, setFavoriteMovies] = useState(defaultMovies);

  useEffect(() => {
    const loadMovies = async () => {
      const trending = await fetchTrendingMovies();
      const popular = await fetchPopularMovies();
      const favorites = await fetchFavoriteMovies();
      setTrendingMovies(trending);
      setPopularMovies(popular);
      setFavoriteMovies(favorites);
    };
    loadMovies();
  }, []);

  const renderMoviePoster = ({ item }: { item: Movie }) => (
    <Image source={{ uri: item.posterUrl }} style={styles.poster} />
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
      {renderSection('Trending', trendingMovies)}
      {renderSection('Popular', popularMovies)}
      {renderSection('Your Favorites', favoriteMovies)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  poster: {
    width: 120,
    height: 180,
    marginRight: 8,
    borderRadius: 8,
  },
});

export default Homepage;