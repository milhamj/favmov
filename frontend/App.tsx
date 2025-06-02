import { NavigationContainer } from '@react-navigation/native';
import { Platform, ViewStyle } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Icon } from 'react-native-elements';
import Toast from 'react-native-toast-message';
import Homepage from './src/screens/Homepage';
import SearchPage from './src/screens/SearchPage';
import MovieDetail from './src/screens/MovieDetail';
import LoginPage from './src/screens/LoginPage';
import Collection from './src/screens/Collection';
import ProfilePage from './src/screens/ProfilePage';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const cardStyle: ViewStyle = {
  flex: 1,
  ...(Platform.OS === 'web' ? { height: '100vh' as any } : { }),
};

export default function App() {
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: cardStyle, }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="SearchPage" component={SearchPage} />
          <Stack.Screen name="MovieDetail" component={MovieDetail} />
          <Stack.Screen name="Login" component={LoginPage} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </>
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
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={Homepage} />
    <Tab.Screen name="Collection" component={Collection} />
    <Tab.Screen name="Profile" component={ProfilePage} />
  </Tab.Navigator>
);