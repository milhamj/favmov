import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons'; 
import Homepage from './src/screens/Homepage';
import MovieDetail from './src/screens/MovieDetail';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="MovieDetail" component={MovieDetail} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const MainTabs = () => (
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
      headerShown: false, // Hide the default header
    })}
  >
    <Tab.Screen name="Home" component={Homepage} />
    <Tab.Screen name="Collection" component={Homepage} />
    <Tab.Screen name="Profile" component={Homepage} />
  </Tab.Navigator>
);