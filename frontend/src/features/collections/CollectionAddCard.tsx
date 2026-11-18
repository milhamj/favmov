import RetryButton from '@/components/RetryButton';
import { Movie } from '@/features/movies/movieModel';
import { COLORS, TYPOGRAPHY, SPACING } from '@/theme/colors';
import { FIELD_STYLES } from '@/theme/fields';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native';
import { CollectionCard } from './collectionModel';
import { useCollectionAddCard } from './useCollectionAddCard';

export interface CollectionAddCardProps {
  disabled?: boolean;
  discarding?: boolean;
  collection: CollectionCard;
  movie: Movie;
  onPendingChange?: (id: string, pending: boolean) => void;
  registerSave?: (id: string, save: (() => Promise<boolean>) | null) => void;
}

const CollectionAddCard = ({
  collection,
  movie,
  registerSave,
  onPendingChange,
  disabled = false,
  discarding = false,
}: CollectionAddCardProps) => {
  const {
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
  } = useCollectionAddCard({
    collection,
    movie,
    registerSave,
    onPendingChange,
    disabled,
    discarding,
  });

  return (
    <View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={collection.name}
        {...(Platform.OS === 'web'
          ? {
              onKeyDownCapture: (event: React.KeyboardEvent) => {
                // RN Web only supplies Space activation for button roles.
                if (event.key !== ' ' && event.key !== 'Spacebar') return;
                event.preventDefault();
                if (!event.repeat && !disabled && !isLoading && !saving)
                  void handleAddToCollection(!isSaved);
              },
            }
          : {})}
        aria-checked={isSaved}
        aria-disabled={disabled || isLoading || saving}
        aria-busy={isLoading || saving}
        accessibilityState={{
          checked: isSaved,
          disabled: disabled || isLoading || saving,
          busy: isLoading || saving,
        }}
        disabled={disabled || isLoading || saving}
        onPress={() => void handleAddToCollection(!isSaved)}
        style={({ pressed }) => [styles.selectionContainer, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.collectionName}>{collection.name}</Text>
        <View
          style={styles.checkboxContainer}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {isLoading || saving ? (
            <ActivityIndicator color={COLORS.accent} />
          ) : (
            <View style={[styles.checkbox, isSaved && styles.checked]}>
              {isSaved && (
                <MaterialIcons
                  aria-hidden
                  importantForAccessibility="no"
                  name="check"
                  size={14}
                  color={COLORS.onAccent}
                />
              )}
            </View>
          )}
        </View>
      </Pressable>
      {isSaved ? (
        <TextInput
          editable={!disabled && !isLoading}
          accessibilityLabel={`Notes for ${collection.name}`}
          aria-disabled={disabled || isLoading}
          accessibilityState={{ disabled: disabled || isLoading }}
          style={[FIELD_STYLES.input, FIELD_STYLES.surface, styles.notesInput]}
          placeholder="Write custom notes..."
          placeholderTextColor={COLORS.secondaryText}
          value={notes}
          onChangeText={handleNotesUpdate}
        />
      ) : null}
      {isSaved && (
        <Text accessibilityLiveRegion="polite" style={[styles.status, saveError && styles.error]}>
          {saving
            ? 'Saving'
            : saveError
              ? 'Unable to save notes'
              : draft.current === savedNotes
                ? 'Saved'
                : 'Unsaved'}
        </Text>
      )}
      {membershipFailed && (
        <Text accessibilityRole="alert" style={[styles.status, styles.error]}>
          Unable to update collection
        </Text>
      )}
      {membershipFailed ? (
        <RetryButton
          disabled={disabled || saving}
          onPress={() => void handleAddToCollection(!isSaved)}
        />
      ) : (
        saveError && <RetryButton disabled={disabled} onPress={() => void drain()} />
      )}
      <View style={styles.separator} />
    </View>
  );
};

const styles = StyleSheet.create({
  status: { ...TYPOGRAPHY.caption, color: COLORS.secondaryText, marginTop: 4 },
  error: { color: COLORS.ratingBad },
  selectionContainer: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxContainer: {
    width: 48,
    alignItems: 'flex-end',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderRadius: 2,
    borderColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: { backgroundColor: COLORS.accent },
  notesInput: {
    marginTop: 6,
    marginBottom: 2,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.border,
    marginEnd: SPACING.small,
    marginTop: SPACING.small,
    marginBottom: SPACING.medium,
  },
});

export default CollectionAddCard;
