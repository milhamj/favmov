import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/navigationTypes';
import withAuth from '../components/withAuth';
import Toast from 'react-native-toast-message';
import PageContainer from '../components/PageContainer';
import TopBar from '../components/TopBar';


const Collection = withAuth(() => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  const collections = [
    { id: '1', name: 'Default Collection', movies: [] },
    // Add more collections as needed
  ];

  return (
    <PageContainer>
      <TopBar
        title= { 'Collection' }
      />
      <View style={styles.container}>
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <Text style={styles.collectionName}>{item.name}</Text>
              {/* Render movies in the collection */}
            </View>
          )}
        />
      </View>
      <Toast />
    </PageContainer>
  );
});

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
});

export default Collection;