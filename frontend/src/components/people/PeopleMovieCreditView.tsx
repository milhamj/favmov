import { StyleSheet, TouchableOpacity, Text, View, Image } from "react-native";
import { routes } from '../../navigation/routes';
import { router } from '../../navigation/router';
import { PeopleMovieCredit } from "../../model/peopleModel";
import React from "react";
import { COLORS } from "../../styles/colors";

interface PeopleMovieCreditProps {
    credit: PeopleMovieCredit;
}

const PeopleMovieCreditView = ({ credit }: PeopleMovieCreditProps) => {
    const releaseDate = credit.releaseDate ? credit.releaseDate.split("-")[0] : "----";

    const handleCreditPress = (creditId: number, isTvShow?: boolean) => {
        router.navigate(routes.movie(creditId, isTvShow));
    }
    return <TouchableOpacity 
        style={styles.container}
        key={`${credit.id}_${credit.character}`}
        onPress={() => handleCreditPress(credit.id, credit.isTvShow)}>
            <Text style={styles.creditYear}>{releaseDate}</Text>
            <Image source={{ uri: credit.posterUrl() }} style={styles.creditPoster} />
            <View style={styles.creditTitleContainer}>
                <Text numberOfLines={1} ellipsizeMode="tail">{`${credit.title}`}</Text>
                { credit.character && (
                    <Text 
                    numberOfLines={1} 
                    ellipsizeMode="tail"
                    style={styles.creditCharacter}>
                        {`as ${credit.character}`}
                    </Text>
                )}
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
    creditTitleContainer: {
        flex:1, 
        flexDirection: 'column', 
        justifyContent: 'center'
    },
    creditCharacter: {
        fontStyle: 'italic', 
        color: COLORS.text_gray
    }
});

export default PeopleMovieCreditView;