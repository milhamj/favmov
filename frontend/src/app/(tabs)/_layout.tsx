import { Tabs } from 'expo-router';
import { Icon } from 'react-native-elements';

const tabs = [
    {
        name: 'index',
        title: 'Home',
        icon: 'home',
    },
    {
        name: 'collection',
        title: 'Collections',
        icon: 'collections',
    },
    {
        name: 'profile',
        title: 'Profile',
        icon: 'person',
    }
]

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      }}
    >
        {
            tabs.map(tab => (
                <Tabs.Screen
                    name={tab.name}
                    options={{
                        title: tab.title,
                        tabBarIcon: ({ color, size }) => (
                            <Icon name={tab.icon} color={color} size={size} type='material' />
                        ),
                    }}
                />
            ))
        }
    </Tabs>
  );
}