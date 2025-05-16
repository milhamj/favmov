import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons'; 
import Homepage from './src/screens/Homepage';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName: string = 'home';
            if (route.name === 'Home') {
              iconName = 'home';
            } else if (route.name === 'Collection') {
              iconName = 'collections';
            } else if (route.name === 'Profile') {
              iconName = 'person';
            }
            return <Icon name={iconName} color={color} size={size} />;
          },
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Home" component={Homepage} />
        <Tab.Screen name="Collection" component={Homepage} />
        <Tab.Screen name="Profile" component={Homepage} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};