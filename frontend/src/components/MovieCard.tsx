import React from 'react';
import { StyleSheet, Dimensions, TouchableOpacity, View, Image, Text } from 'react-native';
import { Movie } from '../model/movieModel';
import { COLORS } from '../styles/colors'; 

interface MovieCardProps {
    movie: Movie;
    onClick: (movie: Movie) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick}) => {
  return (
    <TouchableOpacity onPress={() => onClick(movie)}>
      <View style={[styles.posterContainer]}>
        <Image source={{ uri: movie.smallPosterUrl() }} style={[styles.poster]} />
        <Text style={styles.posterTitle} numberOfLines={1} ellipsizeMode="tail">
          {movie.title}
        </Text>
        {movie.rating && (
          <Text
            style={[
              styles.posterRating,
              {
                color: movie.rating > 5.0 ? COLORS.rating_green : COLORS.rating_red,
                fontWeight: 'bold',
              },
            ]}
          >
            ⭐ {movie.rating}{' '}
            {movie.ratingCount && (
              <Text style={styles.posterRatingCount}>({movie.ratingCount})</Text>
            )}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  posterContainer: {
    flex: 1,
  },
  poster: {
    aspectRatio: 9 / 16,
    borderRadius: 8,
  },
  posterTitle: {
    marginTop: 4,
    fontSize: 14,
    textAlign: 'left',
    fontWeight: '500'
  },
  posterRating: {
    marginTop: 2,
    fontSize: 10,
    textAlign: 'left',
  },
  posterRatingCount: {
    color: COLORS.text_gray,
    fontWeight: 'normal',
  },
});

export default MovieCard;