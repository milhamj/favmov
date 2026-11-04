import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function RetryButton({ onPress, disabled = false }: { onPress: () => void; disabled?: boolean }) {
    return <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, disabled && styles.disabled]}>
        <Text style={styles.label}>Retry</Text>
    </TouchableOpacity>;
}

const styles = StyleSheet.create({
    button: { minWidth: 44, minHeight: 44, paddingHorizontal: 16, paddingVertical: 12, alignSelf: 'flex-start', justifyContent: 'center', alignItems: 'center', backgroundColor: '#b8321c', borderRadius: 6, marginVertical: 8 },
    label: { color: '#ffffff', fontWeight: '600' },
    disabled: { opacity: 0.5 },
});
