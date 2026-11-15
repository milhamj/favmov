import { act, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { useAuth } from '@/features/auth/useAuth';
import { checkAuthStatus, subscribeToAuthChanges } from '@/features/auth/authService';
import { renderWithProviders } from '../../../test/renderWithProviders';

jest.mock('@/features/auth/authService', () => ({
  checkAuthStatus: jest.fn(),
  subscribeToAuthChanges: jest.fn(),
}));

test('shares one session check and later auth changes between consumers', async () => {
  (checkAuthStatus as jest.Mock).mockResolvedValue({ session: null, user: null });
  const unsubscribe = jest.fn();
  (subscribeToAuthChanges as jest.Mock).mockReturnValue({
    data: { subscription: { unsubscribe } },
  });
  const Consumer = () => {
    const { loading, user } = useAuth();
    return <Text>{loading ? 'loading' : (user?.id ?? 'signed out')}</Text>;
  };
  const ui = renderWithProviders(
    <>
      <Consumer />
      <Consumer />
    </>,
  );
  expect(ui.getAllByText('loading')).toHaveLength(2);
  await waitFor(() => expect(ui.getAllByText('signed out')).toHaveLength(2));
  expect(checkAuthStatus).toHaveBeenCalledTimes(1);
  expect(subscribeToAuthChanges).toHaveBeenCalledTimes(1);

  const notify = (subscribeToAuthChanges as jest.Mock).mock.calls[0][0];
  act(() => notify({ user: { id: 'u1' } } as Session));
  expect(ui.getAllByText('u1')).toHaveLength(2);

  ui.unmount();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});
