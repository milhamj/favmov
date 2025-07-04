import React, { useState } from 'react';
import { Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import Checkbox from 'expo-checkbox';
import { CollectionCard } from '../model/collectionModel';
import { deleteMovieFromCollection, postAddMovieToCollection } from '../services/collectionService';
import { Movie } from '../model/movieModel';

interface CollectionAddCardProps {
    collection: CollectionCard;
    movie: Movie;
}

const CollectionAddCard = ({ collection, movie }: CollectionAddCardProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(collection.isInCollection);

    const handleAddToCollection = async (value: boolean) => {
        setIsLoading(true);
        if (value) {
            const response = await postAddMovieToCollection(collection.id.toString(), movie, movie.isTvShow || false);
            if (response instanceof Error) {
                console.error('Error adding movie to collection:', response);
            } else {
                setIsSaved(!isSaved);
            }
            setIsLoading(false);
        } else {
            const response = await deleteMovieFromCollection(collection.id.toString(), movie.id.toString(), movie.isTvShow || false);
            if (response instanceof Error) {
                console.error('Error deleting movie from collection:', response);
            } else {
                setIsSaved(!isSaved);
            }
            setIsLoading(false);
        }
    }

    return (
        <View>
            <View style={styles.selectionContainer}>
                <Text style={styles.collectionName}>{collection.name}</Text>
                <View style={styles.checkboxContainer}>
                    {
                        isLoading ? (
                            <ActivityIndicator style={styles.checkbox} color="tomato"/>
                        ) : (
                            <Checkbox style={styles.checkbox} value={isSaved} onValueChange={handleAddToCollection} color='tomato'/>
                        )
                    }
                </View>
            </View>
            <View style={styles.separator}/>
        </View>
    )
}

const styles = StyleSheet.create({
    selectionContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    collectionName: {
        width: '90%',
        fontSize: 16,
        fontWeight: '700'
    },
    checkboxContainer: {
        flex: 1,
        width: '10%',
        alignItems: 'flex-end'
    },
    checkbox: {
        width: 18,
        height: 18
    },
    separator: {
        width: '100%',
        height: 1,
        backgroundColor: '#e0e0e0',
        marginEnd: 8,
        marginTop: 8,
        marginBottom: 16
    }
})

export default CollectionAddCard;