import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import { SeoHead } from '../components/SeoHead';
import React from 'react';

const RootLayout = () => {
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
      </Stack>
      <Toast />
    </>
  );
}

export default RootLayout;