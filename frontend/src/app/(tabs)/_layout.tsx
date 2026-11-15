import { COLORS } from '@/theme/colors';
import { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const tabs: { name: string; title: string; icon: ComponentProps<typeof MaterialIcons>['name'] }[] =
  [
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
    },
  ];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.mutedIcon,
        headerShown: false,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          name={tab.name}
          key={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons
                aria-hidden
                importantForAccessibility="no"
                name={tab.icon}
                color={color}
                size={size}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
