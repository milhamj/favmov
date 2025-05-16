import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, ScrollView } from 'react-native';
import { fetchTrendingMovies, fetchPopularMovies, fetchFavoriteMovies } from '../services/movieService';
import { Movie } from '../model/movieModel';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
      <View style={styles.topBar}>
        <Text style={styles.appTitle}>CineVerse</Text>
        <Icon name="search" size={24} />
      </View>
      <ScrollView>
        {renderSection('Trending', trendingMovies)}
        {renderSection('Popular', popularMovies)}
        {renderSection('Your Favorites', favoriteMovies)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
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