import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Image, Text } from 'react-native';
import { Movie } from '../model/movieModel';
import { COLORS } from '../styles/colors'; 

interface MovieCardProps {
    movie: Movie;
    onClick: (movie: Movie) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
    return (
        <TouchableOpacity onPress={() => onClick(movie)}>
          <View style={styles.posterContainer}>
            <Image source={{ uri: movie.smallPosterUrl() }} style={styles.poster} />
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
        marginRight: 8,
        alignItems: 'center',
      },
      poster: {
        width: 120,
        height: 180,
        borderRadius: 8,
      },
      posterTitle: {
        marginTop: 4,
        fontSize: 14,
        textAlign: 'left',
        width: 120,
        fontWeight: '500'
      },
      posterRating: {
        marginTop: 2,
        fontSize: 10,
        textAlign: 'left',
        width: 120,
      },
      posterRatingCount: {
        color: COLORS.text_gray,
        fontWeight: 'normal',
      },
});

export default MovieCard;