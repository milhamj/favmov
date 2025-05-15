import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const Collection = () => {
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