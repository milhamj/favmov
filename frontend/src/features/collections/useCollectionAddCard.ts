import { notesInCollection } from '@/features/movies/movieModel';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';
import {
  deleteMovieFromCollection,
  postAddMovieToCollection,
  updateNotes,
} from './collectionService';
import { unsavedNotes } from './unsavedNotesStore';

import type { CollectionAddCardProps } from './CollectionAddCard';

export function useCollectionAddCard({
  collection,
  movie,
  registerSave,
  onPendingChange,
  disabled = false,
  discarding = false,
}: CollectionAddCardProps) {
  const queryClient = useQueryClient();
  const draftKey = `${collection.id}:${movie.id}:${!!movie.isTvShow}`;
  const serverNotes = notesInCollection(movie, collection.id) || '';
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
  const [savedNotes, setSavedNotes] = useState(serverNotes);
  const discardingRef = useRef(discarding);
  useLayoutEffect(() => {
    discardingRef.current = discarding;
  });
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
          await updateNotes(collection.id, movie.id.toString(), !!movie.isTvShow, value);
          saved.current = value;
          setSavedNotes(value);
          void queryClient.invalidateQueries({ queryKey: ['collections'], refetchType: 'none' });
        }
        return true;
      } catch (failure: unknown) {
        setSaveError(true);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: (failure instanceof globalThis.Error && failure.message) || 'Unable to save notes',
          position: 'bottom',
        });
        return false;
      } finally {
        active.current = null;
        setSaving(false);
      }
    };
    active.current = run();
    return active.current;
  }, [collection.id, movie.id, movie.isTvShow, queryClient]);
  const debouncedUpdateNotes = useDebouncedCallback(() => {
    void save();
  }, 1000);
  useEffect(() => {
    const unsaved = unsavedNotes.get(draftKey);
    if (unsaved && unsaved.draft !== draft.current) {
      Toast.show({
        type: 'info',
        text1: 'Unsaved note not restored',
        text2: 'This note changed since your draft.',
        position: 'bottom',
      });
    }
    unsavedNotes.delete(draftKey);
    if (draft.current !== saved.current) debouncedUpdateNotes();
    return () => {
      if (!discardingRef.current && !membershipRequest.current && draft.current !== saved.current) {
        // Some exits skip the leave guard, so save now; the stored draft covers a save that cannot succeed.
        const unsaved = { draft: draft.current, base: saved };
        unsavedNotes.set(draftKey, unsaved);
        void save().then((ok) => {
          if (ok && unsavedNotes.get(draftKey) === unsaved) unsavedNotes.delete(draftKey);
        });
      }
    };
  }, [draftKey, debouncedUpdateNotes, save]);
  const changeMembership = useCallback(
    (value: boolean): Promise<boolean> => {
      debouncedUpdateNotes.cancel();
      setIsLoading(true);
      setMembershipFailed(false);
      const run = async () => {
        try {
          let serverText = '';
          if (value) {
            const result = await postAddMovieToCollection(collection.id, movie, !!movie.isTvShow);
            // The row may already exist, for example after a lost response, with notes of its own.
            serverText = result.notes ?? '';
          } else {
            await deleteMovieFromCollection(collection.id, movie.id.toString(), !!movie.isTvShow);
          }
          setIsSaved(value);
          draft.current = saved.current = serverText;
          setSavedNotes(serverText);
          setNotes(serverText);
          setSaveError(false);
          void queryClient.invalidateQueries({ queryKey: ['collections'] });
          return true;
        } catch (failure: unknown) {
          setMembershipFailed(true);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2:
              (failure instanceof globalThis.Error && failure.message) ||
              'Unable to update collection',
            position: 'bottom',
          });
          if (!value && draft.current !== saved.current) debouncedUpdateNotes();
          return false;
        } finally {
          membershipRequest.current = null;
          setIsLoading(false);
        }
      };
      membershipRequest.current = Promise.resolve().then(run);
      return membershipRequest.current;
    },
    [collection.id, debouncedUpdateNotes, movie, queryClient],
  );
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
    onPendingChange?.(collection.id, notes !== savedNotes || saving || isLoading);
  }, [collection.id, onPendingChange, notes, savedNotes, saving, isLoading]);
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
    setMembershipFailed(false); // editing after a failed removal means the entry stays, so Retry must not delete it
    debouncedUpdateNotes();
  };

  return {
    isLoading,
    isSaved,
    notes,
    saveError,
    saving,
    draft,
    savedNotes,
    membershipFailed,
    handleAddToCollection,
    handleNotesUpdate,
    drain,
  };
}
