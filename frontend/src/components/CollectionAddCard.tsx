import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, View, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
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
    registerSave?: (id: string, save: (() => Promise<boolean>) | null) => void;
}

const CollectionAddCard = ({ collection, movie, registerSave }: CollectionAddCardProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(collection.isInCollection);
    const [notes, setNotes] = useState(movie.notesInCollection(collection.id) || '');
    const [saveError, setSaveError] = useState(false);
    const [saving, setSaving] = useState(false);
    const draft = useRef(notes);
    const saved = useRef(notes);
    const active = useRef<Promise<boolean> | null>(null);
    const membershipBusy = useRef(false);

    const save = useCallback((): Promise<boolean> => {
        if (active.current) return active.current;
        const run = async () => {
            setSaving(true);
            setSaveError(false);
            try {
                while (draft.current !== saved.current) {
                    const value = draft.current;
                    const result = await updateNotes(collection.id, movie.id.toString(), !!movie.isTvShow, value);
                    if (result instanceof Error) throw result;
                    saved.current = value;
                    CollectionStateStore.setLastUpdated(Date.now());
                }
                return true;
            } catch {
                setSaveError(true);
                return false;
            } finally {
                active.current = null;
                setSaving(false);
            }
        };
        // Start in a microtask so even a clean draft clears the assigned promise.
        active.current = Promise.resolve().then(run);
        return active.current;
    }, [collection.id, movie.id, movie.isTvShow]);
    const debouncedUpdateNotes = useDebouncedCallback(() => { void save(); }, 1000);
    const drain = useCallback(() => {
        debouncedUpdateNotes.cancel();
        return save();
    }, [debouncedUpdateNotes, save]);
    useEffect(() => {
        registerSave?.(collection.id, drain);
        return () => registerSave?.(collection.id, null);
    }, [registerSave, collection.id, drain]);

    const handleAddToCollection = async (value: boolean) => {
        if (active.current || membershipBusy.current) return;
        membershipBusy.current = true;
        debouncedUpdateNotes.cancel();
        setIsLoading(true);
        try {
            const result = value
                ? await postAddMovieToCollection(collection.id, movie, !!movie.isTvShow)
                : await deleteMovieFromCollection(collection.id, movie.id.toString(), !!movie.isTvShow);
            if (result instanceof Error) {
                Toast.show({ type: 'error', text1: 'Error', text2: result.message, position: 'bottom' });
            } else {
                setIsSaved(value);
                draft.current = saved.current = '';
                setNotes('');
                setSaveError(false);
                CollectionStateStore.setLastUpdated(Date.now());
            }
        } finally {
            membershipBusy.current = false;
            setIsLoading(false);
        }
    };
    const handleNotesUpdate = (value: string) => {
        draft.current = value;
        setNotes(value);
        setSaveError(false);
        debouncedUpdateNotes();
    };

    return (
        <View>
            <View style={styles.selectionContainer}>
                <Text style={styles.collectionName}>{collection.name}</Text>
                <View style={styles.checkboxContainer}>
                    {
                        isLoading || saving ? (
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
            {isSaved && <Text>{saving ? 'Saving' : saveError ? 'Unable to save notes' : draft.current === saved.current ? 'Saved' : 'Unsaved'}</Text>}
            {saveError && <TouchableOpacity accessibilityRole="button" onPress={() => void drain()}><Text>Retry</Text></TouchableOpacity>}
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