import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';

interface IconProps {
    name: string;
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
            <Icon name='arrow-back' size={24} onPress={backButton?.onClick}/>
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
              <Icon
                key={index}
                name={icon.name}
                size={24}
                onPress={icon.onClick}
                style={styles.icon}
              />
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
    backgroundColor: '#f8f8f8',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginLeft: 10,
  },
});

export default TopBar;