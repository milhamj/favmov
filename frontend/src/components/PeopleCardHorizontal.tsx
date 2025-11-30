import React from 'react';
import { StyleSheet, TouchableOpacity, View, Image, Text } from 'react-native';
import { COLORS } from '../styles/colors'; 
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
    fontSize: 16,
    textAlign: 'left',
    fontWeight: '700'
  },
});

export default PeopleCardHorizontal;