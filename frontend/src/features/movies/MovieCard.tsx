import { linkKeyboardProps } from '@/navigation/linkKeyboardProps';
import React from 'react';
import { StyleSheet, Pressable, View, Image, Text } from 'react-native';
import { smallPosterUrl, Movie } from '@/features/movies/movieModel';
import { COLORS, RADIUS, TYPOGRAPHY } from '@/theme/colors';
import { displayRating, getRatingColor } from '@/lib/util';

interface MovieCardProps {
  movie: Movie;
  onClick?: (movie: Movie) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const Container = onClick ? Pressable : View;

  return (
    <Container
      {...(onClick ? linkKeyboardProps : {})}
      accessibilityRole={onClick ? 'link' : undefined}
      accessibilityLabel={
        onClick
          ? movie.title + (movie.rating != null ? `, rated ${displayRating(movie.rating)}` : '')
          : undefined
      }
      onPress={onClick ? () => onClick(movie) : undefined}
      style={
        onClick
          ? ({ pressed }) => [[styles.posterContainer], pressed && { opacity: 0.7 }]
          : [styles.posterContainer]
      }
    >
      <Image
        aria-hidden={!!onClick}
        accessible={!onClick}
        accessibilityLabel={onClick ? undefined : `${movie.title} poster`}
        source={{ uri: smallPosterUrl(movie) }}
        style={[styles.poster]}
      />
      {movie.rating != null && (
        <Text
          style={[
            styles.posterRating,
            {
              color: getRatingColor(movie.rating),
              fontWeight: 'bold',
            },
          ]}
        >
          ⭐ {displayRating(movie.rating)}{' '}
          {movie.ratingCount != null && (
            <Text style={styles.posterRatingCount}>({movie.ratingCount})</Text>
          )}
        </Text>
      )}
      <Text style={styles.posterTitle} numberOfLines={1} ellipsizeMode="tail">
        {movie.title}
      </Text>
    </Container>
  );
};

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
    fontWeight: '500',
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
