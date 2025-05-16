import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface IconProps {
    name: string;
    onClick: () => void;
}
  
interface TopBarProps {
    title: string;
    icons: IconProps[];
}

const TopBar: React.FC<TopBarProps> = ({ title, icons }) => {
  return (
    <View style={styles.topBar}>
      <Text style={styles.appTitle}>{title}</Text>
      <View style={styles.iconContainer}>
        {icons.map((icon, index) => (
          <Icon
            key={index}
            name={icon.name}
            size={24}
            onPress={icon.onClick} // Use onPress for mobile platforms
            style={styles.icon}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  iconContainer: {
    flexDirection: 'row',
  },
  icon: {
    marginLeft: 10,
  },
});

export default TopBar;