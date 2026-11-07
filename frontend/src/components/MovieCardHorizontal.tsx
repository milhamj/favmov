import React from 'react';
import { StyleSheet, TouchableOpacity, View, Image, Text } from 'react-native';
import { Movie } from '../model/movieModel';
import { COLORS, RADIUS, ROW_ELEVATION, SPACING, TYPOGRAPHY } from '../styles/colors';
import ExpandableText from './ExpandableText';
import { displayRating, getRatingColor } from '../utils/util';

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
                <Text style={styles.posterTitle} numberOfLines={1} ellipsizeMode="tail">
                    {movie.title}{movie.releaseYear() ? ` (${movie.releaseYear()})` : ''}
                </Text>
                { movie.rating && (
                    <Text
                    style={[
                        styles.posterRating,
                        {
                            color: getRatingColor(movie.rating),
                            fontWeight: 'bold',
                        },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    >
                    ⭐ {displayRating(movie.rating)}{' '}
                    {movie.ratingCount != null && (
                        <Text style={styles.posterRatingCount}>({movie.ratingCount})</Text>
                    )}
                    </Text>
                )}
                { movie.collectionNotes && (
                    <View style={styles.posterNotes}>
                        <ExpandableText
                            text={movie.collectionNotes}
                            textStyle={styles.posterNotesText}
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
    borderRadius: RADIUS.control,
    ...ROW_ELEVATION,
    backgroundColor: COLORS.page,
    flex: 1,
    flexDirection: 'row',
  },
  poster: {
    width: 80,
    aspectRatio: 2 / 3,
    borderTopLeftRadius: RADIUS.control,
    borderBottomLeftRadius: RADIUS.control,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  posterInfo: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    padding: SPACING.small,
  },
  posterTitle: {
    marginTop: 2,
    ...TYPOGRAPHY.rowTitle,
    color: COLORS.text,
    textAlign: 'left'
  },
  posterRating: {
    marginTop: 2,
    ...TYPOGRAPHY.caption,
    textAlign: 'left',
  },
  posterRatingCount: {
    color: COLORS.secondaryText,
    fontWeight: 'normal',
  },
  posterNotes: {
    marginTop: 2,
  },
  posterNotesText: {
    ...TYPOGRAPHY.caption,
    textAlign: 'left',
    color: COLORS.text,
  },
});

export default MovieCardHorizontal;
