import EmptyState from '@/components/EmptyState';
import FullPageLoader from '@/components/FullPageLoader';
import PageContainer from '@/components/PageContainer';
import NextPageFooter, { loadNextPage } from '@/components/NextPageFooter';
import RetryButton from '@/components/RetryButton';
import TopBar from '@/components/TopBar';
import MovieCard from '@/features/movies/MovieCard';
import { Movie } from '@/features/movies/movieModel';
import { seedMovieDetails, useExploreMovies } from '@/features/movies/movieQueries';
import { useGridLayout } from '@/hooks/useGridLayout';
import { useHydrated } from '@/lib/useHydrated';
import { appendUnique, parseStrParam } from '@/lib/util';
import { router } from '@/navigation/router';
import { routes } from '@/navigation/routes';
import { linkProps } from '@/navigation/linkProps';
import { SPACING } from '@/theme/colors';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

const ExploreScreen = ({ params }: { params: ReturnType<typeof useLocalSearchParams> }) => {
  const queryClient = useQueryClient();
  const { numColumns, itemWidth, onContentSizeChange } = useGridLayout(150);
  const hydrated = useHydrated();
  const sectionType = hydrated ? parseStrParam(params.section_type) : '';

  const title = sectionType;
  const query = useExploreMovies(sectionType);
  const movies =
    query.data?.pages.reduce((all, page) => appendUnique(all, page), [] as Movie[]) ?? [];
  const isLoading =
    !hydrated ||
    (query.isPending &&
      ['Trending Movies', 'Trending TV Shows', 'Popular Movies'].includes(sectionType));
  const renderMovieItem = ({ item, index }: { item: Movie; index: number }) => (
    <View
      style={{
        width: itemWidth,
        marginTop: index < numColumns ? SPACING.medium : 0,
        marginBottom: SPACING.medium,
        alignContent: 'center',
      }}
    >
      <MovieCard
        movie={item}
        link={linkProps(routes.movie(item.id, item.isTvShow), () =>
          seedMovieDetails(queryClient, item),
        )}
      />
    </View>
  );

  const isEmptyResult = movies.length === 0 && !isLoading;

  return (
    <PageContainer
      topBar={
        <TopBar
          title={title}
          backButton={{
            isShow: true,
            onClick: () => router.goBackSafely(),
          }}
        />
      }
    >
      <View style={styles.scrollContainer}>
        {isLoading ? (
          <FullPageLoader />
        ) : query.isError && !query.data ? (
          <RetryButton message="Unable to load results" onPress={() => void query.refetch()} />
        ) : isEmptyResult ? (
          <EmptyState
            title="No results found."
            illustration={require('../../../assets/images/empty_search.png')}
          />
        ) : (
          <FlatList
            key={numColumns}
            onContentSizeChange={onContentSizeChange}
            extraData={itemWidth}
            data={movies}
            renderItem={renderMovieItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={numColumns}
            columnWrapperStyle={styles.row}
            onEndReached={() => loadNextPage(query)}
            onEndReachedThreshold={0.3}
            ListFooterComponent={<NextPageFooter query={query} />}
          />
        )}
      </View>
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    paddingHorizontal: SPACING.medium,
  },
  row: {
    justifyContent: 'flex-start',
    gap: SPACING.medium,
  },
});

export default ExploreScreen;
