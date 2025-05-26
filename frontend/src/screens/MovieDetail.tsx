import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import PageContainer  from '../components/PageContainer';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Movie } from '../model/movieModel';
import { fetchMovieDetails } from '../services/movieService';
import { Result, Success } from '../model/apiResponse';
import Toast from 'react-native-toast-message';
import TopBar from '../components/TopBar';
import PosterViewer from '../components/PosterViewer';
import { COLORS } from '../styles/colors'; 

const MovieDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const movieParams = (route.params as { movie: Movie }).movie;

  const [movie, setMovie] = useState(movieParams);

  useEffect(() => {
    const loadMovieDetails = async () => {
      const result: Result = await fetchMovieDetails(movie.id.toString(), movie.isTvShow);

      if (result instanceof Success) {
        setMovie(result.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.message,
          position: 'bottom'
        });
      }
    };
    loadMovieDetails();
  }, [])

  return (
    <PageContainer>
      <TopBar
        title= { movie.title }
        backButton={{
          isShow: true,
          onClick: () => navigation.goBack()
        }}
      />
      <ScrollView>
        {/* Poster Section */}
        <PosterViewer bigPosterUrl={movie.bigPosterUrl()} smallPosterUrl={movie.smallPosterUrl()} />
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

export default MovieDetail;