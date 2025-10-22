import React from 'react';
import { View, Text, TouchableOpacity, Image, StatusBar, SafeAreaView } from 'react-native';
import { Bell } from 'lucide-react-native';
import HomeTabs from '../components/(tabs)/HomeTabNavigator';
import { images } from '../../assets/constants/images';

const HomeLayout = ({
  children,
  showHeader = true,
}: {
  children: React.ReactNode;
  showHeader?: boolean;
}) => {
  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        <StatusBar barStyle="dark-content" backgroundColor="transparent" />

        {showHeader && (
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
                <Text className="text-gray-800 text-base font-semibold">Vodina Efem</Text>
              </View>
            </View>
            <TouchableOpacity className="relative">
              <Bell size={24} color="#333" />
              <View className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
            </TouchableOpacity>
          </View>
        )}

        {/* Main Content Area */}
        <View className="flex-1">{children}</View>

        {/* Bottom Navigation */}
        <HomeTabs />
      </SafeAreaView>
    </View>
  );
};

export default HomeLayout;
