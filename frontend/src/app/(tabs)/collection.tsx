import { useGridLayout } from '../../hooks/useGridLayout';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import withAuth from '../../components/withAuth';
import PageContainer from '../../components/PageContainer';
import TopBar from '../../components/TopBar';
import AppButton from '../../components/AppButton';
import EmptyState from '../../components/EmptyState';
import RetryButton from '../../components/RetryButton';
import { SPACING } from '../../styles/colors';
import CreateCollectionSheet from '../../components/CreateCollectionSheet';
import { Collection as CollectionModel } from '../../model/collectionModel';
import { getUserCollections } from '../../services/collectionService';
import CollectionCard from '../../components/CollectionCard';
import { router } from '../../navigation/router';
import { routes } from '../../navigation/routes';
import { useFocusEffect } from 'expo-router';
import { CollectionStateStore } from '../../stores/collectionStateStore';
import FullPageLoader from '../../components/FullPageLoader';

const numColumns = 2;

const CollectionPage = withAuth(() => {
    const { itemWidth, onContentSizeChange } = useGridLayout();
    const [collections, setCollections] = useState<CollectionModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCreateSheetVisible, setIsCreateSheetVisible] = useState(false);
    const lastFetchedTimestamp = useRef<number | null>(null);
    
    const fetchCollections = async () => {
        setIsLoading(true);
        setError('');
        const result = await getUserCollections();
        if ('data' in result) {
          setCollections(result.data);
          lastFetchedTimestamp.current = Date.now();
        } else {
          setError(result.message);
          Toast.show({
              type: 'error',
              text1: 'Error',
              text2: result.message,
              position: 'bottom'
          });
        }
        setIsLoading(false);
    };
    
    useEffect(() => {
      fetchCollections();
    }, []);

    useFocusEffect(
      useCallback(() => {
        const collectionLastUpdated = CollectionStateStore.getLastUpdated();
        if (collectionLastUpdated 
          && lastFetchedTimestamp.current 
          && collectionLastUpdated > lastFetchedTimestamp.current) {
          fetchCollections();
        }
      }, [])
    )
    
    const handleCreateCollection = () => {
        setIsCreateSheetVisible(true);
    };

    const handleSaveCollection = (isSuccess: boolean, collectionName?: string) => {
        if (isSuccess && collectionName) {
          Toast.show({
              type: 'success',
              text1: 'Collection Created',
              text2: `"${collectionName}" has been created successfully`,
              position: 'bottom'
          });
          
          // Refresh collections
          fetchCollections();
        }
        
        setIsCreateSheetVisible(false);
    };

    const handleCollectionPress = (collection: CollectionModel) => {
        router.navigate(routes.collection(collection.id));
    };

    const renderItem = ({ item }: { item: CollectionModel }) => (
        <View style={{ width: itemWidth }}>
            <CollectionCard
                collection={item}
                onPress={() => handleCollectionPress(item)}
            />
        </View>
    );

    return (
        <PageContainer>
        <TopBar
            title={'Collections'}
            icons={[
            { name: 'add-circle', label: 'Create Collection', onClick: handleCreateCollection }
            ]}
        />
        <View style={styles.container}>
            { isLoading ? (
              <FullPageLoader />
            ) : error ? (
              <RetryButton message={error} onPress={() => void fetchCollections()} />
            ) : collections.length === 0 ? (
              <EmptyState title="You don't have any collections yet." description="Create a collection to organize your favorite movies." illustration={require('../../../assets/empty_search.png')}>
                <AppButton label="Create Collection" style={styles.createButton} onPress={handleCreateCollection} />
              </EmptyState>
            ) : (
            <FlatList
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
        
        <CreateCollectionSheet 
            visible={isCreateSheetVisible}
            onClose={handleSaveCollection}
        />
        
        <Toast />
        </PageContainer>
    );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingVertical: 16,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    gap: SPACING.medium,
    marginBottom: 16,
  },
    createButton: { width: '80%', marginTop: 16 },
});

export default CollectionPage;