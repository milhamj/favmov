import { LAYOUT, COLORS, SPACING } from '@/theme/colors';
import AppButton from '@/components/AppButton';
import EmptyState from '@/components/EmptyState';
import FullPageLoader from '@/components/FullPageLoader';
import PageContainer from '@/components/PageContainer';
import RetryButton from '@/components/RetryButton';
import TopBar from '@/components/TopBar';
import CollectionAddCard from '@/features/collections/CollectionAddCard';
import CreateCollectionSheet from '@/features/collections/CreateCollectionSheet';
import { router } from '@/navigation/router';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useAddToCollection } from './useAddToCollection';

const AddToCollectionScreen = ({ params }: { params: ReturnType<typeof useLocalSearchParams> }) => {
  const {
    movie,
    shortTitle,
    collectionCards,
    isLoading,
    error,
    setAttempt,
    draining,
    creating,
    setCreating,
    refreshError,
    refreshingCollections,
    pendingCards,
    updatePending,
    leaveFailed,
    discard,
    setDiscard,
    registerSave,
    refreshCollections,
    handleCreateCollection,
    validMovieId,
  } = useAddToCollection(params);

  return (
    <PageContainer
      topBar={
        <TopBar
          title={movie ? `Add ${shortTitle} to Collection` : 'Add to Collection'}
          backButton={{
            isShow: true,
            onClick: () => router.goBackSafely(),
          }}
        />
      }
    >
      {leaveFailed && pendingCards.size > 0 && (
        <View accessibilityRole="alert" style={styles.leaveError}>
          <Text>Your latest edits could not be saved.</Text>
          <Text>Try again, or leave and discard your unsaved edits.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Leave without saving"
            style={({ pressed }) => [styles.discardButton, pressed && { opacity: 0.7 }]}
            onPress={() => setDiscard(true)}
          >
            <Text>Leave without saving</Text>
          </Pressable>
        </View>
      )}
      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <FullPageLoader />
          </View>
        ) : error ? (
          <RetryButton
            message={error}
            onPress={validMovieId ? () => setAttempt((n) => n + 1) : undefined}
          />
        ) : refreshError && collectionCards.length === 0 ? null : collectionCards.length === 0 ? (
          <EmptyState
            title="You don't have any collections yet."
            illustration={require('../../../assets/images/empty_search.png')}
          >
            <AppButton
              label="Create Collection"
              style={styles.createButton}
              onPress={handleCreateCollection}
              disabled={draining}
            />
          </EmptyState>
        ) : (
          <View style={styles.listContent}>
            {collectionCards.map((item) => (
              <CollectionAddCard
                key={`${movie!.id}-${movie!.isTvShow}-${item.id}`}
                collection={item}
                movie={movie!}
                registerSave={registerSave}
                onPendingChange={updatePending}
                disabled={draining || discard}
                discarding={discard}
              />
            ))}
          </View>
        )}
        {refreshError && (
          <RetryButton
            message={`Unable to refresh collections: ${refreshError}`}
            disabled={draining || refreshingCollections}
            onPress={() => void refreshCollections()}
          />
        )}
      </ScrollView>
      <CreateCollectionSheet
        visible={creating}
        onClose={(success) => {
          setCreating(false);
          if (success) {
            void refreshCollections();
          }
        }}
      />
      <Toast />
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  leaveError: { padding: SPACING.medium, backgroundColor: COLORS.errorSurface },
  discardButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginTop: SPACING.small,
    borderWidth: 1,
    borderColor: COLORS.accentText,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  content: {
    maxWidth: LAYOUT.reading,
    alignSelf: 'center',
    width: '100%',
    padding: SPACING.medium,
  },
  loadingContainer: {
    minHeight: 100,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: { width: '80%', marginTop: SPACING.medium },
  listContent: {
    paddingBottom: SPACING.medium,
  },
});

export default AddToCollectionScreen;
