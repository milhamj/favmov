import { linkKeyboardProps } from '@/navigation/linkKeyboardProps';
import React, { useState } from 'react';
import { View, Image, StyleSheet, Pressable, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { router } from '@/navigation/router';
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
        {...linkKeyboardProps}
        accessibilityRole="link"
        accessibilityLabel={accessibilityLabel}
        onPress={() =>
          router.navigate(routes.image(fullImageUrl || bigImageUrl || smallImageUrl, smallImageUrl))
        }
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
