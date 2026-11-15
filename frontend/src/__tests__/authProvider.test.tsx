import { act, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { checkAuthStatus, subscribeToAuthChanges } from '@/features/auth/authService';
import { useAuth } from '@/features/auth/useAuth';

jest.mock('@/features/auth/authService', () => ({
  checkAuthStatus: jest.fn(),
  subscribeToAuthChanges: jest.fn(),
}));

const Probe = () => {
  const { user, loading } = useAuth();
  return <Text>{loading ? 'loading' : (user?.id ?? 'guest')}</Text>;
};

test('a newer auth event wins over a slower initial session lookup', async () => {
  let resolveInitial = (_: unknown) => {};
  (checkAuthStatus as jest.Mock).mockReturnValue(
    new Promise((resolve) => {
      resolveInitial = resolve;
    }),
  );
  let emit = (_: unknown) => {};
  (subscribeToAuthChanges as jest.Mock).mockImplementation((callback) => {
    emit = callback;
    return { data: { subscription: { unsubscribe: jest.fn() } } };
  });

  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  await act(async () => emit({ user: { id: 'new' } }));
  await act(async () => resolveInitial({ session: null, user: null }));

  expect(screen.getByText('new')).toBeTruthy();
});
