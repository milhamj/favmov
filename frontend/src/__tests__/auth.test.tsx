import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import withAuth from '@/features/auth/withAuth';
import Login from '@/app/login';
import { router } from '@/navigation/router';
import { verifyOtp } from '@/features/auth/authService';
import { ApiError } from '@/lib/apiError';
let mockFocused = true;
let mockPathname = '/collection/add';
jest.mock('expo-router/react-navigation', () => ({ useIsFocused: () => mockFocused }));
let mockParams: any = { movie_id: '7', is_tv_show: 'true' };
let mockAuth = { isAuthenticated: false, loading: false };
jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/features/auth/useAuth', () => ({ useAuth: () => mockAuth }));
jest.mock('@/navigation/router', () => ({
  router: { replace: jest.fn(), dismissTo: jest.fn(), goBackSafely: jest.fn() },
}));
jest.mock('@/features/auth/authService', () => ({
  signInWithOtp: jest.fn(() => Promise.resolve(true)),
  verifyOtp: jest.fn(),
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockFocused = true;
  mockPathname = '/collection/add';
  jest.useFakeTimers();
  mockAuth = { isAuthenticated: false, loading: false };
});
afterEach(() => jest.useRealTimers());
test('auth wrapper preserves editor query and waits for auth loading', () => {
  mockParams = { movie_id: '7', is_tv_show: 'true' };
  mockAuth.loading = true;
  const Protected = withAuth(() => null);
  const ui = render(<Protected />);
  expect(router.replace).not.toHaveBeenCalled();
  mockAuth.loading = false;
  ui.rerender(<Protected />);
  expect(router.replace).toHaveBeenCalledWith(
    '/login?return_to=' + encodeURIComponent('/collection/add?movie_id=7&is_tv_show=true'),
  );
});
test.each([true, false])(
  'OTP success=%s returns to the requested route only on success',
  async (succeeds) => {
    mockParams = { return_to: '/collection/add?movie_id=7&is_tv_show=true' };
    (verifyOtp as jest.Mock).mockImplementation(() =>
      succeeds ? Promise.resolve(true) : Promise.reject(new ApiError('invalid')),
    );
    const ui = render(<Login />);
    fireEvent.changeText(ui.getByPlaceholderText('Email'), 'person@example.test');
    await act(async () => {
      fireEvent.press(ui.getByText('Send OTP'));
    });
    fireEvent.changeText(ui.getByPlaceholderText('Input your OTP here...'), '123456');
    await act(async () => {
      fireEvent.press(ui.getByText('LOGIN'));
    });
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    if (succeeds) expect(router.dismissTo).toHaveBeenCalledWith(mockParams.return_to);
    else expect(router.dismissTo).not.toHaveBeenCalled();
  },
);

test('an unfocused protected screen cannot overwrite the focused login destination', () => {
  mockParams = { movie_id: '7', is_tv_show: 'true' };
  const Protected = withAuth(() => null);
  const ui = render(<Protected />);
  expect(router.replace).toHaveBeenCalledTimes(1);
  mockFocused = false;
  mockPathname = '/login';
  mockParams = {};
  ui.rerender(<Protected />);
  expect(router.replace).toHaveBeenCalledTimes(1);
  expect(router.replace).toHaveBeenLastCalledWith(
    '/login?return_to=' + encodeURIComponent('/collection/add?movie_id=7&is_tv_show=true'),
  );
});
