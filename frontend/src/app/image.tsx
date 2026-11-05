import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import ZoomImageViewer from 'react-native-image-zoom-viewer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { router } from '../navigation/router';
import { safeImageUrl } from '../navigation/routes';

export default function ImagePage() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [imageUrl, setImageUrl] = useState<string | null | undefined>(undefined);
  const closing = useRef(false);
  const closeButton = useRef<React.ElementRef<typeof TouchableOpacity>>(null);

  // The screen outlives its pop during the transition, so a repeat close would pop the page underneath.
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    router.goBackSafely();
  };

  useEffect(() => {
    setImageUrl(safeImageUrl(params.url));
  }, [params.url]);

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
      {imageUrl ? (
        <ZoomImageViewer
          key={imageUrl} // it only re-measures when `index` changes, so a new url needs a remount
          imageUrls={[{ url: imageUrl }]}
          enableSwipeDown={true}
          saveToLocalByLongPress={false}
          onSwipeDown={close}
        />
      ) : imageUrl === null ? (
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
