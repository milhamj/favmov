import React, { useEffect } from 'react';
import { Text, StyleSheet, View, ActivityIndicator, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/navigationTypes';
import { fetchTrendingMovies, fetchPopularMovies, fetchFavoriteMovies, fetchTrendingShows } from '../services/movieService';
import { Result, Success } from '../model/apiResponse';
import MovieCard from '../components/MovieCard';
import { Movie } from '../model/movieModel';
import { useAuth } from '../hooks/useAuth';
import { Loadable } from '../model/uiState';


export const SectionType = {
    TrendingMovies: 'Trending Movies',
    TrendingShows: 'Trending TV Shows',
    PopularMovies: 'Popular Movies',
    YourFavorites: 'Your Favorites',
}

const HomeSection: React.FC<{ section: string }> = ({ section }) => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'MainPage'>>();
    const [movieState, setMovieState] = React.useState<Loadable<Movie[]>>({ status: 'idle' });
    const { isAuthenticated } = useAuth();
  
    const renderMoviePoster = ({ item }: { item: Movie }) => (
      <View style={{ width: 120, marginEnd: 8 }}>
        <MovieCard 
          movie={item} 
          onClick={() => navigation.navigate('MovieDetailPage', { movie: item })}
        />
      </View>
    );
  
    useEffect(() => {
      (async () => {
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
        } else {
            setMovieState({ status: 'error', error: result?.message ?? 'Failed to load ' + section });
        }
      })();
    }, [section, isAuthenticated]);
    
    switch (movieState.status) {
        case 'loading':
          return <View style={styles.section}>
                    <Text style={styles.header}>{section}</Text>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="tomato" />
                    </View>
                </View>
        case 'success':
          return <View style={styles.section}>
                    <Text style={styles.header}>{section}</Text>
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
})

export default HomeSection;