import React from 'react';
import { StyleSheet, TouchableOpacity, View, Image, Text } from 'react-native';
import { Movie } from '../model/movieModel';
import { COLORS, RADIUS, TYPOGRAPHY } from '../styles/colors';
import { getRatingColor } from '../utils/util';

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
                color: getRatingColor(movie.rating),
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
    borderRadius: RADIUS.control,
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
    ...TYPOGRAPHY.caption,
    textAlign: 'left',
  },
  posterRatingCount: {
    color: COLORS.secondaryText,
    fontWeight: 'normal',
  },
});

export default MovieCard;
