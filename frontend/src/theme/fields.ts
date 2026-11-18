import { StyleSheet } from 'react-native';
import { COLORS, RADIUS, TYPOGRAPHY } from './colors';

export const FIELD_BORDER = 1;
// Horizontal inset of field content from the field border.
export const FIELD_GUTTER = 12;

export const FIELD_STYLES = StyleSheet.create({
  input: { minHeight: 48, ...TYPOGRAPHY.body, color: COLORS.text, paddingVertical: 12 },
  // Put the surface on the TextInput itself: on a wrapper, the browser focus ring draws a second
  // box inside the field border.
  surface: {
    backgroundColor: COLORS.field,
    borderRadius: RADIUS.control,
    borderColor: COLORS.border,
    borderWidth: FIELD_BORDER,
    paddingHorizontal: FIELD_GUTTER,
  },
  disabled: { opacity: 0.6 },
});
