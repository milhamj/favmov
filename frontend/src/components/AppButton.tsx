import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, Pressable, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/theme/colors';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  destructive?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function AppButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  destructive = false,
  style,
}: AppButtonProps) {
  const unavailable = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-disabled={unavailable}
      aria-busy={loading}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        [
          styles.button,
          destructive && styles.destructive,
          style,
          disabled && !loading && styles.disabled,
        ],
        pressed && { opacity: 0.7 },
      ]} // a loading button keeps its full-strength spinner
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.onAccent} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    opacity: 1,
    minWidth: 48,
    minHeight: 48,
    paddingHorizontal: SPACING.large,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.control,
  },
  label: { ...TYPOGRAPHY.action, color: COLORS.onAccent },
  destructive: { backgroundColor: COLORS.destructive },
  disabled: { opacity: 0.5 },
});
