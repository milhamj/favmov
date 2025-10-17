import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import { SeoHead } from '../components/SeoHead';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

const RootLayout = () => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  return (
    <>
      <SeoHead/>
      { ready ? 
        <>
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
        : <ActivityIndicator size="large" color="tomato" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />
      }
    </>
  );
}

export default RootLayout;