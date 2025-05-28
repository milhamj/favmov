import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Icon } from 'react-native-elements';
import PageContainer from '../components/PageContainer';
import TopBar from '../components/TopBar';
import { signInWithOtp, verifyOtp } from '../services/authService';
import Toast from 'react-native-toast-message';
import { Result, Success } from '../model/apiResponse';

const TIMER_SECONDS = 300

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingForOtp, setIsWaitingForOtp] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [timer, setTimer] = useState(TIMER_SECONDS);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navigation = useNavigation();

  // Timer effect for OTP resend countdown
  useEffect(() => {
    if (isWaitingForOtp && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isWaitingForOtp, timer]);

  // Format timer to MM:SS
  const formatTime = (seconds : number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleChangeEmail = () => {
    setIsWaitingForOtp(false);
    // Reset timer when changing email
    setTimer(TIMER_SECONDS);
    setCanResend(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }

  const handleSendOtp = () => {
    console.log('Login with:', { email });

    setIsWaitingForOtp(false);
    setIsLoading(true);
    setTimer(TIMER_SECONDS);
    setCanResend(false);

    const doSignInWithOtp = async () => {
        const result = await signInWithOtp(email)
        if (result instanceof Success) {
          setIsLoading(false);
          setIsWaitingForOtp(true);
          Toast.show({
              type: 'success',
              text1: 'Check your email',
              text2: 'We have sent you an OTP to your email.',
              position: 'bottom'
          });
        } else {
          setIsLoading(false);
          Toast.show({
              type: 'error',
              text1: 'Error',
              text2: result.message,
              position: 'bottom'
          });
        }
    }
    doSignInWithOtp();
  };

  const handleResendOtp = () => {
    if (canResend) {
      setIsLoading(true);
      setCanResend(false);
      setIsWaitingForOtp(true);

      const doSignInWithOtp = async () => {
        const result = await signInWithOtp(email)
        if (result instanceof Success) {
          setIsLoading(false);
          setCanResend(false);
          setTimer(TIMER_SECONDS);
          Toast.show({
              type: 'success',
              text1: 'Check your email',
              text2: 'We have sent you an OTP to your email.',
              position: 'bottom'
          });
        } else {
          setIsLoading(false);
          setCanResend(true);
          Toast.show({
              type: 'error',
              text1: 'Error',
              text2: result.message,
              position: 'bottom'
          });
        }
      }
      doSignInWithOtp();
    }
  };

  const handleVerifyOtp = () => {
    console.log('Verifying OTP:', { email, otp });

    setIsLoading(true);

    const doVerifyOtp = async () => {
      const result = await verifyOtp(email, otp)
        if (result instanceof Success) {
          setIsLoading(false);
          Toast.show({
              type: 'success',
              text1: 'Login success!',
              text2: `Welcome ${email}`,
              position: 'bottom'
          });
        } else {
          setIsLoading(false);
          Toast.show({
              type: 'error',
              text1: 'Error',
              text2: result.message,
              position: 'bottom'
          });
        }
    }

    doVerifyOtp();
  };

  return (
    <PageContainer>
        <TopBar
            title= { 'Login' }
            backButton={{
            isShow: true,
            onClick: () => navigation.goBack()
            }}
        />
        <View style={styles.container}>
            <View style={styles.loginBox}>
                <View style={{height: 16}} />
                <Text style={styles.title}>Welcome!</Text>

                <View style={styles.inputContainer}>
                    <Icon name="email" size={20} color="gray" style={styles.inputIcon} />
                    <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    aria-disabled={isWaitingForOtp || isLoading}
                    />
                    { isWaitingForOtp &&
                      <TouchableOpacity style={styles.inputAction} onPress={handleChangeEmail}>  
                        <Text>Change</Text>
                      </TouchableOpacity>
                    }
                </View>

                { isWaitingForOtp && 
                    <View style={styles.inputContainer}>
                        <Icon name="lock" size={20} color="gray" style={styles.inputIcon} />
                        <TextInput
                        style={styles.input}
                        placeholder="Input your OTP here..."
                        value={otp}
                        onChangeText={setOtp}
                        aria-disabled={isLoading}
                        />
                    </View>
                }

                {/* Resend OTP with Timer */}
                {isWaitingForOtp && (
                  <TouchableOpacity 
                    onPress={handleResendOtp}
                    disabled={!canResend}
                    style={styles.resendContainer}
                  >
                    <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
                      Resend OTP {!canResend && timer > 0 && `(${formatTime(timer)})`}
                    </Text>
                  </TouchableOpacity>
                )}

                <View style={{height: 8}} />

                { !isWaitingForOtp &&
                  <TouchableOpacity style={styles.loginButton} onPress={handleSendOtp} disabled={isLoading}>
                    {
                      isLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.loginButtonText}>Send OTP</Text>
                      )
                    }
                  </TouchableOpacity>
                }

                { isWaitingForOtp &&
                <TouchableOpacity style={styles.loginButton} onPress={handleVerifyOtp} disabled={isLoading}>
                    { isLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.loginButtonText}>LOGIN</Text>
                      )
                    }
                </TouchableOpacity>
                }

                <View style={{height: 16}} />
            </View>
        </View>
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(243, 143, 77, 0.1)',
  },
  loginBox: {
    width: Platform.OS === 'web' ? 400 : '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 45,
  },
  inputAction: {
    marginLeft: 8,
  },
  loginButton: {
    backgroundColor: 'tomato',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  resendText: {
    color: 'tomato',
    fontSize: 14,
  },
  resendTextDisabled: {
    color: 'gray',
  },
});

export default LoginPage;