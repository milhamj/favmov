import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import { SeoHead } from '../components/SeoHead';
import React from 'react';
import { getIconType } from 'react-native-elements';

const RootLayout = () => {
  // Ships @font-face in the prerendered HTML so icons hydrate as glyphs instead of mismatching.
  // Must run per render: expo-router resets its font list before rendering each page.
  if (typeof window === 'undefined') (getIconType('material') as any).loadFont();

  return (
    <>
      <SeoHead/>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="search" />
        <Stack.Screen name="movie/[id]" />
        <Stack.Screen name="collection/[id]" />
        <Stack.Screen name="collection/add" />
        <Stack.Screen name="login" />
        <Stack.Screen name="image" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
      </Stack>
      <Toast />
    </>
  );
}

export default RootLayout;