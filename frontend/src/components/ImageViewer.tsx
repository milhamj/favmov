import React, { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { router } from '../navigation/router';
import { routes } from '../navigation/routes';

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
  const [isBigImageLoaded, setIsBigImageLoaded] = useState(false);

  return (
      <View style={style}>
        <TouchableOpacity 
          accessibilityRole="button"
          accessibilityLabel="View full image"
          onPress={() => router.navigate(routes.image(bigImageUrl || smallImageUrl))}
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