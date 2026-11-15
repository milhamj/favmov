import { act, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { renderWithProviders } from '../../test/renderWithProviders';
import { useCollections } from '@/features/collections/collectionQueries';
import { useAuth } from '@/features/auth/useAuth';
import { getUserCollections } from '@/features/collections/collectionService';
import { Collection } from '@/features/collections/collectionModel';
import { collection as makeCollection } from '../../test/factories';

jest.mock('expo-router', () => require('../../test/expoRouter'));
jest.mock('expo-router/react-navigation', () => require('../../test/expoRouter'));
jest.mock('@/features/auth/AuthProvider', () => ({
  AuthProvider: ({ children }: any) => children,
}));
jest.mock('@/features/auth/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/collections/collectionService', () => ({ getUserCollections: jest.fn() }));

function List() {
  const { data } = useCollections();
  return <Text>{data?.map((collection) => collection.name).join(',')}</Text>;
}

test('signed-out queries stay paused and another user never sees the previous list', async () => {
  (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, user: { id: 'alice' } });
  (getUserCollections as jest.Mock).mockResolvedValue([makeCollection('a', 'Alice private')]);
  const ui = renderWithProviders(<List />);
  await screen.findByText('Alice private');
  (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false });
  ui.rerender(<List />);
  expect(screen.queryByText('Alice private')).toBeNull();
  expect(getUserCollections).toHaveBeenCalledTimes(1);
  (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, user: { id: 'bob' } });
  let finish!: (data: Collection[]) => void;
  (getUserCollections as jest.Mock).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  ui.rerender(<List />);
  expect(screen.queryByText('Alice private')).toBeNull();
  await waitFor(() => expect(getUserCollections).toHaveBeenCalledTimes(2));
  await act(async () => finish([makeCollection('b', 'Bob private')]));
  await screen.findByText('Bob private');
});
