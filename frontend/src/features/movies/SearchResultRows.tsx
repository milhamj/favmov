import { SPACING } from '@/theme/colors';
import MovieCard from '@/features/movies/MovieCard';
import { Movie } from '@/features/movies/movieModel';
import { seedMovieDetails } from '@/features/movies/movieQueries';
import PeopleCardHorizontal from '@/features/people/PeopleCardHorizontal';
import { People } from '@/features/people/peopleModel';
import { linkProps } from '@/navigation/linkProps';
import { routes } from '@/navigation/routes';
import React from 'react';
import { View } from 'react-native';

import type { QueryClient } from '@tanstack/react-query';
export const renderSearchMovieResult = ({
  item,
  itemWidth,
  queryClient,
}: {
  item: Movie;
  itemWidth: number;
  queryClient: QueryClient;
}) => (
  <View
    style={{
      width: itemWidth,
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

export const renderSearchPersonResult = ({ item }: { item: People }) => (
  <View
    style={{
      width: '100%',
      marginBottom: SPACING.small,
      alignContent: 'center',
    }}
  >
    <PeopleCardHorizontal people={item} link={linkProps(routes.people(item.id.toString()))} />
  </View>
);
