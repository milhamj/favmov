import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Icon } from 'react-native-elements';
import Toast from 'react-native-toast-message';
import PageContainer  from '../../components/PageContainer';
import { Movie } from '../../model/movieModel';
import { fetchMovieDetails } from '../../services/movieService';
import { Success, Error } from '../../model/apiResponse';
import TopBar from '../../components/TopBar';
import ImageViewer from '../../components/ImageViewer';
import { COLORS } from '../../styles/colors'; 
import { getCheckMovieExistInCollection } from '../../services/collectionService';
import { useAuth } from '../../hooks/useAuth';
import { parseBooleanParam, parseIntParam } from '../../utils/util';
import { router } from '../../navigation/router';
import { routes } from '../../navigation/routes';
import { MovieStore } from '../../stores/movieStore';

const MovieDetailPage = () => {
  const params = useLocalSearchParams();
  const movieId = parseIntParam(params.id);
  const isTvShow = parseBooleanParam(params.is_tv_show);

  const { isAuthenticated } = useAuth();

  const [movie, setMovie] = useState(() => {
    const cached = MovieStore.getCachedMovieAndDelete(movieId.toString(), isTvShow);
    return cached || new Movie({id : movieId, isTvShow: isTvShow});
  });
  const [isCollectionLoading, setIsCollectionLoading] = useState(false);
  const isInitialLoad = useRef(true);

  // Initial load - fetch both movie details and collection status
  useEffect(() => {
    let isMounted = true;
  
    const fetchDetails = async () => {
      const movieResult = await fetchMovieDetails(movie.id.toString(), movie.isTvShow);
      if (isMounted) {
        if (movieResult instanceof Success) {
          setMovie(
            (prev) => {
              const updatedMovie = movieResult.data
              updatedMovie.collections = prev.collections || [];
              return new Movie(updatedMovie);
          });
        } else if (movieResult instanceof Error) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: movieResult.message,
            position: 'bottom'
          });
        }
      }
    };
  
    fetchDetails();
  
    return () => { isMounted = false };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
  
    let isMounted = true;
  
    const checkCollection = async () => {
      const collectionResult = await getCheckMovieExistInCollection(movie.id.toString(), movie.isTvShow || false);
      if (isMounted && collectionResult instanceof Success) {
        setMovie((prev) => new Movie({ ...prev, collections: collectionResult.data }));
      } else if (collectionResult instanceof Error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: collectionResult.message,
          position: 'bottom'
        });
      }

      isInitialLoad.current = false
    };
  
    checkCollection();
  
    return () => { isMounted = false };
  }, [isAuthenticated]);

  // Focus effect - only refresh collection status when returning from another page
  useFocusEffect(
    useCallback(() => {
      // Skip on initial load since useEffect already handles it
      if (isInitialLoad.current) return;

      const refreshCollectionStatus = async () => {
        setIsCollectionLoading(true);

        const collectionResult = await getCheckMovieExistInCollection(
          movie.id.toString(), 
          movie.isTvShow || false
        );

        if (collectionResult instanceof Success) {
          setMovie((prev) => new Movie({ ...prev, collections: collectionResult.data }));
        } else if (collectionResult instanceof Error) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: collectionResult.message,
            position: 'bottom'
          });
        }

        setIsCollectionLoading(false);
      };

      refreshCollectionStatus();

      // Optional cleanup when screen loses focus
      return () => {
        console.log('MovieDetailPage blurred');
      };
    }, [movie.id, movie.isTvShow])
  );

  const AddToCollectionButton = () => {
    const handleFavoriteClick = () => {
      if (!isAuthenticated) {
        router.navigate(routes.login);
        return;
      }

      MovieStore.cacheMovie(movie);
      router.navigate(routes.addToCollection(movie.id, movie.isTvShow));
    }
    
    return (
        movie.collections !== undefined ? (
          <TouchableOpacity style={styles.addToCollectionButton} onPress={handleFavoriteClick}> 
            {
              isCollectionLoading ? 
                <ActivityIndicator style={{width: 24, height: 24}} color={'white'}/>
              : <Icon name={movie.collections.length > 0 ? "favorite" : "favorite-outline"} size={24} color='white' />
            }
          </TouchableOpacity>
        ) : null
    );
  };

  return (
    <PageContainer>
      <TopBar
        title= { movie.title }
        backButton={{
          isShow: true,
          onClick: () => router.goBackSafely()
        }}
      />
      <ScrollView>
        {/* Poster Section */}
        <View style={styles.posterContainer}>
          { movie.bigBackdropUrl() && movie.smallBackdropUrl() ? (
              <ImageViewer
                style={styles.backdrop}
                bigImageUrl={movie.bigBackdropUrl()!!}
                smallImageUrl={movie.smallBackdropUrl()!!} /> 
            ) : <View style={styles.backdropEmpty} />
          }
          <ImageViewer 
            style={styles.poster}
            imageStyle={styles.posterImage}
            smallImageUrl={movie.smallPosterUrl()} />
          <AddToCollectionButton/>
        </View>
        <View style={styles.detailsContainer}>
          {/* Top Section */}
          <Text style={styles.title}>{movie.title}</Text>
          {
            movie.rating && 
              <Text style={[styles.rating, {
                  color: movie.rating > 5.0 ? COLORS.rating_green : COLORS.rating_red,
                },
              ]}>
                {'⭐ '}{movie.rating}{' '}
                {movie.ratingCount && (
                  <Text style={styles.ratingCount}>({movie.ratingCount})</Text>
                )}
              </Text>
          }
          <Text style={styles.info}>
            {movie.runtime ? `${movie.runtime} minutes • ` : ''}
            {movie.releaseDate}
            {movie.director() ? ` • Directed by ${movie.director()?.name}` : ''}
            {movie.isTvShow ? ` • TV Show` : ''}
          </Text>

          {/* Genre Section */}
          { 
              movie.genres && movie.genres.length > 0 && 
                <View style={styles.genres}>
                    {movie.genres?.map((genre, index) => (
                    <Text key={index} style={styles.genre}>{genre}</Text>
                    ))}
                </View>
          }

          {/* Synopsis Section */}
          <Text style={styles.sectionTitle}>Synopsis</Text>
          <Text style={styles.synopsis}>{movie.overview}</Text>

          {/* Cast Section */}
          {
              movie.cast && movie.cast.length > 0 &&
                <View> 
                    <Text style={styles.sectionTitle}>Cast</Text>
                    {movie.cast?.map((actor, index) => (
                        <View key={index} style={styles.castItem}>
                        <Image source={{ uri: actor.photoUrl }} style={styles.actorPhoto} />
                        <View>
                            <Text style={styles.actorName}>{actor.name}</Text>
                            <Text style={styles.characterName}>{actor.character}</Text>
                        </View>
                        </View>
                    ))}
                </View>
          }

          {/* Crew Section */}
          {
              movie.crew && movie.crew.length > 0 &&
                <View> 
                    <Text style={styles.sectionTitle}>Crew</Text>
                    <View style={styles.crewContainer}>
                      {movie.crew?.map((crew, index) => (
                          <View key={index} style={styles.crewItem}>
                          <View>
                              <Text style={styles.crewName}>{crew.name}</Text>
                              <Text style={styles.crewJob}>{crew.job}</Text>
                          </View>
                          </View>
                      ))}
                    </View>
                </View>
          }
        </View>
      </ScrollView>
      <Toast />
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  posterContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  backdrop: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backdropEmpty: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: COLORS.background_gray
  },
  poster: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    width: 120,
    height: 180,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 10,
  },
  posterImage: {
    borderRadius: 12,
  },
  addToCollectionButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'tomato',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  addToCollectionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailsContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  rating: {
    fontSize: 18,
    marginVertical: 4,
    fontWeight: 'bold',
  },
  ratingCount: {
    color: COLORS.text_gray,
    fontWeight: 'normal',
  },
  info: {
    fontSize: 16,
    color: '#666',
  },
  genres: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  genre: {
    backgroundColor: '#eee',
    borderRadius: 4,
    padding: 4,
    marginRight: 8,
    alignContent: 'center'
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  synopsis: {
    fontSize: 16,
    color: '#333',
  },
  castItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  actorPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  actorName: {
    fontSize: 16,
    fontWeight: '500',
  },
  characterName: {
    fontSize: 14,
    color: '#666',
  },
  crewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  crewItem: {
    width: '48%',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  crewName: {
    fontSize: 14,
    fontWeight: '500'
  },
  crewJob: {
    fontSize: 12,
    fontWeight: 'light',
    color: '#666',
  },
});

export default MovieDetailPage;