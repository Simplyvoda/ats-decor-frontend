import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from '../../screens/home_screens/HomeScreen';
import DesignScreen from '../../screens/home_screens/DesignScreen';
import ExploreScreen from '../../screens/home_screens/ExploreScreen';
import NotesScreen from '../../screens/home_screens/NotesScreen';
import {Home} from 'lucide-react-native';

const Tab = createBottomTabNavigator();

const renderIcon = (
  IconComponent: React.ComponentType<{size: number; color: string}>,
) => {
  return ({focused}: {focused: boolean}) => {
    return <IconComponent size={24} color={focused ? '#D4A574' : '#999'} />;
  };
};

export default function HomeTabs() {
  return (
    <Tab.Navigator screenOptions={{headerShown: false}}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: renderIcon(Home),
        }}
      />
      <Tab.Screen name="Design" component={DesignScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Notes" component={NotesScreen} />
    </Tab.Navigator>
  );
}
