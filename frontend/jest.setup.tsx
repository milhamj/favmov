process.env.EXPO_PUBLIC_TMDB_TOKEN = 'tmdb-key';
process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3080/api';

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
