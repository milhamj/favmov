import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useAuth } from '../../hooks/useAuth';
import { Error as ApiError, Success } from '../../model/apiResponse';
import { checkAuthStatus, signInWithOtp, verifyOtp } from '../../services/authService';
import backendClient from '../../services/backendClient';
import { supabase } from '../../services/supabaseClient';

jest.mock('../../services/supabaseClient', () => ({
  supabase: { auth: { getSession: jest.fn(), onAuthStateChange: jest.fn(), signInWithOtp: jest.fn(), verifyOtp: jest.fn() } },
}));

const auth = supabase.auth as jest.Mocked<typeof supabase.auth>;
const session = { access_token: 'token', user: { id: 'u1', email: 'a@b.c' } } as any;
const unsubscribe = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null } as any);
  auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } } as any);
});

describe('authService', () => {
  test('reads the current user from the session', async () => {
    auth.getSession.mockResolvedValue({ data: { session }, error: null } as any);
    expect(await checkAuthStatus()).toEqual({ session, user: session.user });
  });

  test('treats a session failure as signed out', async () => {
    auth.getSession.mockRejectedValue(new Error('storage down'));
    expect(await checkAuthStatus()).toEqual({ session: null, user: null });
  });

  test('creates the account on first sign-in', async () => {
    auth.signInWithOtp.mockResolvedValue({ data: {}, error: null } as any);
    expect(await signInWithOtp('a@b.c')).toBeInstanceOf(Success);
    expect(auth.signInWithOtp).toHaveBeenCalledWith({ email: 'a@b.c', options: { shouldCreateUser: true } });
  });

  test('verifies the code as an email OTP', async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: null } as any);
    expect(await verifyOtp('a@b.c', '123456')).toBeInstanceOf(Success);
    expect(auth.verifyOtp).toHaveBeenCalledWith({ email: 'a@b.c', token: '123456', type: 'email' });
  });

  test('passes on failures as results, returned or thrown', async () => {
    auth.signInWithOtp.mockResolvedValue({ data: {}, error: { message: 'Rate limited' } } as any);
    expect(await signInWithOtp('a@b.c')).toMatchObject({ message: 'Rate limited' });
    auth.verifyOtp.mockRejectedValue(new Error('Offline'));
    const result = await verifyOtp('a@b.c', '1');
    expect(result).toBeInstanceOf(ApiError);
    expect(result.message).toBe('Offline');
  });
});

describe('useAuth', () => {
  test('starts loading, then reports the session', async () => {
    auth.getSession.mockResolvedValue({ data: { session }, error: null } as any);
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({ isAuthenticated: true, user: session.user });
  });

  test('follows sign-in and sign-out, and unsubscribes on unmount', async () => {
    const { result, unmount } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);

    const notify = auth.onAuthStateChange.mock.calls[0][0] as (event: string, session: any) => void;
    act(() => notify('SIGNED_IN', session));
    expect(result.current.isAuthenticated).toBe(true);
    act(() => notify('SIGNED_OUT', null));
    expect(result.current.isAuthenticated).toBe(false);

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});

describe('backendClient', () => {
  // Runs the request through the real interceptor without sending anything
  const headersFor = async () => {
    let headers: any;
    await backendClient.get('/x', { adapter: async (config) => { headers = config.headers; return { data: {}, status: 200, statusText: 'OK', headers: {}, config }; } });
    return headers;
  };

  test('sends the session token', async () => {
    auth.getSession.mockResolvedValue({ data: { session } } as any);
    expect((await headersFor()).Authorization).toBe('Bearer token');
  });

  test('sends the request anonymously without a session, or when reading it fails', async () => {
    expect((await headersFor()).Authorization).toBeUndefined();
    auth.getSession.mockRejectedValue(new Error('storage down'));
    expect((await headersFor()).Authorization).toBeUndefined();
  });

});
