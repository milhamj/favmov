import { linkProps } from '@/navigation/linkProps';
import { COLORS, TYPOGRAPHY, SPACING } from '@/theme/colors';
import React from 'react';
import { Text, StyleSheet, View, FlatList, Pressable, Platform, ViewStyle } from 'react-native';
import { useHomeMovies, seedMovieDetails } from './movieQueries';
import MovieCard, { movieCardHeight } from './MovieCard';
import RetryButton from '@/components/RetryButton';
import FullPageLoader from '@/components/FullPageLoader';
import { Movie } from './movieModel';
import { useAuth } from '@/features/auth/useAuth';
import { routes } from '@/navigation/routes';
import { useQueryClient } from '@tanstack/react-query';

const CARD_WIDTH = 120;
// Always reserve the horizontal scrollbar track so the loader and loaded row share one height.
const webScrollTrack =
  Platform.OS === 'web' ? ({ overflowX: 'scroll', overflowY: 'hidden' } as ViewStyle) : null;

export const SectionType = {
  TrendingMovies: 'Trending Movies',
  TrendingShows: 'Trending TV Shows',
  PopularMovies: 'Popular Movies',
  YourFavorites: 'Your Favorites',
};

const HomeSection: React.FC<{
  section: string;
}> = ({ section }) => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const {
    data,
    error,
    isPending: isLoading,
    refetch,
  } = useHomeMovies(section, isAuthenticated, user?.id);
  const renderMoviePoster = ({ item }: { item: Movie }) => (
    <View style={{ width: CARD_WIDTH, marginEnd: SPACING.small }}>
      <MovieCard
        movie={item}
        link={linkProps(routes.movie(item.id, item.isTvShow), () =>
          seedMovieDetails(queryClient, item),
        )}
      />
    </View>
  );

  if (
    (!isAuthenticated && section === SectionType.YourFavorites) ||
    (!isLoading && !error && !data?.length)
  )
    return null;

  const headerDisabled = section === SectionType.YourFavorites || isLoading || Boolean(error);

  return (
    <View style={styles.section} testID={`home-section-${section}`}>
      <Pressable
        hitSlop={14}
        // Your Favorites has no explore page, so it never gets an href
        {...(section === SectionType.YourFavorites
          ? {}
          : linkProps(routes.explore(section), undefined, headerDisabled))}
        accessibilityRole="link"
        disabled={section === SectionType.YourFavorites}
        aria-busy={isLoading}
        style={styles.header}
      >
        <Text accessibilityRole="header" aria-level={2} style={styles.headerTitle}>
          {section}
        </Text>
        {!isLoading && !error && section !== SectionType.YourFavorites && (
          <Text style={styles.headerAction}>View All</Text>
        )}
      </Pressable>
      {isLoading ? (
        <View style={webScrollTrack}>
          <View style={styles.loadingContainer}>
            <FullPageLoader />
          </View>
        </View>
      ) : error ? (
        <RetryButton message={error.message} onPress={() => void refetch()} />
      ) : (
        <FlatList
          data={data}
          renderItem={renderMoviePoster}
          keyExtractor={(item) => `${item.isTvShow ? 'tv' : 'movie'}-${item.id}`}
          horizontal
          style={webScrollTrack}
          contentContainerStyle={styles.flatListContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SPACING.small,
    paddingHorizontal: SPACING.medium,
  },
  headerTitle: {
    ...TYPOGRAPHY.sectionTitle,
  },
  headerAction: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.accentText,
  },
  flatListContent: {
    paddingHorizontal: SPACING.medium,
  },
  loadingContainer: {
    width: '100%',
    // Same height as the loaded row so the section does not jump when data arrives
    height: movieCardHeight(CARD_WIDTH),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeSection;
