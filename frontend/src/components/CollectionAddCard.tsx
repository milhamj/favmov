import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, View, ActivityIndicator, TextInput } from 'react-native';
import Checkbox from 'expo-checkbox';
import { CollectionCard } from '../model/collectionModel';
import { deleteMovieFromCollection, postAddMovieToCollection, updateNotes } from '../services/collectionService';
import { Movie } from '../model/movieModel';
import { Error, Success } from '../model/apiResponse';
import Toast from 'react-native-toast-message';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { CollectionStateStore } from '../stores/collectionStateStore';

interface CollectionAddCardProps {
    collection: CollectionCard;
    movie: Movie;
}

const CollectionAddCard = ({ collection, movie }: CollectionAddCardProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(collection.isInCollection);
    const [notes, setNotes]  = useState(movie.notesInCollection(collection.id) || '');

    const handleAddToCollection = async (value: boolean) => {
        setIsLoading(true);
        if (value) {
            const response = await postAddMovieToCollection(collection.id, movie, movie.isTvShow || false);
            if (response instanceof Error) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: response.message,
                    position: 'bottom'
                  });
            } else {
                setIsSaved(!isSaved);
                CollectionStateStore.setLastUpdated(Date.now());
            }
            setIsLoading(false);
        } else {
            const response = await deleteMovieFromCollection(collection.id, movie.id.toString(), movie.isTvShow || false);
            if (response instanceof Error) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: response.message,
                    position: 'bottom'
                  });
            } else {
                setIsSaved(!isSaved);
                CollectionStateStore.setLastUpdated(Date.now());
            }
            setIsLoading(false);
        }
    }

    const handleNotesUpdate = async (newNotes: string) => {
        setNotes(newNotes);
        debouncedUpdateNotes(newNotes);
    }

    const debouncedUpdateNotes = useDebouncedCallback(async (newNotes: string) => {
        setIsLoading(true);

        newNotes = newNotes.trim();
        const result = await updateNotes(
            collection.id, 
            movie.id.toString(), 
            movie.isTvShow || false, newNotes
        );

        if (result instanceof Error) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: result.message,
                position: 'bottom',
            });
        } else {
            CollectionStateStore.setLastUpdated(Date.now());
        }

        setIsLoading(false);
    }, 1000);

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
            {   
                    isSaved ? (
                        <TextInput
                            style={styles.notesInput}
                            placeholder="Write custom notes..."
                            placeholderTextColor="#898989"
                            value={notes}
                            onChangeText={handleNotesUpdate}
                        />
                    ) : null
            }
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
    notesInput: {
        minHeight: 32,
        borderColor: '#e0e0e0',
        borderWidth: 0.5,
        borderRadius: 4,
        paddingHorizontal: 4,
        marginTop: 6,
        marginBottom: 2,
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