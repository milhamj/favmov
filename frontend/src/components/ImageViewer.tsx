import React, { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import FullImageViewer from './FullImageViewer';

interface ImageViewerProps {
  smallImageUrl: string;
  bigImageUrl?: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: ImageStyle;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ 
  smallImageUrl,
  bigImageUrl, 
  style, 
  imageStyle 
}) => {
  const [isImageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [isBigImageLoaded, setIsBigImageLoaded] = useState(false);

  const handleImagePress = () => {
    const imageUrl = bigImageUrl || smallImageUrl;
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
          onPress={() => handleImagePress()} 
          style={styles.imageContainer}>
          {
            !isBigImageLoaded ? (
              <Image source={{ uri: smallImageUrl }} style={[styles.image, imageStyle]} />
            ) : null
          }
          { 
            bigImageUrl ? (
              <Image
                source={{ uri: bigImageUrl }}
                style={[styles.image, !isBigImageLoaded ? styles.imageBig : null]}
                onLoadEnd={() => setIsBigImageLoaded(true)}
              />
            ) : null
          }
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageBig: {
    position: 'absolute',
    zIndex: 1,
  },
});

export default ImageViewer;