import { signInWithOtp, verifyOtp } from '@/features/auth/authService';
import { router } from '@/navigation/router';
import { useEffect, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';

import { safeReturnTo } from '@/navigation/routes';
import { useLocalSearchParams } from 'expo-router';

const TIMER_SECONDS = 300;

export function useLoginOtp(return_to: ReturnType<typeof useLocalSearchParams>['return_to']) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingForOtp, setIsWaitingForOtp] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [timer, setTimer] = useState(TIMER_SECONDS);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (isWaitingForOtp && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
        if (timer === 1) setCanResend(true);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isWaitingForOtp, timer]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleChangeEmail = () => {
    setIsWaitingForOtp(false);

    setTimer(TIMER_SECONDS);
    setCanResend(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleSendOtp = () => {
    const trimmedEmail = email.trim();
    setEmail(trimmedEmail);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailError('');
    setIsWaitingForOtp(false);
    setIsLoading(true);
    setTimer(TIMER_SECONDS);
    setCanResend(false);

    const doSignInWithOtp = async () => {
      try {
        await signInWithOtp(trimmedEmail);
        Toast.show({
          type: 'success',
          text1: 'Check your email',
          text2: 'We have sent you an OTP to your email.',
          position: 'bottom',
        });
        setIsLoading(false);
        setIsWaitingForOtp(true);
      } catch (result: unknown) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result instanceof globalThis.Error ? result.message : '',
          position: 'bottom',
        });
        setIsLoading(false);
      }
    };
    doSignInWithOtp();
  };

  const handleResendOtp = () => {
    if (canResend) {
      setIsLoading(true);
      setCanResend(false);
      setIsWaitingForOtp(true);

      const doSignInWithOtp = async () => {
        try {
          await signInWithOtp(email);
          Toast.show({
            type: 'success',
            text1: 'Check your email',
            text2: 'We have sent you an OTP to your email.',
            position: 'bottom',
          });
          setIsLoading(false);
          setCanResend(false);
          setTimer(TIMER_SECONDS);
        } catch (result: unknown) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: result instanceof globalThis.Error ? result.message : '',
            position: 'bottom',
          });
          setIsLoading(false);
          setCanResend(true);
        }
      };
      doSignInWithOtp();
    }
  };

  const handleVerifyOtp = () => {
    setIsLoading(true);

    const doVerifyOtp = async () => {
      try {
        await verifyOtp(email, otp.trim());
        Toast.show({
          type: 'success',
          text1: 'Login success!',
          text2: `Welcome ${email}`,
          position: 'bottom',
        });
        leaveTimer.current = setTimeout(() => {
          setIsLoading(false);
          if (return_to !== undefined) router.dismissTo(safeReturnTo(return_to));
          else router.goBackSafely();
        }, 2000);
      } catch (result: unknown) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result instanceof globalThis.Error ? result.message : '',
          position: 'bottom',
        });
        setIsLoading(false);
      }
    };

    doVerifyOtp();
  };

  return {
    email,
    emailError,
    setEmail,
    otp,
    setOtp,
    isLoading,
    isWaitingForOtp,
    canResend,
    timer,
    formatTime,
    handleChangeEmail,
    handleSendOtp,
    handleResendOtp,
    handleVerifyOtp,
  };
}
