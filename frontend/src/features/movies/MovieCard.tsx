import type { LinkProps } from '@/navigation/linkProps';
import React from 'react';
import { StyleSheet, Pressable, View, Image, Text } from 'react-native';
import { smallPosterUrl, Movie } from '@/features/movies/movieModel';
import { COLORS, RADIUS, TYPOGRAPHY } from '@/theme/colors';
import { displayCount, displayRating, getRatingColor } from '@/lib/util';

const POSTER_ASPECT = 2 / 3;
const GAP = 2;
// Fixed single-line heights keep every card the same height; see movieCardHeight.
const RATING_LINE = 16;
const TITLE_LINE = 14;

interface MovieCardProps {
  movie: Movie;
  link?: LinkProps;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, link }) => {
  const Container = link ? Pressable : View;

  return (
    <Container
      {...link}
      accessibilityRole={link ? 'link' : undefined}
      accessibilityLabel={
        link
          ? movie.title + (movie.rating != null ? `, rated ${displayRating(movie.rating)}` : '')
          : undefined
      }
      style={
        link
          ? ({ pressed }) => [[styles.posterContainer], pressed && { opacity: 0.7 }]
          : [styles.posterContainer]
      }
    >
      <Image
        aria-hidden={!!link}
        accessible={!link}
        accessibilityLabel={link ? undefined : `${movie.title} poster`}
        source={{ uri: smallPosterUrl(movie) }}
        style={[styles.poster]}
      />
      {movie.rating == null ? (
        // Keeps the card height fixed when a title has no rating
        <View style={styles.ratingLine} />
      ) : (
        <Text
          numberOfLines={1}
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
            <Text style={styles.posterRatingCount}>({displayCount(movie.ratingCount)})</Text>
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
    aspectRatio: POSTER_ASPECT,
    borderRadius: RADIUS.control,
    marginBottom: GAP,
  },
  posterTitle: {
    marginTop: GAP,
    fontSize: 12,
    lineHeight: TITLE_LINE,
    textAlign: 'left',
    fontWeight: '500',
  },
  ratingLine: { marginTop: GAP, height: RATING_LINE },
  // No fixed height: user text-spacing overrides must grow the line, not clip it
  posterRating: {
    marginTop: GAP,
    ...TYPOGRAPHY.caption,
    lineHeight: RATING_LINE,
    textAlign: 'left',
  },
  posterRatingCount: {
    color: COLORS.secondaryText,
    fontWeight: 'normal',
  },
});

// Height of a card rendered at this width, so placeholders can match a loaded row.
export const movieCardHeight = (width: number) =>
  width / POSTER_ASPECT + GAP + GAP + RATING_LINE + GAP + TITLE_LINE;

export default MovieCard;
