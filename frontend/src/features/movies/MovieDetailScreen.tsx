import FullPageLoader from '@/components/FullPageLoader';
import RetryButton from '@/components/RetryButton';
import PageContainer from '@/components/PageContainer';
import { SeoHead, URL_DEFAULT } from '@/components/SeoHead';
import TopBar from '@/components/TopBar';
import { useAuth } from '@/features/auth/useAuth';
import { useContainingCollections } from '@/features/collections/collectionQueries';
import { useMovieDetails } from '@/features/movies/movieQueries';
import { parseBooleanParam, parseTmdbId } from '@/lib/util';
import { useHydrated } from '@/lib/useHydrated';
import { router } from '@/navigation/router';
import { routes } from '@/navigation/routes';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from 'expo-router/react-navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import MovieDetails from './MovieDetails';
import { smallPosterUrl } from './movieModel';
import MoviePoster from './MoviePoster';

const MovieDetailScreen = ({ params }: { params: ReturnType<typeof useLocalSearchParams> }) => {
  const movieId = parseTmdbId(params.id);
  const hydrated = useHydrated();
  const isTvShow = parseBooleanParam(params.is_tv_show);

  const { isAuthenticated, loading: isAuthLoading } = useAuth();
  const [isFocused, setIsFocused] = useState(true);

  const details = useMovieDetails(String(movieId), isTvShow);
  const membership = useContainingCollections(String(movieId), isTvShow);
  const movie = details.data ?? { title: '', posterPath: '', id: movieId ?? 0, isTvShow };
  const collections = isAuthenticated ? (membership.data ?? []) : [];
  const { error: detailsError, data: detailsData } = details;
  const { error: membershipError } = membership;
  useEffect(() => {
    if (detailsError && detailsData)
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: detailsError.message,
        position: 'bottom',
      });
  }, [detailsError, detailsData]);
  useEffect(() => {
    if (membershipError)
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: membershipError.message,
        position: 'bottom',
      });
  }, [membershipError]);
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  return (
    <PageContainer
      topBar={
        <TopBar
          title={movie.title}
          backButton={{
            isShow: true,
            onClick: () => router.goBackSafely(),
          }}
        />
      }
    >
      {/* Focus check: this screen stays mounted under pushed ones, which shouldn't keep its tags */}
      {movie.title && isFocused ? (
        <SeoHead
          title={`${movie.title} | FavMov`}
          description={movie.overview || undefined}
          image={smallPosterUrl(movie)}
          url={URL_DEFAULT + routes.movie(movie.id, movie.isTvShow)}
        />
      ) : null}

      {/* The prerendered page has no real id, so wait for hydration before calling it invalid */}
      {movieId === null && hydrated ? (
        <RetryButton message="Invalid title URL" />
      ) : !details.data ? (
        details.isError ? (
          <RetryButton message="Unable to load title" onPress={() => void details.refetch()} />
        ) : (
          <FullPageLoader />
        )
      ) : (
        <ScrollView>
          <MoviePoster
            movie={movie}
            isAuthenticated={isAuthenticated}
            isAuthLoading={isAuthLoading}
            membership={membership}
            details={details}
            collections={collections}
          />
          <MovieDetails movie={movie} />
        </ScrollView>
      )}
      <Toast />
    </PageContainer>
  );
};

export default MovieDetailScreen;
