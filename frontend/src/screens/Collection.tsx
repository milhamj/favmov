import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/navigationTypes';
import withAuth from '../components/withAuth';
import Toast from 'react-native-toast-message';
import PageContainer from '../components/PageContainer';
import TopBar from '../components/TopBar';
import { COLORS } from '../styles/colors';
import CreateCollectionSheet from '../components/CreateCollectionSheet';

const Collection = withAuth(() => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [collections, setCollections] = useState([]);
  const [isCreateSheetVisible, setIsCreateSheetVisible] = useState(false);
  
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
    }
    
    setIsCreateSheetVisible(false);
  };

  return (
    <PageContainer>
      <TopBar
        title={'Collections'}
      />
      <View style={styles.container}>
        {collections.length === 0 ? (
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
          null
          // <FlatList
          //   data={collections}
          //   keyExtractor={(item) => item.id}
          //   renderItem={({ item }) => (
          //     <View>
          //       <Text style={styles.collectionName}>{item.name}</Text>
          //       {/* Render movies in the collection */}
          //     </View>
          //   )}
          // />
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

// Keep the existing styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  collectionName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
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