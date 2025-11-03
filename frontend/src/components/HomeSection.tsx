import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, View, ActivityIndicator, FlatList, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // Add this import
import { fetchTrendingMovies, fetchPopularMovies, fetchFavoriteMovies, fetchTrendingShows } from '../services/movieService';
import { Result, Success } from '../model/apiResponse';
import MovieCard from '../components/MovieCard';
import { Movie } from '../model/movieModel';
import { useAuth } from '../hooks/useAuth';
import { Loadable } from '../model/uiState';
import { router } from '../navigation/router';
import { routes } from '../navigation/routes';
import { MovieStore } from '../stores/movieStore';

export const SectionType = {
    TrendingMovies: 'Trending Movies',
    TrendingShows: 'Trending TV Shows',
    PopularMovies: 'Popular Movies',
    YourFavorites: 'Your Favorites',
}

const HomeSection: React.FC<{ 
  section: string, 
  collectionLastUpdated?: number | null 
}> = ({ section, collectionLastUpdated }) => {
    const [movieState, setMovieState] = React.useState<Loadable<Movie[]>>({ status: 'idle' });
    const { isAuthenticated } = useAuth();
    const lastFetchedTimestamp = useRef<number | null>(null);
  
    const renderMoviePoster = ({ item }: { item: Movie }) => (
      <View style={{ width: 120, marginEnd: 8 }}>
        <MovieCard 
          movie={item} 
          onClick={() => { 
            MovieStore.cacheMovie(item);
            router.navigate(routes.movie(item.id, item.isTvShow))
          }}
        />
      </View>
    );

    const fetchMovies = async () => {
      if (section === SectionType.YourFavorites && !isAuthenticated) {
          setMovieState({ status: 'empty' });
          return;
      }

      setMovieState({ status: 'loading' });

      const result =
        section === SectionType.TrendingMovies ? await fetchTrendingMovies() :
        section === SectionType.TrendingShows ? await fetchTrendingShows() :
        section === SectionType.PopularMovies ? await fetchPopularMovies() :
        section === SectionType.YourFavorites && isAuthenticated ? await fetchFavoriteMovies() :
        null

      if (result instanceof Success) {
          setMovieState(
              result.data.length ? 
                  { status: 'success', data: result.data } : 
                  { status: 'empty' }
          );
          lastFetchedTimestamp.current = Date.now();
      } else {
          setMovieState({ status: 'error', error: result?.message ?? 'Failed to load ' + section });
      }
    };
  
    // Initial load
    useEffect(() => {
      fetchMovies();
    }, [section, isAuthenticated]);

    // Check for updates when screen comes into focus
    useEffect(() => {
      // Only refetch "Your Favorites" section if collections were updated
      if (section === SectionType.YourFavorites) {
        if (collectionLastUpdated 
          && lastFetchedTimestamp.current 
          && collectionLastUpdated > lastFetchedTimestamp.current) {
          fetchMovies();
        }
      }
    }, [section, collectionLastUpdated, isAuthenticated]);

    const handleHeaderPress = () => {
      router.navigate(routes.explore(section));
    }
    
    switch (movieState.status) {
        case 'loading':
          return <View style={styles.section}>
            <View style={styles.header}>
              <Text style={[styles.headerTitle]}>{section}</Text>
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="tomato" />
            </View>
          </View>
        case 'success':
          return <View style={styles.section}>
            <Pressable style={styles.header} onPress={handleHeaderPress}>
              <Text style={styles.headerTitle}>{section}</Text>
              { section !== SectionType.YourFavorites &&
                <Text style={styles.headerAction}>View All</Text>
              }
            </Pressable>
            <FlatList
              data={movieState.data}
              renderItem={renderMoviePoster}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.flatListContent}
            /> 
          </View>;
        default: // 'error' | 'empty' | 'idle'
          return null; // 'idle'
    }
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 16,
    },
    header: {
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginVertical: 8,
      paddingHorizontal: 16,
    },
    headerTitle: { 
      fontSize: 24,
      fontWeight: 'bold',
    },
    headerAction: { 
      fontSize: 14,
      fontWeight: '500',
      color: 'tomato',
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
})

export default HomeSection;