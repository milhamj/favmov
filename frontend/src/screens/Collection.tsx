import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/navigationTypes';


const Collection = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Home'>>();

  if (loading) return <ActivityIndicator />;
  if (!isAuthenticated) {
    navigation.navigate('Login');
    return <Text>Please log in to view your collections.</Text>;
  }

  // Placeholder data for collections
  const collections = [
    { id: '1', name: 'Default Collection', movies: [] },
    // Add more collections as needed
  ];

  return (
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
  );
};

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