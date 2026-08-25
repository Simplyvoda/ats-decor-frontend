import React from 'react';
import {StatusBar, Text, TouchableOpacity, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Compass,
  FileText,
  Home,
  PenTool,
  Settings,
} from 'lucide-react-native';

import DesignScreen from '../components/(design)/DesignScreen';
import ExploreScreen from '../components/(explore)/ExploreScreen';
import HomeScreen from '../screens/home_screens/InitialScreen';
import NotesScreen from '../components/(notes)/NotesScreen';
import InitialsAvatar from '../components/molecules/InitialsAvatar';
import {useUserContext} from '../context/UserContext';

const Tab = createBottomTabNavigator();

function TabHeader() {
  const navigation = useNavigation<any>();
  const {user} = useUserContext();

  return (
    <SafeAreaView edges={['top']} style={{backgroundColor: 'white'}}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 8,
          backgroundColor: 'white',
        }}>
        <TouchableOpacity
          style={{flexDirection: 'row', alignItems: 'center'}}
          onPress={() => navigation.navigate('Settings', {screen: 'ProfilePreferences'})}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <View style={{marginRight: 12}}>
            <InitialsAvatar
              firstName={user?.first_name}
              lastName={user?.last_name}
              email={user?.email}
              size={40}
            />
          </View>
          <View>
            <Text style={{color: '#6b7280', fontSize: 12}}>Welcome!</Text>
            <Text style={{color: '#1f2937', fontSize: 14, fontWeight: '600'}}>
              {user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.email ?? ''}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          onPress={() => navigation.navigate('Settings')}>
          <Settings size={24} color="#333" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function HomeTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        header: () => <TabHeader />,
        tabBarActiveTintColor: '#C4A962',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 2,
        },
        tabBarIcon: ({color, size}) => {
          switch (route.name) {
            case 'Home':
              return <Home size={size} color={color} />;
            case 'Design':
              return <PenTool size={size} color={color} />;
            case 'Notes':
              return <FileText size={size} color={color} />;
            case 'Explore':
              return <Compass size={size} color={color} />;
            default:
              return null;
          }
        },
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Design" component={DesignScreen} />
      <Tab.Screen name="Notes" component={NotesScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
    </Tab.Navigator>
  );
}
