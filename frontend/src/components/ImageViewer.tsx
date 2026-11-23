import { linkProps } from '@/navigation/linkProps';
import React, { useState } from 'react';
import { View, Image, StyleSheet, Pressable, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { routes } from '@/navigation/routes';

interface ImageViewerProps {
  smallImageUrl: string;
  bigImageUrl?: string;
  fullImageUrl?: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: ImageStyle;
  accessibilityLabel?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  smallImageUrl,
  bigImageUrl,
  fullImageUrl,
  style,
  imageStyle,
  accessibilityLabel = 'View full image',
}) => {
  const [loadedImageUrl, setLoadedImageUrl] = useState<string>();
  const isBigImageLoaded = !!bigImageUrl && loadedImageUrl === bigImageUrl;

  return (
    <View style={style}>
      <Pressable
        {...linkProps(routes.image(fullImageUrl || bigImageUrl || smallImageUrl, smallImageUrl))}
        accessibilityRole="link"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [styles.imageContainer, pressed && { opacity: 0.7 }]}
      >
        {!isBigImageLoaded ? (
          <Image
            aria-hidden
            importantForAccessibility="no"
            source={{ uri: smallImageUrl }}
            style={[styles.image, imageStyle]}
          />
        ) : null}
        {bigImageUrl ? (
          <Image
            aria-hidden
            importantForAccessibility="no"
            source={{ uri: bigImageUrl }}
            style={[styles.image, imageStyle, !isBigImageLoaded ? styles.imageBig : null]}
            onLoad={() => setLoadedImageUrl(bigImageUrl)}
          />
        ) : null}
      </Pressable>
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
