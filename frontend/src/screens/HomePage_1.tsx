import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { fetchTrendingMovies, fetchPopularMovies, fetchFavoriteMovies, fetchTrendingShows } from '../services/movieService';
import { Movie } from '../model/movieModel';
import TopBar from '../components/TopBar';
import { Result, Success } from '../model/apiResponse';
import Toast from 'react-native-toast-message';
import { RootStackParamList } from '../navigation/navigationTypes';
import MovieCard from '../components/MovieCard';

const HomePage = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'MainPage'>>();

  const renderMoviePoster = ({ item }: { item: Movie }) => (
    <View style={{ width: 120, marginEnd: 8 }}>
      <MovieCard 
        movie={item} 
        onClick={() => navigation.navigate('MovieDetailPage', { movie: item })}
      />
    </View>
    
  );

  const Section = {
    TrendingMovies: 'Trending Movies',
    TrendingShows: 'Trending TV Shows',
    PopularMovies: 'Popular Movies',
    YourFavorites: 'Your Favorites',
  }

  const renderSection = (sectionType: string) => {
    const [movies, setMovies] = useState([] as Movie[] | null);
    
    useEffect(() => {
      const loadMovieData = async () => {
        let result: Result | null = null;
        switch(sectionType) {
          case Section.TrendingMovies:
            result = await fetchTrendingMovies();
            break;
          case Section.TrendingShows:
            result = await fetchTrendingShows();
            break;
          case Section.PopularMovies:
            result = await fetchPopularMovies();
            break;
          case Section.YourFavorites:
            result = await fetchFavoriteMovies();
            break;
          default:
            return;
        }
        if (result == null){
          setMovies(null)
        } else if (result instanceof Success) {
          setMovies(result.data);
        } else {
          setMovies(null);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: result.message,
            position: 'bottom'
          });
        }
      }
      loadMovieData();
    }, []);

    if (movies === null) {
      return null;
    }

    return <View style={styles.section}>
      <Text style={styles.header}>{sectionType}</Text>
      {
        movies.length > 0 ? (
          <FlatList
            data={movies}
            renderItem={renderMoviePoster}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
          />
        ) : (
          <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="tomato" />
          </View>
        )
      }
    </View>
  };

  return (
    <View style={styles.container}>
      <TopBar
        title="FavMov"
        icons={[
          { name: 'search', onClick: () => navigation.navigate('SearchPage') }
        ]}
      />
      <ScrollView>
        {renderSection(Section.TrendingMovies)}
        {renderSection(Section.TrendingShows)}
        {renderSection(Section.PopularMovies)}
        {renderSection(Section.YourFavorites) }
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
  loadingContainer: {
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomePage;