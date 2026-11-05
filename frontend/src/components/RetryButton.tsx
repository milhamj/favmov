import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RetryButton({ onPress, disabled = false, message }: { onPress: () => void; disabled?: boolean; message?: string }) {
    const button = <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, disabled && styles.disabled]}>
        <Text style={styles.label}>Retry</Text>
    </TouchableOpacity>;
    return message ? <View accessibilityRole="alert" style={styles.message}><Text>{message}</Text>{button}</View> : button;
}

const styles = StyleSheet.create({
    message: { padding: 16 },
    button: { minWidth: 44, minHeight: 44, paddingHorizontal: 16, paddingVertical: 12, alignSelf: 'flex-start', justifyContent: 'center', alignItems: 'center', backgroundColor: '#b8321c', borderRadius: 6, marginVertical: 8 },
    label: { color: '#ffffff', fontWeight: '600' },
    disabled: { opacity: 0.5 },
});
