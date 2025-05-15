import React, { useEffect, useState } from 'react';
import { View, Text, SectionList, StyleSheet } from 'react-native';
import { fetchTrendingMovies, fetchPopularMovies, fetchFavoriteMovies } from '../services/movieService';

const Homepage = () => {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [favoriteMovies, setFavoriteMovies] = useState([]);

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

  const sections = [
    { title: 'Trending', data: trendingMovies },
    { title: 'Popular', data: popularMovies },
    { title: 'Your Favorites', data: favoriteMovies },
  ];

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <Text style={styles.item}>{item.title}</Text>}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.header}>{title}</Text>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  item: {
    fontSize: 18,
    marginVertical: 4,
  },
});

export default Homepage;