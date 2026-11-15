import { linkKeyboardProps } from '@/navigation/linkKeyboardProps';
import { director, Movie } from '@/features/movies/movieModel';
import { displayRating, getRatingColor } from '@/lib/util';
import { router } from '@/navigation/router';
import { routes } from '@/navigation/routes';
import { LAYOUT, COLORS, SPACING } from '@/theme/colors';
import React from 'react';
import { Image, StyleSheet, Text, Pressable, View } from 'react-native';

const handleCastClick = (id: number) => {
  router.navigate(routes.people(id.toString()));
};

export default function MovieDetails({ movie }: { movie: Movie }) {
  return (
    <View style={styles.detailsContainer}>
      <Text style={styles.title}>{movie.title}</Text>
      {movie.rating != null && (
        <Text
          style={[
            styles.rating,
            {
              color: getRatingColor(movie.rating),
            },
          ]}
        >
          {'⭐ '}
          {displayRating(movie.rating)}{' '}
          {movie.ratingCount != null && (
            <Text style={styles.ratingCount}>({movie.ratingCount})</Text>
          )}
        </Text>
      )}
      <Text style={styles.info}>
        {movie.runtime ? `${movie.runtime} minutes • ` : ''}
        {movie.releaseDate}
        {director(movie) ? ` • Directed by ${director(movie)?.name}` : ''}
        {movie.title && movie.isTvShow ? ` • TV Show` : ''}
      </Text>

      {movie.genres && movie.genres.length > 0 && (
        <View style={styles.genres}>
          {movie.genres?.map((genre, index) => (
            <Text key={index} style={styles.genre}>
              {genre}
            </Text>
          ))}
        </View>
      )}

      {movie.overview && (
        <View>
          <Text accessibilityRole="header" aria-level={2} style={styles.sectionTitle}>
            Synopsis
          </Text>
          <Text style={styles.synopsis}>{movie.overview.length > 0 ? movie.overview : 'N/A'}</Text>
        </View>
      )}

      {movie.cast && movie.cast.length > 0 && (
        <View>
          <Text accessibilityRole="header" aria-level={2} style={styles.sectionTitle}>
            Cast
          </Text>
          {movie.cast?.map((actor, index) => (
            <Pressable
              {...linkKeyboardProps}
              accessibilityRole="link"
              accessibilityLabel={actor.name}
              key={index}
              style={({ pressed }) => [styles.castItem, pressed && { opacity: 0.7 }]}
              onPress={() => handleCastClick(actor.id)}
            >
              <Image
                aria-hidden
                importantForAccessibility="no"
                source={actor.photoUrl ? { uri: actor.photoUrl } : undefined}
                style={styles.actorPhoto}
              />
              <View>
                <Text style={styles.actorName}>{actor.name}</Text>
                <Text style={styles.characterName}>{actor.character}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {movie.crew && movie.crew.length > 0 && (
        <View>
          <Text accessibilityRole="header" aria-level={2} style={styles.sectionTitle}>
            Crew
          </Text>
          <View style={styles.crewContainer}>
            {movie.crew?.map((crew, index) => (
              <Pressable
                hitSlop={14}
                {...linkKeyboardProps}
                accessibilityRole="link"
                key={index}
                style={({ pressed }) => [styles.crewItem, pressed && { opacity: 0.7 }]}
                onPress={() => handleCastClick(crew.id)}
              >
                <Text style={styles.crewName}>{crew.name}</Text>
                <Text style={styles.crewJob}>{crew.job}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  detailsContainer: {
    maxWidth: LAYOUT.reading,
    alignSelf: 'center',
    width: '100%',
    padding: SPACING.medium,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  rating: {
    fontSize: 18,
    marginVertical: 4,
    fontWeight: 'bold',
  },
  ratingCount: {
    color: COLORS.secondaryText,
    fontWeight: 'normal',
  },
  info: {
    fontSize: 16,
    color: COLORS.secondaryText,
  },
  genres: {
    flexDirection: 'row',
    marginVertical: SPACING.small,
  },
  genre: {
    backgroundColor: COLORS.genreSurface,
    borderRadius: 4,
    padding: 4,
    marginRight: SPACING.small,
    alignContent: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: SPACING.small,
  },
  synopsis: {
    fontSize: 16,
    color: COLORS.text,
  },
  castItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.small,
  },
  actorPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: SPACING.medium,
  },
  actorName: {
    fontSize: 16,
    fontWeight: '500',
  },
  characterName: {
    fontSize: 14,
    color: COLORS.secondaryText,
  },
  crewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  crewItem: {
    width: '48%',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  crewName: {
    fontSize: 14,
    fontWeight: '500',
  },
  crewJob: {
    fontSize: 12,
    fontWeight: 'light',
    color: COLORS.secondaryText,
  },
});
