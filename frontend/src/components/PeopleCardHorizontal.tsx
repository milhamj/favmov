import React from 'react';
import { StyleSheet, TouchableOpacity, View, Image, Text } from 'react-native';
import { COLORS, RADIUS, ROW_ELEVATION, SPACING, TYPOGRAPHY } from '../styles/colors';
import { People } from '../model/peopleModel';

interface PeopleCardHorizontalProps {
    people: People;
    onClick?: (movie: People) => void;
}

const PeopleCardHorizontal: React.FC<PeopleCardHorizontalProps> = ({ people, onClick }) => {
    const Container = onClick ? TouchableOpacity : View;

    return (
        <Container onPress={onClick ? () => onClick(people) : undefined} style={styles.posterContainer}>
            <Image source={{ uri: people.photoUrl() }} style={[styles.poster]} />
            <View style={styles.posterInfo}>
                <Text style={styles.posterTitle} numberOfLines={1} ellipsizeMode="tail">
                    {people.name}
                </Text>
                { people.knownForDepartment && (
                    <Text
                      style={styles.department}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                    Known for: {people.knownForDepartment}
                    </Text>
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
    aspectRatio: 3 / 4,
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
  department: { ...TYPOGRAPHY.caption, color: COLORS.secondaryText },
  posterTitle: {
    marginTop: 2,
    ...TYPOGRAPHY.rowTitle,
    color: COLORS.text,
    textAlign: 'left'
  },
});

export default PeopleCardHorizontal;
