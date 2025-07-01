import React, { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import FullImageViewer from './FullImageViewer';

interface PosterViewerProps {
  bigImageUrl: string;
  smallImageUrl: string;
  style?: StyleProp<ViewStyle>;
}

const PosterViewer: React.FC<PosterViewerProps> = ({ bigImageUrl: bigPosterUrl, smallImageUrl: smallPosterUrl, style }) => {
  const [isImageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [isBigImageLoaded, setIsBigImageLoaded] = useState(false);

  const handleImagePress = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageViewerVisible(true);
  };

  return (
    <>
      <View style={style}>
        <FullImageViewer
          visible={isImageViewerVisible}
          imageUrl={selectedImageUrl}
          onClose={() => setImageViewerVisible(false)}
        />
        <TouchableOpacity 
          onPress={() => handleImagePress(bigPosterUrl)} 
          style={styles.posterContainer}>
          {!isBigImageLoaded && <Image source={{ uri: smallPosterUrl }} style={styles.poster} />}
            <Image
              source={{ uri: bigPosterUrl }}
              style={[styles.poster, !isBigImageLoaded ? styles.posterBig : null]}
              onLoadEnd={() => setIsBigImageLoaded(true)}
            />
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  posterContainer: {
    height: '100%',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterBig: {
    position: 'absolute',
    zIndex: 1,
  },
});

export default PosterViewer;