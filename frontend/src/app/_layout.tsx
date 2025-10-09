import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  return (
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
  );
}