import React from 'react';
import { StyleSheet, Dimensions, TouchableOpacity, View, Image, Text } from 'react-native';
import { Movie } from '../model/movieModel';
import { COLORS } from '../styles/colors'; 

interface MovieCardProps {
    movie: Movie;
    onClick?: (movie: Movie) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const Container = onClick ? TouchableOpacity : View;

  return (
    <Container onPress={onClick ? () => onClick(movie) : undefined} style={[styles.posterContainer]}>
        <Image source={{ uri: movie.smallPosterUrl() }} style={[styles.poster]} />
        {movie.rating && (
          <Text
            style={[
              styles.posterRating,
              {
                color: movie.rating >= 5.0 ? COLORS.rating_green : COLORS.rating_red,
                fontWeight: 'bold',
              },
            ]}
          >
            ⭐ {movie.rating}{' '}
            {movie.ratingCount && (
              <Text style={styles.posterRatingCount}>({movie.ratingCount})</Text>
            )}
          </Text>
        )}
        <Text style={styles.posterTitle} numberOfLines={1} ellipsizeMode="tail">
          {movie.title}
        </Text>
    </Container>
  );
}

const styles = StyleSheet.create({
  posterContainer: {
    flex: 1,
  },
  poster: {
    aspectRatio: 2 / 3,
    borderRadius: 8,
    marginBottom: 2,
  },
  posterTitle: {
    marginTop: 2,
    fontSize: 12,
    textAlign: 'left',
    fontWeight: '500'
  },
  posterRating: {
    marginTop: 2,
    fontSize: 14,
    textAlign: 'left',
  },
  posterRatingCount: {
    color: COLORS.text_gray,
    fontWeight: 'normal',
  },
});

export default MovieCard;