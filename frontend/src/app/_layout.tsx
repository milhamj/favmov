import { Stack, useSegments } from 'expo-router';
import Toast from 'react-native-toast-message';
import { SeoHead } from '@/components/SeoHead';
import React, { useEffect, useState } from 'react';
import { onlineManager, QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/queryClient';
import { useHydrated } from '@/lib/useHydrated';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';

// Requests must wait until prerendered Suspense boundaries finish hydrating.
onlineManager.setOnline(false);

const AppFonts = () => {
  useFonts(MaterialIcons.font);
  return null;
};

const RootLayout = () => {
  const [queryClient] = useState(createQueryClient);
  const hydrated = useHydrated();
  useEffect(() => {
    if (hydrated) onlineManager.setOnline(true);
  }, [hydrated]);
  const isNotFound = useSegments().includes('+not-found');

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppFonts />
        <SeoHead
          title={isNotFound ? 'Page not found | FavMov' : undefined}
          description={isNotFound ? "This page doesn't exist or may have moved." : undefined}
        />
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
          <Stack.Screen
            name="image"
            options={{ presentation: 'fullScreenModal', animation: 'fade' }}
          />
        </Stack>
        <Toast />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default RootLayout;

export { default as ErrorBoundary } from '@/components/RootErrorBoundary';
