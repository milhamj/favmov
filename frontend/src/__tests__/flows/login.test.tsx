import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import Toast from 'react-native-toast-message';
import LoginPage from '../../app/login';
import withAuth from '../../components/withAuth';
import { useAuth } from '../../hooks/useAuth';
import { Error as ApiError, Success } from '../../model/apiResponse';
import { signInWithOtp, verifyOtp } from '../../services/authService';
import { router } from '../../../test/expoRouter';

// The first render transforms React Native, which passes the 5s default on a cold cache
jest.setTimeout(30_000);

jest.mock('expo-router', () => require('../../../test/expoRouter'));
jest.mock('../../services/authService', () => ({ signInWithOtp: jest.fn(), verifyOtp: jest.fn() }));
jest.mock('../../hooks/useAuth', () => ({ useAuth: jest.fn() }));

const sendOtp = signInWithOtp as jest.Mock;
const checkOtp = verifyOtp as jest.Mock;

const requestCode = async () => {
  render(<LoginPage />);
  fireEvent.changeText(screen.getByPlaceholderText('Email'), 'a@b.c');
  fireEvent.press(screen.getByText('Send OTP'));
  await screen.findByPlaceholderText('Input your OTP here...');
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  sendOtp.mockResolvedValue(new Success({}));
  checkOtp.mockResolvedValue(new Success({}));
});
afterEach(() => jest.useRealTimers());

describe('login', () => {
  test('asks for the code once it is sent', async () => {
    await requestCode();
    expect(sendOtp).toHaveBeenCalledWith('a@b.c');
    expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'success', text1: 'Check your email' }));
    expect(screen.getByText(/Resend OTP.*5:00/)).toBeTruthy();
    expect(screen.queryByText('Send OTP')).toBeNull();
  });

  test('stays on the email step when sending fails', async () => {
    sendOtp.mockResolvedValue(new ApiError('Rate limited'));
    render(<LoginPage />);
    fireEvent.press(screen.getByText('Send OTP'));
    await waitFor(() => expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', text2: 'Rate limited' })));
    expect(screen.getByText('Send OTP')).toBeTruthy();
  });

  test('signs in, then leaves two seconds later', async () => {
    await requestCode();
    fireEvent.changeText(screen.getByPlaceholderText('Input your OTP here...'), '123456');
    fireEvent.press(screen.getByText('LOGIN'));
    await waitFor(() => expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ text1: 'Login success!', text2: 'Welcome a@b.c' })));
    expect(checkOtp).toHaveBeenCalledWith('a@b.c', '123456');
    expect(router.back).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(2000); });
    expect(router.back).toHaveBeenCalled();
  });

  test('lets the user retry a wrong code', async () => {
    checkOtp.mockResolvedValue(new ApiError('Token has expired or is invalid'));
    await requestCode();
    fireEvent.press(screen.getByText('LOGIN'));
    await waitFor(() => expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', text2: 'Token has expired or is invalid' })));
    expect(await screen.findByText('LOGIN')).toBeTruthy();
    expect(router.back).not.toHaveBeenCalled();
  });

  test('Change returns to the email step', async () => {
    await requestCode();
    fireEvent.press(screen.getByText('Change'));
    expect(screen.getByText('Send OTP')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Input your OTP here...')).toBeNull();
  });

  test('allows a resend only after the five minute countdown', async () => {
    await requestCode();
    fireEvent.press(screen.getByText(/Resend OTP/));
    expect(sendOtp).toHaveBeenCalledTimes(1);

    for (let second = 0; second < 300; second++) act(() => { jest.advanceTimersByTime(1000); });
    fireEvent.press(screen.getByText(/Resend OTP/));
    await waitFor(() => expect(sendOtp).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/Resend OTP.*5:00/)).toBeTruthy();
  });

  test('KNOWN ISSUE: an empty email is still sent to Supabase', async () => {
    render(<LoginPage />);
    fireEvent.press(screen.getByText('Send OTP'));
    await screen.findByPlaceholderText('Input your OTP here...');
    expect(sendOtp).toHaveBeenCalledWith('');
  });
});

describe('withAuth', () => {
  const Protected = withAuth(() => <Text>Secret</Text>);
  const authState = (state: object) => (useAuth as jest.Mock).mockReturnValue(state);

  test('waits for the session without showing the page', () => {
    authState({ loading: true, isAuthenticated: false });
    render(<Protected />);
    expect(screen.queryByText('Secret')).toBeNull();
    expect(router.replace).not.toHaveBeenCalled();
  });

  test('sends guests to login', () => {
    authState({ loading: false, isAuthenticated: false });
    render(<Protected />);
    expect(screen.queryByText('Secret')).toBeNull();
    expect(router.replace).toHaveBeenCalledWith('/login');
  });

  test('shows the page to signed-in users', () => {
    authState({ loading: false, isAuthenticated: true });
    render(<Protected />);
    expect(screen.getByText('Secret')).toBeTruthy();
  });
});
