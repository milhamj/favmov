import type { LinkProps } from '@/navigation/linkProps';
import React from 'react';
import { StyleSheet, Pressable, View, Image, Text } from 'react-native';
import { releaseYear, smallPosterUrl, Movie } from '@/features/movies/movieModel';
import { COLORS, RADIUS, ROW_ELEVATION, SPACING, TYPOGRAPHY } from '@/theme/colors';
import ExpandableText from '@/components/ExpandableText';
import { displayRating, getRatingColor } from '@/lib/util';

interface MovieCardHorizontalProps {
  movie: Movie;
  link?: LinkProps;
}

const MovieCardHorizontal: React.FC<MovieCardHorizontalProps> = ({ movie, link }) => {
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
          ? ({ pressed }) => [styles.posterContainer, pressed && { opacity: 0.7 }]
          : styles.posterContainer
      }
    >
      <Image
        aria-hidden={!!link}
        accessible={!link}
        accessibilityLabel={link ? undefined : `${movie.title} poster`}
        source={{ uri: smallPosterUrl(movie) }}
        style={[styles.poster]}
      />
      <View style={styles.posterInfo}>
        <Text style={styles.posterTitle} numberOfLines={1} ellipsizeMode="tail">
          {movie.title}
          {releaseYear(movie) ? ` (${releaseYear(movie)})` : ''}
        </Text>
        {movie.rating != null && (
          <Text
            style={[
              styles.posterRating,
              {
                color: getRatingColor(movie.rating),
                fontWeight: 'bold',
              },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            ⭐ {displayRating(movie.rating)}{' '}
            {movie.ratingCount != null && (
              <Text style={styles.posterRatingCount}>({movie.ratingCount})</Text>
            )}
          </Text>
        )}
        {movie.collectionNotes && (
          <View style={styles.posterNotes}>
            <ExpandableText
              text={movie.collectionNotes}
              textStyle={styles.posterNotesText}
              maxLines={2}
            />
          </View>
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  posterContainer: {
    width: '100%',
    borderRadius: RADIUS.control,
    ...ROW_ELEVATION,
    backgroundColor: COLORS.page,
    flex: 1,
    flexDirection: 'row',
  },
  poster: {
    width: 80,
    aspectRatio: 2 / 3,
    borderTopLeftRadius: RADIUS.control,
    borderBottomLeftRadius: RADIUS.control,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  posterInfo: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    padding: SPACING.small,
  },
  posterTitle: {
    marginTop: 2,
    ...TYPOGRAPHY.rowTitle,
    color: COLORS.text,
    textAlign: 'left',
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
  posterNotes: {
    marginTop: 2,
  },
  posterNotesText: {
    ...TYPOGRAPHY.caption,
    textAlign: 'left',
    color: COLORS.text,
  },
});

export default MovieCardHorizontal;
