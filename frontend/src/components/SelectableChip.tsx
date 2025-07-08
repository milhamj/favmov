import React, { useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Define the props interface for type safety
interface SelectableChipProps {
  text: string; // Chip label
  selected?: boolean; // Initial selected state
  onSelect?: (isSelected: boolean) => void; // Callback for selection change
  style?: ViewStyle; // Custom chip container style
  textStyle?: TextStyle; // Custom text style
  selectedColor?: string; // Background color when selected
  unselectedColor?: string; // Background color when unselected
  selectedTextColor?: string; // Text color when selected
  unselectedTextColor?: string; // Text color when unselected
}

// SelectableChip component
const SelectableChip: React.FC<SelectableChipProps> = ({
  text,
  selected = false,
  onSelect,
  style,
  textStyle,
  selectedColor = 'tomato', // Default selected color (Tomato)
  unselectedColor = '#e0e0e0', // Default unselected color (light gray)
  selectedTextColor = '#ffffff', // Default selected text color (white)
  unselectedTextColor = '#000000', // Default unselected text color (black)
}) => {
  const [isSelected, setIsSelected] = useState(selected);

  // Handle chip press to toggle selection
  const handlePress = () => {
    setIsSelected(!isSelected);
    if (onSelect) {
      onSelect(!isSelected);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.chip,
        style,
        {
          backgroundColor: isSelected ? selectedColor : unselectedColor,
          borderColor: isSelected ? selectedColor : '#000000',
        },
      ]}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.text,
          textStyle,
          { color: isSelected ? selectedTextColor : unselectedTextColor },
        ]}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
};

// Styles
const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SelectableChip;