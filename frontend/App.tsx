import { NavigationContainer, RouteProp, useRoute } from '@react-navigation/native';
import { Platform, ViewStyle } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Icon } from 'react-native-elements';
import { RootStackParamList } from './src/navigation/navigationTypes';
import Toast from 'react-native-toast-message';
import HomePage from './src/screens/Homepage';
import SearchPage from './src/screens/SearchPage';
import MovieDetailPage from './src/screens/MovieDetailPage';
import LoginPage from './src/screens/LoginPage';
import CollectionPage from './src/screens/CollectionPage';
import ProfilePage from './src/screens/ProfilePage';
import CollectionDetailPage from './src/screens/CollectionDetail';
import AddToCollectionPage from './src/screens/AddToCollectionPage';

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
          <Stack.Screen name="MainPage" component={MainTabs} />
          <Stack.Screen name="SearchPage" component={SearchPage} />
          <Stack.Screen name="MovieDetailPage" component={MovieDetailPage} />
          <Stack.Screen name="CollectionDetailPage" component={CollectionDetailPage} />
          <Stack.Screen name="AddToCollectionPage" component={AddToCollectionPage} />
          <Stack.Screen name="LoginPage" component={LoginPage} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </>
  );
}

type MainTabsRouteProp = RouteProp<RootStackParamList, 'MainPage'>;

const MainTabs = () => {
  const route = useRoute<MainTabsRouteProp>();
  const activeTab = route.params?.activeTab;

  return (
  <Tab.Navigator
      initialRouteName={activeTab || 'Home'}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: string = 'home';
          if (route.name === 'HomePage') {
            iconName = 'home';
          } else if (route.name === 'CollectionPage') {
            iconName = 'collections';
          } else if (route.name === 'ProfilePage') {
            iconName = 'person';
          }
          return <Icon name={iconName} color={color} size={size} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="HomePage" component={HomePage} />
      <Tab.Screen name="CollectionPage" component={CollectionPage} />
      <Tab.Screen name="ProfilePage" component={ProfilePage} />
    </Tab.Navigator>
  );
}