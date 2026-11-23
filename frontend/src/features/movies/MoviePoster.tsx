import { linkProps } from '@/navigation/linkProps';
import ImageViewer from '@/components/ImageViewer';
import { useContainingCollections } from '@/features/collections/collectionQueries';
import {
  bigBackdropUrl,
  bigPosterUrl,
  smallBackdropUrl,
  smallPosterUrl,
  Movie,
} from '@/features/movies/movieModel';
import { useMovieDetails } from '@/features/movies/movieQueries';
import { routes } from '@/navigation/routes';
import { COLORS, LAYOUT, SPACING } from '@/theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Pressable, View } from 'react-native';

const AddToCollectionButton = ({
  movie,
  isAuthenticated,
  isAuthLoading,
  membership,
  details,
  collections,
}: {
  movie: Movie;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  membership: ReturnType<typeof useContainingCollections>;
  details: ReturnType<typeof useMovieDetails>;
  collections: unknown[];
}) => {
  // While auth loads the press is a no-op; the add route is protected, so a new tab still lands right
  const href =
    isAuthenticated || isAuthLoading
      ? routes.addToCollection(movie.id, movie.isTvShow)
      : routes.loginWithReturnTo(routes.movie(movie.id, movie.isTvShow));

  // Until the saved state is known a tap would send a signed-in user to login or open the editor blind
  const isHeartLoading =
    isAuthLoading || (isAuthenticated && (membership.isPending || membership.isFetching));

  return details.data ? (
    <Pressable
      {...linkProps(href, undefined, isHeartLoading)}
      accessibilityRole="link"
      accessibilityLabel={collections.length > 0 ? 'In your collections' : 'Add to collection'}
      style={({ pressed }) => [
        styles.addToCollectionButton,
        pressed && !isHeartLoading && { opacity: 0.7 },
      ]}
      aria-busy={isHeartLoading}
      accessibilityState={{ disabled: isHeartLoading, busy: isHeartLoading }}
    >
      {isHeartLoading ? (
        <ActivityIndicator
          accessibilityLabel="Loading collections"
          style={{ width: 24, height: 24 }}
          color={COLORS.onAccent}
        />
      ) : (
        <MaterialIcons
          aria-hidden
          importantForAccessibility="no"
          name={collections.length > 0 ? 'favorite' : 'favorite-outline'}
          size={24}
          color={COLORS.onAccent}
        />
      )}
    </Pressable>
  ) : null;
};

export default function MoviePoster({
  movie,
  isAuthenticated,
  isAuthLoading,
  membership,
  details,
  collections,
}: {
  movie: Movie;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  membership: ReturnType<typeof useContainingCollections>;
  details: ReturnType<typeof useMovieDetails>;
  collections: unknown[];
}) {
  return (
    <View style={styles.posterContainer}>
      {bigBackdropUrl(movie) && smallBackdropUrl(movie) ? (
        <ImageViewer
          style={styles.backdrop}
          accessibilityLabel={`View full backdrop for ${movie.title}`}
          bigImageUrl={bigBackdropUrl(movie)!}
          smallImageUrl={smallBackdropUrl(movie)!}
        />
      ) : (
        <View style={styles.backdropEmpty} />
      )}
      <View style={styles.reading} pointerEvents="box-none">
        <ImageViewer
          style={styles.poster}
          imageStyle={styles.posterImage}
          accessibilityLabel={`View full poster for ${movie.title}`}
          smallImageUrl={smallPosterUrl(movie)}
          fullImageUrl={bigPosterUrl(movie)}
        />
      </View>
      <AddToCollectionButton
        movie={movie}
        isAuthenticated={isAuthenticated}
        isAuthLoading={isAuthLoading}
        membership={membership}
        details={details}
        collections={collections}
      />
    </View>
  );
}

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
    backgroundColor: COLORS.posterPlaceholder,
  },
  reading: {
    position: 'absolute',
    width: '100%',
    maxWidth: LAYOUT.reading,
    alignSelf: 'center',
    height: '100%',
  },
  poster: {
    position: 'absolute',
    left: SPACING.medium,
    bottom: SPACING.medium,
    width: 120,
    height: 180,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.onAccent,
    zIndex: 10,
  },
  posterImage: {
    borderRadius: 12,
  },
  addToCollectionButton: {
    position: 'absolute',
    right: SPACING.medium,
    bottom: SPACING.medium,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
