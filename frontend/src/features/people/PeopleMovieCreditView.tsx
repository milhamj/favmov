import { linkProps } from '@/navigation/linkProps';
import { StyleSheet, Pressable, Text, View, Image } from 'react-native';
import { routes } from '@/navigation/routes';
import { creditPosterUrl, PeopleMovieCredit } from '@/features/people/peopleModel';
import React from 'react';
import { COLORS, RADIUS, TYPOGRAPHY, SPACING } from '@/theme/colors';
import { displayRating, getRatingColor } from '@/lib/util';
import { MaterialIcons } from '@expo/vector-icons';
import { Movie } from '@/features/movies/movieModel';
import { seedMovieDetails } from '@/features/movies/movieQueries';
import { useQueryClient } from '@tanstack/react-query';

interface PeopleMovieCreditProps {
  credit: PeopleMovieCredit;
}

const PeopleMovieCreditView = ({ credit }: PeopleMovieCreditProps) => {
  const queryClient = useQueryClient();
  const releaseDate = credit.releaseDate ? credit.releaseDate.split('-')[0] : '----';

  const seedCredit = () => {
    const movie: Movie = {
      id: credit.id ?? 0,
      title: credit.title ?? '',
      posterPath: credit.posterPath ?? '',
      releaseDate: credit.releaseDate,
      rating: credit.rating,
      ratingCount: credit.ratingCount,
      isTvShow: credit.isTvShow,
    };
    seedMovieDetails(queryClient, movie);
  };

  const rating = credit.rating ?? undefined;

  return (
    <Pressable
      {...linkProps(routes.movie(credit.id, credit.isTvShow), seedCredit)}
      accessibilityRole="link"
      accessibilityLabel={
        credit.title + (rating !== undefined ? `, rated ${displayRating(rating)}` : '')
      }
      style={({ pressed }) => [styles.container, pressed && { opacity: 0.7 }]}
    >
      <Text style={styles.creditYear}>{releaseDate}</Text>
      <Image
        aria-hidden
        importantForAccessibility="no"
        source={{ uri: creditPosterUrl(credit) }}
        style={styles.creditPoster}
      />
      <View style={styles.creditTitleContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MaterialIcons
            aria-hidden
            importantForAccessibility="no"
            name={credit.isTvShow ? 'tv' : 'movie'}
            size={12}
          />
          <Text
            style={{ flex: 1, ...TYPOGRAPHY.rowTitle, color: COLORS.text }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >{`${credit.title}`}</Text>
        </View>
        {credit.character && (
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.creditCharacter}>
            {`as ${credit.character}`}
          </Text>
        )}
        {rating !== undefined && (
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.creditRating}>
            ⭐
            <Text
              style={{
                color: getRatingColor(rating),
                fontWeight: 'bold',
              }}
            >
              {` ${displayRating(rating)} `}
            </Text>
            <Text style={styles.creditRatingCount}>({credit.ratingCount ?? 0})</Text>
          </Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.medium,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  creditYear: {
    width: 38,
  },
  creditPoster: {
    borderRadius: RADIUS.control,
    width: 40,
    aspectRatio: 2 / 3,
  },
  creditRating: {
    ...TYPOGRAPHY.caption,
  },
  creditRatingCount: {
    color: COLORS.secondaryText,
    fontWeight: 'normal',
  },
  creditTitleContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  creditCharacter: {
    ...TYPOGRAPHY.caption,
    fontStyle: 'italic',
    color: COLORS.secondaryText,
  },
});

export default PeopleMovieCreditView;
