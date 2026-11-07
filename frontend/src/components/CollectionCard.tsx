import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../styles/colors';
import { Collection } from '../model/collectionModel';

const PASTELS = ['#F2C8C8', '#C8E6C9', '#CCD9F2', '#F2E4BB', '#E4CCE9', '#C4E5DF'];

const collectionColor = (id: string) => {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return PASTELS[hash % PASTELS.length];
};

interface CollectionCardProps {
  collection: Collection;
  onPress: () => void;
}

const CollectionCard = ({ collection, onPress }: CollectionCardProps) => {
  const backgroundColor = collectionColor(collection.id);
  
  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
        <Text style={styles.cardText}>{collection.name}
        { collection.moviesCount 
            && <Text style={styles.cardSubText}> ({collection.moviesCount})</Text> 
        }
        </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  cardSubText: {
    fontWeight: '400',
    color: '#222',
  },
});

export default CollectionCard;