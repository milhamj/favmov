import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { Icon } from 'react-native-elements';
import PageContainer from '../components/PageContainer';
import TopBar from '../components/TopBar';
import AppButton from '../components/AppButton';
import { FIELD_STYLES } from '../styles/fields';
import { COLORS } from '../styles/colors';
import { signInWithOtp, verifyOtp } from '../services/authService';
import Toast from 'react-native-toast-message';
import { Success } from '../model/apiResponse';
import { router } from '../navigation/router';

import { useLocalSearchParams } from 'expo-router';
import { safeReturnTo } from '../navigation/routes';

const TIMER_SECONDS = 300

const LoginPage = () => {
    const { return_to } = useLocalSearchParams();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isWaitingForOtp, setIsWaitingForOtp] = useState(false);
    const [canResend, setCanResend] = useState(false);
    const [timer, setTimer] = useState(TIMER_SECONDS);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

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
        setIsWaitingForOtp(false);
        setIsLoading(true);
        setTimer(TIMER_SECONDS);
        setCanResend(false);

        const doSignInWithOtp = async () => {
            const result = await signInWithOtp(email)
            if (result instanceof Success) {
            Toast.show({
                type: 'success',
                text1: 'Check your email',
                text2: 'We have sent you an OTP to your email.',
                position: 'bottom'
            });
            setIsLoading(false);
            setIsWaitingForOtp(true);
            } else {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: result.message,
                position: 'bottom'
            });
            setIsLoading(false);
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
            Toast.show({
                type: 'success',
                text1: 'Check your email',
                text2: 'We have sent you an OTP to your email.',
                position: 'bottom'
            });
            setIsLoading(false);
            setCanResend(false);
            setTimer(TIMER_SECONDS);
            } else {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: result.message,
                position: 'bottom'
            });
            setIsLoading(false);
            setCanResend(true);
            }
        }
        doSignInWithOtp();
        }
    };

    const handleVerifyOtp = () => {
        setIsLoading(true);

        const doVerifyOtp = async () => {
        const result = await verifyOtp(email, otp)
            if (result instanceof Success) {
                Toast.show({
                    type: 'success',
                    text1: 'Login success!',
                    text2: `Welcome ${email}`,
                    position: 'bottom'
                });
                setTimeout(() => {
                    setIsLoading(false);
                    if (return_to !== undefined) router.dismissTo(safeReturnTo(return_to));
                    else router.goBackSafely();
                }, 2000);
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: result.message,
                    position: 'bottom'
                });
                setIsLoading(false);
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
                    onClick: () => router.goBackSafely()
                }}
            />
            <View style={styles.container}>
                <View style={styles.loginBox}>
                    <View style={{height: 16}} />
                    <Text style={styles.title}>Welcome!</Text>

                    <View style={styles.inputContainer}>
                        <Icon name="email" size={20} color="gray" style={styles.inputIcon} />
                        <TextInput
                        style={[FIELD_STYLES.input, styles.input, (isWaitingForOtp || isLoading) && FIELD_STYLES.disabled]}
                        accessibilityLabel="Email"
                        placeholderTextColor={COLORS.secondaryText}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!isWaitingForOtp && !isLoading}
                        accessibilityState={{ disabled: isWaitingForOtp || isLoading }}
                        />
                        { isWaitingForOtp &&
                        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Change email" accessibilityState={{ disabled: isLoading }} disabled={isLoading} style={styles.inputAction} onPress={handleChangeEmail}>
                            <Text>Change</Text>
                        </TouchableOpacity>
                        }
                    </View>

                    { isWaitingForOtp && 
                        <View style={styles.inputContainer}>
                            <Icon name="lock" size={20} color="gray" style={styles.inputIcon} />
                            <TextInput
                            style={[FIELD_STYLES.input, styles.input, isLoading && FIELD_STYLES.disabled]}
                            accessibilityLabel="OTP"
                            placeholderTextColor={COLORS.secondaryText}
                            placeholder="Input your OTP here..."
                            value={otp}
                            onChangeText={setOtp}
                            editable={!isLoading}
                            accessibilityState={{ disabled: isLoading }}
                            />
                        </View>
                    }

                    {/* Resend OTP with Timer */}
                    {isWaitingForOtp && (
                    <TouchableOpacity 
                        onPress={handleResendOtp}
                        accessibilityRole="button"
                        accessibilityLabel="Resend OTP"
                        accessibilityState={{ disabled: !canResend || isLoading, busy: isLoading }}
                        disabled={!canResend || isLoading}
                        style={styles.resendContainer}
                    >
                        <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
                        Resend OTP {!canResend && timer > 0 && `(${formatTime(timer)})`}
                        </Text>
                    </TouchableOpacity>
                    )}

                    <View style={{height: 8}} />

                    <AppButton label={isWaitingForOtp ? 'LOGIN' : 'Send OTP'} onPress={isWaitingForOtp ? handleVerifyOtp : handleSendOtp} loading={isLoading} style={styles.loginButton} />

                    <View style={{height: 16}} />
                </View>
            </View>
            <Toast />
        </PageContainer>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.warmSurface,
  },
  loginBox: {
    width: '100%',
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
    ...FIELD_STYLES.surface,
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
  },
  inputAction: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    marginLeft: 8,
  },
  loginButton: { marginBottom: 20 },
  resendContainer: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  resendText: {
    color: COLORS.accentText,
    fontSize: 14,
  },
  resendTextDisabled: {
    color: 'gray',
  },
});

export default LoginPage;