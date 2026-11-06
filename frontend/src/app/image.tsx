import React, { useEffect, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Icon } from 'react-native-elements';
import ZoomImageViewer from 'react-native-image-zoom-viewer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { router } from '../navigation/router';
import { safeImageUrl } from '../navigation/routes';

export default function ImagePage() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const viewport = useWindowDimensions();
  const [image, setImage] = useState<{ url: string; width: number; height: number } | null>();
  const fitScale = image ? Math.min(viewport.width / image.width, viewport.height / image.height) : 1;
  const closing = useRef(false);
  const closeButton = useRef<React.ElementRef<typeof TouchableOpacity>>(null);

  // The screen outlives its pop during the transition, so a repeat close would pop the page underneath.
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    router.goBackSafely();
  };

  useEffect(() => {
    const original = safeImageUrl(params.url);
    const preview = safeImageUrl(params.preview);
    setImage(original ? undefined : null);
    if (!original) return;

    let current = true;
    let originalShown = false;
    const showImage = (url: string) => {
      Image.getSize(url, (width, height) => {
        if (!current || (originalShown && url !== original) || width <= 0 || height <= 0) return;
        if (url === original) originalShown = true;
        setImage({ url, width, height });
      }, () => {}); // Keep the preview if the original cannot be measured.
    };
    showImage(preview || original);
    if (preview && preview !== original) {
      void Image.prefetch(original).then(loaded => {
        // Web resolves with undefined on success; native resolves with true.
        if (current && loaded !== false) showImage(original);
      }).catch(() => {}); // Keep the preview when the original cannot load.
    }
    return () => { current = false; };
  }, [params.url, params.preview]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    // shortcut: focus is not returned to the thumbnail on close, add it if thumbnails move down the tab order.
    closeButton.current?.focus();
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keyup', onKeyUp);
    return () => document.removeEventListener('keyup', onKeyUp);
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        ref={closeButton}
        style={[styles.closeButton, { top: insets.top + 20 }]}
        accessibilityRole="button"
        accessibilityLabel="Close image"
        onPress={close}>
        <Icon name="close" size={24} color="#fff" />
      </TouchableOpacity>
      {image ? (
        <ZoomImageViewer
          key={`${params.url}:${params.preview}:${viewport.width}:${viewport.height}`} // Keep zoom and opacity when only resolution changes.
          imageUrls={[{ url: image.url, width: image.width * fitScale, height: image.height * fitScale }]}
          enableSwipeDown={true}
          saveToLocalByLongPress={false}
          onSwipeDown={close}
        />
      ) : image === null ? (
        <Text style={styles.unavailable}>Image unavailable</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  closeButton: { position: 'absolute', left: 20, zIndex: 10, padding: 10 },
  unavailable: { color: '#fff', textAlign: 'center', margin: 'auto' },
});
