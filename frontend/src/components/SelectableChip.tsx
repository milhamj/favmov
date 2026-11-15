import { COLORS } from '@/theme/colors';
import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface SelectableChipProps {
  text: string;
  selected?: boolean;
  onSelect?: (isSelected: boolean) => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  selectedColor?: string;
  unselectedColor?: string;
  selectedTextColor?: string;
  unselectedTextColor?: string;
}

const SelectableChip: React.FC<SelectableChipProps> = ({
  text,
  selected = false,
  onSelect,
  style,
  textStyle,
  selectedColor = COLORS.accent,
  unselectedColor = COLORS.border,
  selectedTextColor = COLORS.onAccent,
  unselectedTextColor = COLORS.chipText,
}) => {
  const handlePress = () => {
    if (onSelect) {
      onSelect(!selected);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      aria-selected={selected}
      accessibilityState={{ selected }}
      onPress={handlePress}
      style={({ pressed }) => [
        [
          styles.chip,
          style,
          {
            backgroundColor: selected ? selectedColor : unselectedColor,
          },
        ],
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text
        style={[
          styles.text,
          textStyle,
          { color: selected ? selectedTextColor : unselectedTextColor },
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
    borderRadius: 16,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SelectableChip;
