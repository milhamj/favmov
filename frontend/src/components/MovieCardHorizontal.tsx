import React from 'react';
import { StyleSheet, TouchableOpacity, View, Image, Text } from 'react-native';
import { Movie } from '../model/movieModel';
import { COLORS } from '../styles/colors'; 
import ExpandableText from './ExpandableText';

interface MovieCardHorizontalProps {
    movie: Movie;
    onClick?: (movie: Movie) => void;
}

const MovieCardHorizontal: React.FC<MovieCardHorizontalProps> = ({ movie, onClick }) => {
    const Container = onClick ? TouchableOpacity : View;

    return (
        <Container onPress={onClick ? () => onClick(movie) : undefined} style={styles.posterContainer}>
            <Image source={{ uri: movie.smallPosterUrl() }} style={[styles.poster]} />
            <View style={styles.posterInfo}>
                <Text style={styles.posterTitle}>
                    {movie.title}
                </Text>
                { movie.rating && (
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
                { movie.collectionNotes && (
                    <View style={styles.posterNotes}>
                        <ExpandableText
                            text={movie.collectionNotes}
                            maxLines={2}
                        />
                    </View>
                )}
            </View>
        </Container>
    );
}

const styles = StyleSheet.create({
  posterContainer: {
    width: '100%',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flex: 1,
    flexDirection: 'row',
  },
  poster: {
    width: 80,
    aspectRatio: 3 / 4,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  posterInfo: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 8,
  },
  posterTitle: {
    marginTop: 2,
    fontSize: 12,
    textAlign: 'left',
    fontWeight: '700'
  },
  posterRating: {
    marginTop: 2,
    fontSize: 12,
    textAlign: 'left',
  },
  posterRatingCount: {
    color: COLORS.text_gray,
    fontWeight: 'normal',
  },
  posterNotes: {
    marginTop: 2,
  },
});

export default MovieCardHorizontal;