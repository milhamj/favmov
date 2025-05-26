import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { fetchTrendingMovies, fetchPopularMovies, fetchFavoriteMovies, fetchTrendingShows } from '../services/movieService';
import { Movie } from '../model/movieModel';
import TopBar from '../components/TopBar';
import { Result, Success } from '../model/apiResponse';
import Toast from 'react-native-toast-message';
import { RootStackParamList } from '../navigation/navigationTypes';
import MovieCard from '../components/MovieCard';

const Homepage = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Home'>>();
  
  const defaultMovies: Movie[] = [];
  const [trendingMovies, setTrendingMovies] = useState(defaultMovies);
  const [trendingShows, setTrendingShows] = useState(defaultMovies);
  const [popularMovies, setPopularMovies] = useState(defaultMovies);
  const [favoriteMovies, setFavoriteMovies] = useState(null as Movie[] | null);

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
          position: 'bottom'
        });
      }

      if (trendingShowsResult instanceof Success) {
        setTrendingShows(trendingShowsResult.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: trendingShowsResult.message,
          position: 'bottom'
        });
      }

      if (popularResult instanceof Success) {
        setPopularMovies(popularResult.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: popularResult.message,
          position: 'bottom'
        });
      }

      if (favoritesResult instanceof Success) {
        setFavoriteMovies(favoritesResult.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: favoritesResult.message,
          position: 'bottom'
        });
      }
    };
    loadMovies();
  }, []);

  const renderMoviePoster = ({ item }: { item: Movie }) => (
    <View style={{ width: 120, marginEnd: 8 }}>
      <MovieCard 
        movie={item} 
        onClick={() => navigation.navigate('MovieDetail', { movie: item })}
      />
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
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <TopBar
        title="CineVerse"
        icons={[
          { name: 'search', onClick: () => navigation.navigate('SearchPage') }
        ]}
      />
      <ScrollView>
        {renderSection('Trending Movies', trendingMovies)}
        {renderSection('Trending TV Shows', trendingShows)}
        {renderSection('Popular Movies', popularMovies)}
        { favoriteMovies && renderSection('Your Favorites', favoriteMovies) }
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
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  flatListContent: {
    paddingHorizontal: 16,
  },
});

export default Homepage;