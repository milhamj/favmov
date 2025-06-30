import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/navigationTypes';
import withAuth from '../components/withAuth';
import Toast from 'react-native-toast-message';
import PageContainer from '../components/PageContainer';
import TopBar from '../components/TopBar';
import { COLORS } from '../styles/colors';
import CreateCollectionSheet from '../components/CreateCollectionSheet';
import { Collection as CollectionModel } from '../model/collectionModel';
import { getUserCollections } from '../services/collectionService';
import CollectionCard from '../components/CollectionCard';

const numColumns = 2;

const Collection = withAuth(() => {
  const [collections, setCollections] = useState<CollectionModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateSheetVisible, setIsCreateSheetVisible] = useState(false);
  
  const fetchCollections = async () => {
    setIsLoading(true);
    const result = await getUserCollections();
    if ('data' in result) {
      setCollections(result.data);
    } else {
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
    // Navigate to collection detail screen
    // This is a placeholder - implement navigation as needed
    console.log('Navigate to collection:', collection.id);
    Toast.show({
      type: 'success',
      text1: 'TODO',
      text2: `[WIP] Going to collection detail!`,
      position: 'bottom'
    });
    // navigation.navigate('CollectionDetail', { collectionId: collection.id });
  };

  const renderItem = ({ item }: { item: CollectionModel }) => (
    <CollectionCard 
      collection={item} 
      onPress={() => handleCollectionPress(item)} 
    />
  );

  return (
    <PageContainer>
      <TopBar
        title={'Collections'}
        icons={[
          { name: 'add-circle', onClick: handleCreateCollection }
        ]}
      />
      <View style={styles.container}>
        { isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="tomato" />
          </View>
        ) : collections.length === 0 ? (
          <View style={styles.emptyState}>
            <Image 
              source={require('../../assets/empty_search.png')} 
              style={styles.emptyImage} 
            />
            <Text style={styles.emptyText}>
              You don't have any collections yet.
            </Text>
            <Text style={styles.emptySubText}>
              Create a collection to organize your favorite movies.
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreateCollection}
            >
              <Text style={styles.createButtonText}>Create Collection</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={collections}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 16,
    color: COLORS.text_gray,
    textAlign: 'center',
    marginBottom: 32,
  },
  createButton: {
    backgroundColor: 'tomato',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Collection;