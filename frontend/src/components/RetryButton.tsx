import React from 'react';
import AppButton from './AppButton';
import { StyleSheet, Text, View } from 'react-native';

// Without onPress only the message shows, for errors a retry cannot fix.
export default function RetryButton({ onPress, disabled = false, message }: { onPress?: () => void; disabled?: boolean; message?: string }) {
    const button = onPress && <AppButton label="Retry" disabled={disabled} onPress={onPress} style={styles.button} />;
    return message ? <View accessibilityRole="alert" style={styles.message}><Text>{message}</Text>{button}</View> : button ?? null;
}

const styles = StyleSheet.create({
    message: { padding: 16 },
    button: { alignSelf: 'flex-start', marginVertical: 8 },
});
