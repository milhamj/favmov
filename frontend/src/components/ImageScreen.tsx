import { COLORS } from '@/theme/colors';
import FullPageLoader from './FullPageLoader';
import { useHydrated } from '@/lib/useHydrated';
import { router } from '@/navigation/router';
import { safeImageUrl } from '@/navigation/routes';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native';
import ZoomImageViewer from 'react-native-image-zoom-viewer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ImageScreen({
  params,
}: {
  params: ReturnType<typeof useLocalSearchParams>;
}) {
  const hydrated = useHydrated();
  const insets = useSafeAreaInsets();
  const viewport = useWindowDimensions();
  const [image, setImage] = useState<{ url: string; width: number; height: number } | null>();
  const [previousSource, setPreviousSource] = useState([params.url, params.preview]);
  if (previousSource[0] !== params.url || previousSource[1] !== params.preview) {
    setPreviousSource([params.url, params.preview]);
    setImage(safeImageUrl(params.url) ? undefined : null);
  }
  const displayedImage = safeImageUrl(params.url) ? image : hydrated ? null : undefined;
  const fitScale = image
    ? Math.min(viewport.width / image.width, viewport.height / image.height)
    : 1;
  const closing = useRef(false);
  const closeButton = useRef<React.ElementRef<typeof Pressable>>(null);

  // The screen outlives its pop during the transition, so a repeat close would pop the page underneath.
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    router.goBackSafely();
  };

  useEffect(() => {
    const original = safeImageUrl(params.url);
    const preview = safeImageUrl(params.preview);
    if (!original) return;

    let current = true;
    let originalShown = false;
    const showImage = (url: string) => {
      Image.getSize(
        url,
        (width, height) => {
          if (!current || (originalShown && url !== original) || width <= 0 || height <= 0) return;
          if (url === original) originalShown = true;
          setImage({ url, width, height });
        },
        () => {
          if (current) setImage((previous) => previous ?? null);
        },
      ); // Keep the preview if the original cannot be measured.
    };
    showImage(preview || original);
    if (preview && preview !== original) {
      void Image.prefetch(original)
        .then((loaded) => {
          // Web resolves with undefined on success; native resolves with true.
          if (current && loaded !== false) showImage(original);
        })
        .catch(() => {}); // Keep the preview when the original cannot load.
    }
    return () => {
      current = false;
    };
  }, [params.url, params.preview]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    // Closing does not return focus to the thumbnail.
    closeButton.current?.focus();
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keyup', onKeyUp);
    return () => document.removeEventListener('keyup', onKeyUp);
  }, []);

  return (
    <View style={styles.container}>
      <Pressable
        ref={closeButton}
        style={({ pressed }) => [
          [styles.closeButton, { top: insets.top + 20 }],
          pressed && { opacity: 0.7 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Close image"
        onPress={close}
      >
        <MaterialIcons
          aria-hidden
          importantForAccessibility="no"
          name="close"
          size={24}
          color={COLORS.onAccent}
        />
      </Pressable>
      {displayedImage ? (
        <ZoomImageViewer
          renderImage={(props) => <Image {...props} accessibilityLabel="Full-size image" />}
          key={`${params.url}:${params.preview}:${viewport.width}:${viewport.height}`} // Keep zoom and opacity when only resolution changes.
          imageUrls={[
            {
              url: displayedImage.url,
              width: displayedImage.width * fitScale,
              height: displayedImage.height * fitScale,
            },
          ]}
          enableSwipeDown={true}
          saveToLocalByLongPress={false}
          onSwipeDown={close}
        />
      ) : displayedImage === null ? (
        <Text style={styles.unavailable}>Image unavailable</Text>
      ) : (
        <FullPageLoader />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.imageBackdrop },
  closeButton: { position: 'absolute', left: 20, zIndex: 10, padding: 10 },
  unavailable: { color: COLORS.onAccent, textAlign: 'center', margin: 'auto' },
});
