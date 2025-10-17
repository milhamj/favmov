import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import { SeoHead } from '../components/SeoHead';
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { ActivityIndicator } from 'react-native';

const RootLayout = () => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  if (!ready) return <ActivityIndicator style={{ flex: 1 }} size="large" color="tomato"/>

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