import { StyleSheet, TouchableOpacity, Text, View, Image } from "react-native";
import { routes } from '../../navigation/routes';
import { router } from '../../navigation/router';
import { PeopleMovieCredit } from "../../model/peopleModel";
import React from "react";
import { COLORS } from "../../styles/colors";
import { getRatingColor } from "../../utils/util";
import { Icon } from "react-native-elements";
import { Movie } from "../../model/movieModel";
import { MovieStore } from "../../stores/movieStore";

interface PeopleMovieCreditProps {
    credit: PeopleMovieCredit;
}

const PeopleMovieCreditView = ({ credit }: PeopleMovieCreditProps) => {
    const releaseDate = credit.releaseDate ? credit.releaseDate.split("-")[0] : "----";

    const handleCreditPress = () => {
        const movie = new Movie({
            id: credit.id,
            title: credit.title,
            posterPath: credit.posterPath,
            releaseDate: credit.releaseDate,
            rating: credit.rating,
            ratingCount: credit.ratingCount,
            isTvShow: credit.isTvShow,
        });
        MovieStore.cacheMovie(movie);
        router.navigate(routes.movie(credit.id, credit.isTvShow));
    }

    const rating = credit.rating ? parseFloat(credit.rating.toFixed(2)) : undefined;

    return <TouchableOpacity 
        style={styles.container}
        key={`${credit.id}_${credit.character}`}
        onPress={() => handleCreditPress()}>
            <Text style={styles.creditYear}>{releaseDate}</Text>
            <Image source={{ uri: credit.posterUrl() }} style={styles.creditPoster} />
            <View style={styles.creditTitleContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Icon name={credit.isTvShow ? "tv" : "movie"} size={12} />
                    <Text style={{flex: 1}} numberOfLines={1} ellipsizeMode="tail">{`${credit.title}`}</Text>
                </View>
                { credit.character && (
                    <Text 
                    numberOfLines={1} 
                    ellipsizeMode="tail"
                    style={styles.creditCharacter}>
                        {`as ${credit.character}`}
                    </Text>
                )}
                {
                    rating && (
                        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.creditRating}>⭐
                            <Text style={{
                                color: getRatingColor(rating),
                                fontWeight: 'bold',
                            }}>
                                {` ${rating} `}
                            </Text> 
                            <Text style={styles.creditRatingCount}>({credit.ratingCount})</Text>
                        </Text>
                    )
                }
            </View>
    </TouchableOpacity>
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16, 
        flex:1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12
    },
    creditYear: {
        width: 38,
    },
    creditPoster: {
        borderRadius: 8, 
        width:40, 
        aspectRatio: 3/4
    },
    creditRating: {
        fontSize: 12,
    },
    creditRatingCount: {
        color: COLORS.text_gray,
        fontWeight: 'normal',
    },
    creditTitleContainer: {
        flex: 1,
        flexDirection: 'column', 
        justifyContent: 'center'
    },
    creditCharacter: {
        fontStyle: 'italic', 
        color: COLORS.text_gray
    }
});

export default PeopleMovieCreditView;