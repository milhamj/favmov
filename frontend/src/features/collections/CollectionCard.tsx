import { linkKeyboardProps } from '@/navigation/linkKeyboardProps';
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/theme/colors';
import { Collection } from './collectionModel';

const PASTELS = [
  COLORS.collectionRose,
  COLORS.collectionGreen,
  COLORS.collectionBlue,
  COLORS.collectionYellow,
  COLORS.collectionPurple,
  COLORS.collectionTeal,
];

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
    <Pressable
      {...linkKeyboardProps}
      accessibilityRole="link"
      style={({ pressed }) => [[styles.card, { backgroundColor }], pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <Text style={styles.cardText}>
        {collection.name}
        {collection.moviesCount != null ? (
          <Text style={styles.cardSubText}> ({collection.moviesCount})</Text>
        ) : null}
      </Text>
    </Pressable>
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
    shadowColor: COLORS.shadow,
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
    color: COLORS.collectionCount,
  },
});

export default CollectionCard;
