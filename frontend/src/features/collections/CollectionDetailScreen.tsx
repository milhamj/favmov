import { LAYOUT, SPACING } from '@/theme/colors';
import AppButton from '@/components/AppButton';
import EmptyState from '@/components/EmptyState';
import FullPageLoader from '@/components/FullPageLoader';
import PageContainer from '@/components/PageContainer';
import RetryButton from '@/components/RetryButton';
import TopBar from '@/components/TopBar';
import { useCollection } from '@/features/collections/collectionQueries';
import MovieCardHorizontal from '@/features/movies/MovieCardHorizontal';
import { Movie } from '@/features/movies/movieModel';
import { seedMovieDetails } from '@/features/movies/movieQueries';
import { parseStrParam } from '@/lib/util';
import { router } from '@/navigation/router';
import { routes } from '@/navigation/routes';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

const CollectionDetailScreen = ({
  params,
}: {
  params: ReturnType<typeof useLocalSearchParams>;
}) => {
  const queryClient = useQueryClient();
  const collectionId = parseStrParam(params.id);
  const {
    data: collection,
    isPending: isLoading,
    error: failure,
    refetch,
  } = useCollection(collectionId);
  const error = collection ? '' : failure?.message;
  useEffect(() => {
    if (failure)
      Toast.show({ type: 'error', text1: 'Error', text2: failure.message, position: 'bottom' });
  }, [failure]);

  const handleEmptyButton = () => {
    router.navigate(routes.search);
  };

  const renderMovieItem = ({ item, index }: { item: Movie; index: number }) => {
    const isFirstItem = index === 0;
    const isLastItem = collection?.movies?.length === index + 1;
    return (
      <View
        style={[
          styles.movieCard,
          {
            marginTop: isFirstItem ? SPACING.medium : 0,
            marginBottom: isLastItem ? SPACING.medium : SPACING.small,
          },
        ]}
      >
        <MovieCardHorizontal
          movie={item}
          onClick={() => {
            seedMovieDetails(queryClient, item);
            router.navigate(routes.movie(item.id, item.isTvShow));
          }}
        />
      </View>
    );
  };

  return (
    <PageContainer
      topBar={
        <TopBar
          title={collection?.name ? collection.name : 'Collection'}
          backButton={{
            isShow: true,
            onClick: () => router.goBackSafely(),
          }}
        />
      }
    >
      <View style={styles.container}>
        {isLoading ? (
          <FullPageLoader />
        ) : error ? (
          <RetryButton message={error} onPress={() => void refetch()} />
        ) : collection?.movies?.length === 0 ? (
          <EmptyState
            title="No movies or TV show in this collection."
            description="Browse movies and TV shows to add them to this collection."
            illustration={require('../../../assets/images/empty_search.png')}
          >
            <AppButton
              label="Search Movies or TV Shows"
              style={styles.createButton}
              onPress={handleEmptyButton}
            />
          </EmptyState>
        ) : (
          <FlatList
            data={collection?.movies}
            renderItem={renderMovieItem}
            keyExtractor={(item) => `${item.isTvShow ? 'tv' : 'movie'}-${item.id}`}
            numColumns={1}
          />
        )}
      </View>
      <Toast />
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: LAYOUT.reading,
    alignSelf: 'center',
    width: '100%',
    flex: 1,
    paddingHorizontal: SPACING.medium,
  },
  createButton: { width: '80%', marginTop: SPACING.medium },
  movieCard: {
    width: '100%',
    marginBottom: SPACING.small,
    paddingHorizontal: 2,
    alignContent: 'center',
  },
});

export default CollectionDetailScreen;
