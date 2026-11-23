import AppButton from '@/components/AppButton';
import EmptyState from '@/components/EmptyState';
import FullPageLoader from '@/components/FullPageLoader';
import PageContainer from '@/components/PageContainer';
import RetryButton from '@/components/RetryButton';
import TopBar from '@/components/TopBar';
import CollectionCard from '@/features/collections/CollectionCard';
import CreateCollectionSheet from '@/features/collections/CreateCollectionSheet';
import { Collection as CollectionModel } from '@/features/collections/collectionModel';
import { useCollections } from '@/features/collections/collectionQueries';
import { useGridLayout } from '@/hooks/useGridLayout';
import { linkProps } from '@/navigation/linkProps';
import { routes } from '@/navigation/routes';
import { SPACING } from '@/theme/colors';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

const CollectionsScreen = () => {
  const { numColumns, itemWidth, onContentSizeChange } = useGridLayout(200);
  const { data, isPending: isLoading, error: failure, refetch } = useCollections();
  const collections = data ?? [];
  const error = data === undefined ? failure?.message : '';
  const [isCreateSheetVisible, setIsCreateSheetVisible] = useState(false);
  useEffect(() => {
    if (failure)
      Toast.show({ type: 'error', text1: 'Error', text2: failure.message, position: 'bottom' });
  }, [failure]);

  const handleCreateCollection = () => {
    setIsCreateSheetVisible(true);
  };

  const handleSaveCollection = (isSuccess: boolean, collectionName?: string) => {
    if (isSuccess && collectionName) {
      Toast.show({
        type: 'success',
        text1: 'Collection Created',
        text2: `"${collectionName}" has been created successfully`,
        position: 'bottom',
      });
    }

    setIsCreateSheetVisible(false);
  };

  const renderItem = ({ item }: { item: CollectionModel }) => (
    <View style={{ width: itemWidth }}>
      <CollectionCard collection={item} link={linkProps(routes.collection(item.id))} />
    </View>
  );

  return (
    <PageContainer
      topBar={
        <TopBar
          title={'Collections'}
          icons={[
            { name: 'add-circle', label: 'Create Collection', onClick: handleCreateCollection },
          ]}
        />
      }
    >
      <View style={styles.container}>
        {isLoading ? (
          <FullPageLoader />
        ) : error ? (
          <RetryButton message={error} onPress={() => void refetch()} />
        ) : collections.length === 0 ? (
          <EmptyState
            title="You don't have any collections yet."
            description="Create a collection to organize your favorite movies."
            illustration={require('../../../assets/images/empty_search.png')}
          >
            <AppButton
              label="Create Collection"
              style={styles.createButton}
              onPress={handleCreateCollection}
            />
          </EmptyState>
        ) : (
          <FlatList
            key={numColumns}
            onContentSizeChange={onContentSizeChange}
            extraData={itemWidth}
            data={collections}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
          />
        )}
      </View>

      <CreateCollectionSheet visible={isCreateSheetVisible} onClose={handleSaveCollection} />

      <Toast />
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.medium,
  },
  listContent: {
    paddingVertical: SPACING.medium,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    gap: SPACING.medium,
    marginBottom: SPACING.medium,
  },
  createButton: { width: '80%', marginTop: SPACING.medium },
});

export default CollectionsScreen;
