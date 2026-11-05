import RetryButton from './RetryButton';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, View, ActivityIndicator, TextInput } from 'react-native';
import Checkbox from 'expo-checkbox';
import { CollectionCard } from '../model/collectionModel';
import { deleteMovieFromCollection, postAddMovieToCollection, updateNotes } from '../services/collectionService';
import { Movie } from '../model/movieModel';
import { Error } from '../model/apiResponse';
import Toast from 'react-native-toast-message';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { CollectionStateStore } from '../stores/collectionStateStore';
import { unsavedNotes } from '../stores/unsavedNotesStore';

interface CollectionAddCardProps {
    disabled?: boolean;
    discarding?: boolean;
    collection: CollectionCard;
    movie: Movie;
    onPendingChange?: (id: string, pending: boolean) => void;
    registerSave?: (id: string, save: (() => Promise<boolean>) | null) => void;
}

const CollectionAddCard = ({ collection, movie, registerSave, onPendingChange, disabled = false, discarding = false }: CollectionAddCardProps) => {
    const draftKey = `${collection.id}:${movie.id}:${!!movie.isTvShow}`;
    const serverNotes = movie.notesInCollection(collection.id) || '';
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(collection.isInCollection);
    const [notes, setNotes] = useState(() => {
        const unsaved = collection.isInCollection ? unsavedNotes.get(draftKey) : undefined;
        return unsaved?.base.current.trim() === serverNotes.trim() ? unsaved.draft : serverNotes;
    });
    const [saveError, setSaveError] = useState(false);
    const [saving, setSaving] = useState(false);
    const draft = useRef(notes);
    const saved = useRef(serverNotes);
    const discardingRef = useRef(discarding);
    discardingRef.current = discarding;
    const active = useRef<Promise<boolean> | null>(null);
    const membershipRequest = useRef<Promise<boolean> | null>(null);
    const [membershipFailed, setMembershipFailed] = useState(false);

    const save = useCallback((): Promise<boolean> => {
        if (active.current) return active.current;
        if (draft.current === saved.current) {
            setSaveError(false);
            return Promise.resolve(true);
        }
        const run = async () => {
            setSaving(true);
            setSaveError(false);
            try {
                while (!discardingRef.current && draft.current !== saved.current) {
                    const value = draft.current;
                    const result = await updateNotes(collection.id, movie.id.toString(), !!movie.isTvShow, value);
                    if (result instanceof Error) throw result;
                    saved.current = value;
                    CollectionStateStore.setLastUpdated(Date.now());
                }
                return true;
            } catch (failure: any) {
                setSaveError(true);
                Toast.show({ type: 'error', text1: 'Error', text2: failure.message || 'Unable to save notes', position: 'bottom' });
                return false;
            } finally {
                active.current = null;
                setSaving(false);
            }
        };
        active.current = run();
        return active.current;
    }, [collection.id, movie.id, movie.isTvShow]);
    const debouncedUpdateNotes = useDebouncedCallback(() => { void save(); }, 1000);
    useEffect(() => {
        const unsaved = unsavedNotes.get(draftKey);
        if (unsaved && unsaved.draft !== draft.current) {
            Toast.show({ type: 'info', text1: 'Unsaved note not restored', text2: 'This note changed since your draft.', position: 'bottom' });
        }
        unsavedNotes.delete(draftKey);
        if (draft.current !== saved.current) debouncedUpdateNotes();
        return () => {
            if (!discardingRef.current && draft.current !== saved.current) {
                // Some exits skip the leave guard, so save now; the stored draft covers a save that cannot succeed.
                const unsaved = { draft: draft.current, base: saved };
                unsavedNotes.set(draftKey, unsaved);
                void save().then(ok => { if (ok && unsavedNotes.get(draftKey) === unsaved) unsavedNotes.delete(draftKey); });
            }
        };
    }, [draftKey, debouncedUpdateNotes, save]);
    const changeMembership = useCallback((value: boolean): Promise<boolean> => {
        debouncedUpdateNotes.cancel();
        setIsLoading(true);
        setMembershipFailed(false);
        const run = async () => {
            try {
                let serverText = '';
                if (value) {
                    const result = await postAddMovieToCollection(collection.id, movie, !!movie.isTvShow);
                    if (result instanceof Error) throw result;
                    // The row may already exist, for example after a lost response, with notes of its own.
                    serverText = result.data.notes ?? '';
                } else {
                    const result = await deleteMovieFromCollection(collection.id, movie.id.toString(), !!movie.isTvShow);
                    if (result instanceof Error) throw result;
                }
                setIsSaved(value);
                draft.current = saved.current = serverText;
                setNotes(serverText);
                setSaveError(false);
                CollectionStateStore.setLastUpdated(Date.now());
                return true;
            } catch (failure: any) {
                setMembershipFailed(true);
                Toast.show({ type: 'error', text1: 'Error', text2: failure.message || 'Unable to update collection', position: 'bottom' });
                if (!value && draft.current !== saved.current) debouncedUpdateNotes();
                return false;
            } finally {
                membershipRequest.current = null;
                setIsLoading(false);
            }
        };
        membershipRequest.current = Promise.resolve().then(run);
        return membershipRequest.current;
    }, [collection.id, debouncedUpdateNotes, movie]);
    const drain = useCallback(async () => {
        debouncedUpdateNotes.cancel();
        // Only a change failing during this leave blocks it: an earlier failure is already on screen, and is never replayed.
        const membershipSaved = membershipRequest.current ? await membershipRequest.current : true;
        const notesSaved = await save();
        return membershipSaved && notesSaved;
    }, [debouncedUpdateNotes, save]);
    useEffect(() => {
        registerSave?.(collection.id, drain);
        return () => registerSave?.(collection.id, null);
    }, [registerSave, collection.id, drain]);

    useEffect(() => {
        onPendingChange?.(collection.id, notes !== saved.current || saving || isLoading);
    }, [collection.id, onPendingChange, notes, saving, isLoading]);
    useEffect(() => () => onPendingChange?.(collection.id, false), [collection.id, onPendingChange]);

    const handleAddToCollection = (value: boolean) => {
        if (disabled || active.current || membershipRequest.current) return;
        return changeMembership(value);
    };
    const handleNotesUpdate = (value: string) => {
        if (disabled || membershipRequest.current) return;
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
                            <Checkbox disabled={disabled} style={styles.checkbox} value={isSaved} onValueChange={handleAddToCollection} color='tomato'/>
                        )
                    }
                </View>
            </View>
            {   
                    isSaved ? (
                        <TextInput
                            editable={!disabled && !isLoading}
                            style={styles.notesInput}
                            placeholder="Write custom notes..."
                            placeholderTextColor="#898989"
                            value={notes}
                            onChangeText={handleNotesUpdate}
                        />
                    ) : null
            }
            {isSaved && <Text>{saving ? 'Saving' : saveError ? 'Unable to save notes' : draft.current === saved.current ? 'Saved' : 'Unsaved'}</Text>}
            {membershipFailed && <Text>Unable to update collection</Text>}
            {membershipFailed ? <RetryButton disabled={disabled || saving} onPress={() => void handleAddToCollection(!isSaved)}/> : saveError && <RetryButton disabled={disabled} onPress={() => void drain()}/>}
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