import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../styles/colors';
import { Icon } from 'react-native-elements';

interface IconProps {
    name: string;
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
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        { showBackButton ? (
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={backButton?.onClick} style={styles.backButton}>
              <Icon name='arrow-back' size={24} />
            </TouchableOpacity>
          ) : null
        }
        <Text 
          style={[styles.title, { marginLeft: showBackButton ? 8 : 0 }]}
          numberOfLines={1} 
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      </View>
      {
        showIcon ? (
          <View style={styles.rightContainer}>
            {icons?.map((icon, index) => (
              <TouchableOpacity key={index} accessibilityRole="button" accessibilityLabel={icon.label} onPress={icon.onClick} style={styles.icon}>
                <Icon name={icon.name} size={24} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
