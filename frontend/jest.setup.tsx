process.env.EXPO_PUBLIC_TMDB_TOKEN = 'tmdb-key';
process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3080/api';
// Expo installs fetch as a lazy getter that loads a native module. Jest reads every global at
// teardown, after the console closes, and that late load warning makes Jest exit 1. Tests mock
// their network layers, so a plain failing fetch replaces it.
Object.defineProperty(globalThis, 'fetch', {
  configurable: true,
  writable: true,
  value: () => Promise.reject(new Error('fetch is not available in tests')),
});

jest.mock('@/lib/tmdbClient', () => ({
  TMDB_IMAGE_BIG: 'big/',
  TMDB_IMAGE_SMALL: 'small/',
}));
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: Object.assign(() => null, { show: jest.fn() }),
}));
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: Object.assign(
    ({ onPress, name }: any) => {
      const { Text } = require('react-native');
      return <Text onPress={onPress}>{name}</Text>;
    },
    { font: {} },
  ),
}));
