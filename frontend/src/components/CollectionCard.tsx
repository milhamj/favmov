import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { Collection } from '../model/collectionModel';

// Get screen width to calculate card size
const { width } = Dimensions.get('window');
const numColumns = 2;
const cardSize = (width - 48) / numColumns; // 48 = padding (16) * 3 (left, right, and middle gap)

// Function to generate random pastel colors
const getRandomPastelColor = () => {
  // Generate lighter pastel colors
  const r = Math.floor(Math.random() * 55) + 200; // 200-255
  const g = Math.floor(Math.random() * 55) + 200; // 200-255
  const b = Math.floor(Math.random() * 55) + 200; // 200-255
  
  // Add some tint to make it more interesting
  const tints = [
    { r: 0, g: -30, b: -30 }, // reddish
    { r: -30, g: 0, b: -30 }, // greenish
    { r: -30, g: -30, b: 0 }, // bluish
    { r: -15, g: -15, b: 0 }, // yellowish
    { r: 0, g: -15, b: -15 }, // purplish
    { r: -15, g: 0, b: -15 }  // tealish
  ];
  
  const tint = tints[Math.floor(Math.random() * tints.length)];
  
  return `rgb(${Math.max(150, r + tint.r)}, ${Math.max(150, g + tint.g)}, ${Math.max(150, b + tint.b)})`;
};

interface CollectionCardProps {
  collection: Collection;
  onPress: () => void;
}

const CollectionCard = ({ collection, onPress }: CollectionCardProps) => {
  // Generate a random color when the component mounts
  const [backgroundColor] = useState(getRandomPastelColor());
  
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
    width: cardSize,
    height: cardSize,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  cardSubText: {
    fontWeight: '400',
    color: '#222',
  },
});

export default CollectionCard;