import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Platform, ViewStyle } from 'react-native';

// TODO milhamj
// const cardStyle: ViewStyle = {
//   flex: 1,
//   ...(Platform.OS === 'web' ? { height: '100vh' as any } : {}),
// };

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
        //   cardStyle: cardStyle,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="search" />
        <Stack.Screen name="movie/[id]" />
        <Stack.Screen name="collection/[id]" />
        <Stack.Screen name="add-to-collection" />
        <Stack.Screen name="login" />
      </Stack>
      <Toast />
    </>
  );
}