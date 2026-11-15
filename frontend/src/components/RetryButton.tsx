import { LAYOUT, SPACING } from '@/theme/colors';
import React from 'react';
import AppButton from './AppButton';
import { StyleSheet, Text, View } from 'react-native';

// Without onPress only the message shows, for errors a retry cannot fix.
export default function RetryButton({
  onPress,
  disabled = false,
  message,
}: {
  onPress?: () => void;
  disabled?: boolean;
  message?: string;
}) {
  const button = onPress && (
    <AppButton label="Retry" disabled={disabled} onPress={onPress} style={styles.button} />
  );
  return message ? (
    <View accessibilityRole="alert" style={styles.message}>
      <Text>{message}</Text>
      {button}
    </View>
  ) : (
    (button ?? null)
  );
}

const styles = StyleSheet.create({
  message: {
    maxWidth: LAYOUT.reading,
    width: '100%',
    alignSelf: 'center',
    padding: SPACING.medium,
  },
  button: { alignSelf: 'flex-start', marginVertical: SPACING.small },
});
