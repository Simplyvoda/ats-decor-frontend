import { Bell, Compass, FileText, Home, PenTool } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Image,
    SafeAreaView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
// import HomeTabs from '../components/(tabs)/HomeTabNavigator';
import { images } from '../../../assets/constants/images';
import DesignScreen from '../../components/(home)/DesignScreen';
import ExploreScreen from '../../components/(home)/ExploreScreen';
import HomeScreen from '../../components/(home)/HomeScreen';
import NotesScreen from '../../components/(home)/NotesScreen';
import { useUserContext } from '../../context/UserContext';


const HomeLayout = () => {
  const { user } = useUserContext();
  const [activeTab, setActiveTab] = useState<string>('Home');
  const onTabChange = (tabName: string) => {
    setActiveTab(tabName);
    // navigateTo(navigation, tabName);
  };

  const tabScreens: Record<string, React.ReactNode> = {
    Home: <HomeScreen />,
    Design: <DesignScreen />,
    Notes: <NotesScreen />,
    Explore: <ExploreScreen />,
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        <StatusBar barStyle="dark-content" backgroundColor="transparent" />

        {user && (
          <View className="flex-row justify-between items-center px-5 py-2 bg-white">
            <View className="flex-row items-center">
              <View className="mr-3">
                <Image
                  source={images.ats_logo}
                  className="w-10 h-10 rounded-full"
                />
              </View>
              <View>
                <Text className="text-gray-500 text-sm">Welcome</Text>
                <Text className="text-gray-800 text-base font-semibold">
                  {user.first_name} {user.last_name}
                </Text>
              </View>
            </View>
            <TouchableOpacity className="relative">
              <Bell size={24} color="#333" />
              <View className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
            </TouchableOpacity>
          </View>
        )}

        {/* Main Content Area */}
        <View className="flex-1">{tabScreens[activeTab]}</View>

        {/* Bottom Navigation */}
        {true && (
          <View className="flex-row justify-around items-center bg-white border-t border-gray-200 py-3">
            <TouchableOpacity
              onPress={() => onTabChange('Home')}
              className="items-center flex-1">
              <Home
                size={24}
                color={activeTab === 'Home' ? '#C4A962' : '#999'}
              />
              <Text
                className={
                  activeTab === 'Home'
                    ? 'text-[#C4A962] text-xs mt-1 font-semibold'
                    : 'text-gray-500 text-xs mt-1'
                }>
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onTabChange('Design')}
              className="items-center flex-1">
              <PenTool
                size={24}
                color={activeTab === 'Design' ? '#C4A962' : '#999'}
              />
              <Text
                className={
                  activeTab === 'Design'
                    ? 'text-[#C4A962] text-xs mt-1 font-semibold'
                    : 'text-gray-500 text-xs mt-1'
                }>
                Design
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onTabChange('Notes')}
              className="items-center flex-1">
              <FileText
                size={24}
                color={activeTab === 'Notes' ? '#C4A962' : '#999'}
              />
              <Text
                className={
                  activeTab === 'Notes'
                    ? 'text-[#C4A962] text-xs mt-1 font-semibold'
                    : 'text-gray-500 text-xs mt-1'
                }>
                Notes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onTabChange('Explore')}
              className="items-center flex-1">
              <Compass
                size={24}
                color={activeTab === 'Explore' ? '#C4A962' : '#999'}
              />
              <Text
                className={
                  activeTab === 'Explore'
                    ? 'text-[#C4A962] text-xs mt-1 font-semibold'
                    : 'text-gray-500 text-xs mt-1'
                }>
                Explore
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

export default HomeLayout;
