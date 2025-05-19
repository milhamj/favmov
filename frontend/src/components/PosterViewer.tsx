import React, { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import FullImageViewer from './FullImageViewer';

interface PosterViewerProps {
  bigPosterUrl: string;
  smallPosterUrl: string;
}

const PosterViewer: React.FC<PosterViewerProps> = ({ bigPosterUrl, smallPosterUrl }) => {
  const [isImageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [isBigImageLoaded, setIsBigImageLoaded] = useState(false);

  const handleImagePress = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageViewerVisible(true);
  };

  return (
    <>
      <FullImageViewer
        visible={isImageViewerVisible}
        imageUrl={selectedImageUrl}
        onClose={() => setImageViewerVisible(false)}
      />
      <TouchableOpacity onPress={() => handleImagePress(bigPosterUrl)}>
        <View style={styles.posterContainer}>
          {!isBigImageLoaded && <Image source={{ uri: smallPosterUrl }} style={styles.poster} />}
          <Image
            source={{ uri: bigPosterUrl }}
            style={[styles.poster, !isBigImageLoaded ? styles.posterBig : null]}
            onLoadEnd={() => setIsBigImageLoaded(true)}
          />
        </View>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  posterContainer: {
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: 300,
  },
  posterBig: {
    position: 'absolute',
    zIndex: 1,
  },
});

export default PosterViewer;