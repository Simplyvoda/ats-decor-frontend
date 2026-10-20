import React from 'react';
import {StatusBar, Text, TouchableOpacity, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Compass, FileText, Home, PenTool, Settings} from 'lucide-react-native';

import DesignScreen from '../components/(design)/DesignScreen';
import ExploreScreen from '../components/(explore)/ExploreScreen';
import HomeScreen from '../screens/home_screens/InitialScreen';
import NotesScreen from '../components/(notes)/NotesScreen';
import UserAvatar from '../components/molecules/UserAvatar';
import {useUserContext} from '../context/UserContext';
import {useTheme} from '../theme/useTheme';

const Tab = createBottomTabNavigator();

function TabHeader() {
  const navigation = useNavigation<any>();
  const {user} = useUserContext();
  const {isDark, colors} = useTheme();

  return (
    <SafeAreaView edges={['top']} style={{backgroundColor: colors.surface}}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
      />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 8,
          backgroundColor: colors.surface,
        }}>
        <TouchableOpacity
          style={{flexDirection: 'row', alignItems: 'center'}}
          onPress={() =>
            navigation.navigate('Settings', {screen: 'ProfilePreferences'})
          }
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <View style={{marginRight: 12}}>
            <UserAvatar
              profilePicture={user?.profile_picture}
              firstName={user?.first_name}
              lastName={user?.last_name}
              email={user?.email}
              size={40}
            />
          </View>
          <View>
            <Text style={{color: colors.textMuted, fontSize: 12}}>
              Welcome!
            </Text>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 14,
                fontWeight: '600',
              }}>
              {user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : (user?.email ?? '')}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          onPress={() => navigation.navigate('Settings')}>
          <Settings size={24} color={colors.icon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function HomeTabNavigator() {
  const {colors} = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        header: () => <TabHeader />,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
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
