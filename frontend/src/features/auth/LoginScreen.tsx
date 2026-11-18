import AppButton from '@/components/AppButton';
import PageContainer from '@/components/PageContainer';
import TopBar from '@/components/TopBar';
import { router } from '@/navigation/router';
import { LAYOUT, COLORS, SPACING } from '@/theme/colors';
import { FIELD_BORDER, FIELD_GUTTER, FIELD_STYLES } from '@/theme/fields';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useLoginOtp } from './useLoginOtp';

import { useLocalSearchParams } from 'expo-router';

const LoginScreen = ({
  return_to,
}: {
  return_to: ReturnType<typeof useLocalSearchParams>['return_to'];
}) => {
  const {
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
  } = useLoginOtp(return_to);
  const emailDisabled = isWaitingForOtp || isLoading;

  return (
    <PageContainer
      backgroundColor={COLORS.warmSurface}
      topBar={
        <TopBar
          title={'Login'}
          backButton={{
            isShow: true,
            onClick: () => router.goBackSafely(),
          }}
        />
      }
    >
      <View style={styles.container}>
        <View style={styles.loginBox}>
          <View style={{ height: 16 }} />
          <Text accessibilityRole="header" aria-level={2} style={styles.title}>
            Welcome!
          </Text>

          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  FIELD_STYLES.input,
                  FIELD_STYLES.surface,
                  styles.input,
                  emailDisabled && FIELD_STYLES.disabled,
                ]}
                accessibilityLabel="Email"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'email-error' : undefined}
                placeholderTextColor={COLORS.secondaryText}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!emailDisabled}
                aria-disabled={emailDisabled}
                accessibilityState={{ disabled: emailDisabled }}
              />
              <FieldIcon name="email" disabled={emailDisabled} />
            </View>
            {isWaitingForOtp && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change email"
                aria-disabled={isLoading}
                accessibilityState={{ disabled: isLoading }}
                disabled={isLoading}
                style={({ pressed }) => [styles.inputAction, pressed && { opacity: 0.7 }]}
                onPress={handleChangeEmail}
              >
                <Text>Change</Text>
              </Pressable>
            )}
          </View>

          {!!emailError && (
            <Text nativeID="email-error" accessibilityRole="alert" style={styles.error}>
              {emailError}
            </Text>
          )}

          {isWaitingForOtp && (
            <View style={styles.otpField}>
              <TextInput
                style={[
                  FIELD_STYLES.input,
                  FIELD_STYLES.surface,
                  styles.input,
                  isLoading && FIELD_STYLES.disabled,
                ]}
                accessibilityLabel="OTP"
                placeholderTextColor={COLORS.secondaryText}
                placeholder="Input your OTP here..."
                value={otp}
                onChangeText={setOtp}
                editable={!isLoading}
                aria-disabled={isLoading}
                accessibilityState={{ disabled: isLoading }}
              />
              <FieldIcon name="lock" disabled={isLoading} />
            </View>
          )}

          {isWaitingForOtp && (
            <Pressable
              onPress={handleResendOtp}
              accessibilityRole="button"
              accessibilityLabel="Resend OTP"
              aria-disabled={!canResend || isLoading}
              aria-busy={isLoading}
              accessibilityState={{ disabled: !canResend || isLoading, busy: isLoading }}
              disabled={!canResend || isLoading}
              style={({ pressed }) => [styles.resendContainer, pressed && { opacity: 0.7 }]}
            >
              <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
                Resend OTP {!canResend && timer > 0 && `(${formatTime(timer)})`}
              </Text>
            </Pressable>
          )}

          <View style={{ height: 8 }} />

          <AppButton
            label={isWaitingForOtp ? 'LOGIN' : 'Send OTP'}
            onPress={isWaitingForOtp ? handleVerifyOtp : handleSendOtp}
            loading={isLoading}
            style={styles.loginButton}
          />

          <View style={{ height: 16 }} />
        </View>
      </View>
      <Toast />
    </PageContainer>
  );
};

const ICON_SIZE = 20;

// Sits over the input (after it in the tree, so it paints above the input's background).
const FieldIcon = ({
  name,
  disabled,
}: {
  name: React.ComponentProps<typeof MaterialIcons>['name'];
  disabled: boolean;
}) => (
  <View pointerEvents="none" style={[styles.inputIcon, disabled && FIELD_STYLES.disabled]}>
    <MaterialIcons
      aria-hidden
      importantForAccessibility="no"
      name={name}
      size={ICON_SIZE}
      color={COLORS.mutedIcon}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginBox: {
    maxWidth: LAYOUT.form,
    alignSelf: 'center',
    width: '100%',
    backgroundColor: COLORS.page,
    borderRadius: 10,
    padding: 20,
    shadowColor: COLORS.shadow,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  inputContainer: {
    flex: 1,
  },
  otpField: {
    marginBottom: SPACING.medium,
  },
  inputIcon: {
    position: 'absolute',
    start: FIELD_BORDER + FIELD_GUTTER,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  input: {
    paddingStart: FIELD_GUTTER + ICON_SIZE + SPACING.small,
  },
  inputAction: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginStart: SPACING.small,
  },
  error: { color: COLORS.accentText, marginBottom: 15 },
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
    color: COLORS.mutedIcon,
  },
});

export default LoginScreen;
