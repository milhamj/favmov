import { linkKeyboardProps } from '@/navigation/linkKeyboardProps';
import { COLORS, TYPOGRAPHY, SPACING } from '@/theme/colors';
import React from 'react';
import { Text, StyleSheet, View, FlatList, Pressable } from 'react-native';
import { useHomeMovies, seedMovieDetails } from './movieQueries';
import MovieCard, { movieCardHeight } from './MovieCard';
import RetryButton from '@/components/RetryButton';
import FullPageLoader from '@/components/FullPageLoader';
import { Movie } from './movieModel';
import { useAuth } from '@/features/auth/useAuth';
import { router } from '@/navigation/router';
import { routes } from '@/navigation/routes';
import { useQueryClient } from '@tanstack/react-query';

const CARD_WIDTH = 120;

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
        onClick={() => {
          seedMovieDetails(queryClient, item);
          router.navigate(routes.movie(item.id, item.isTvShow));
        }}
      />
    </View>
  );

  const handleHeaderPress = () => {
    router.navigate(routes.explore(section));
  };

  if (
    (!isAuthenticated && section === SectionType.YourFavorites) ||
    (!isLoading && !error && !data?.length)
  )
    return null;

  return (
    <View style={styles.section} testID={`home-section-${section}`}>
      <Pressable
        hitSlop={14}
        {...linkKeyboardProps}
        accessibilityRole="link"
        aria-disabled={section === SectionType.YourFavorites || isLoading || Boolean(error)}
        aria-busy={isLoading}
        style={styles.header}
        disabled={section === SectionType.YourFavorites || isLoading || Boolean(error)}
        onPress={handleHeaderPress}
      >
        <Text accessibilityRole="header" aria-level={2} style={styles.headerTitle}>
          {section}
        </Text>
        {!isLoading && !error && section !== SectionType.YourFavorites && (
          <Text style={styles.headerAction}>View All</Text>
        )}
      </Pressable>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <FullPageLoader />
        </View>
      ) : error ? (
        <RetryButton message={error.message} onPress={() => void refetch()} />
      ) : (
        <FlatList
          data={data}
          renderItem={renderMoviePoster}
          keyExtractor={(item) => `${item.isTvShow ? 'tv' : 'movie'}-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
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
