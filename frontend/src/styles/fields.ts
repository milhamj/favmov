import { StyleSheet } from 'react-native';
import { COLORS, RADIUS, TYPOGRAPHY } from './colors';

export const FIELD_STYLES = StyleSheet.create({
  input: { minHeight: 48, ...TYPOGRAPHY.body, color: COLORS.text, paddingVertical: 12 },
  surface: { backgroundColor: COLORS.field, borderRadius: RADIUS.control, borderColor: COLORS.border, borderWidth: 1, paddingHorizontal: 12 },
  disabled: { opacity: 0.6 },
});
