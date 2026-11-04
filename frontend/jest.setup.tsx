jest.mock('./src/services/tmdbClient', () => ({ TMDB_IMAGE_BIG: 'big/', TMDB_IMAGE_SMALL: 'small/' }));
jest.mock('react-native-toast-message', () => ({ __esModule: true, default: Object.assign(() => null, { show: jest.fn() }) }));
jest.mock('react-native-elements', () => ({ Icon: ({ onPress, name }: any) => { const { Text } = require('react-native'); return <Text onPress={onPress}>{name}</Text>; } }));
