import React, { ComponentProps } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, LAYOUT, TYPOGRAPHY, SPACING } from '@/theme/colors';
import { MaterialIcons } from '@expo/vector-icons';

interface IconProps {
  name: ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  onClick: () => void;
}

interface BackButtonProps {
  isShow: boolean;
  onClick: () => void;
}

interface TopBarProps {
  title: string;
  icons?: IconProps[];
  backButton?: BackButtonProps;
}

const TopBar: React.FC<TopBarProps> = ({ title, icons, backButton }) => {
  const showBackButton = backButton && backButton.isShow;
  const showIcon = icons && icons.length > 0;

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          {showBackButton ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={backButton?.onClick}
              style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons
                aria-hidden
                importantForAccessibility="no"
                name="arrow-back"
                size={24}
              />
            </Pressable>
          ) : null}
          <Text
            accessibilityRole="header"
            aria-level={1}
            style={[styles.title, { marginLeft: showBackButton ? SPACING.small : 0 }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
        </View>
        {showIcon ? (
          <View style={styles.rightContainer}>
            {icons?.map((icon, index) => (
              <Pressable
                key={index}
                accessibilityRole="button"
                accessibilityLabel={icon.label}
                onPress={icon.onClick}
                style={({ pressed }) => [styles.icon, pressed && { opacity: 0.7 }]}
              >
                <MaterialIcons
                  aria-hidden
                  importantForAccessibility="no"
                  name={icon.name}
                  size={24}
                />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { backgroundColor: COLORS.header },
  container: {
    width: '100%',
    maxWidth: LAYOUT.page,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.medium,
    height: 56,
    backgroundColor: COLORS.header,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  backButton: {
    minWidth: 48,
    minHeight: 48,
    marginHorizontal: -12, // The 24px icon slot has a larger touch target.
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...TYPOGRAPHY.pageTitle,
    flexShrink: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TopBar;
