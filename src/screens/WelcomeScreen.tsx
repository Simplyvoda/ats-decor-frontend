/* eslint-disable react-native/no-inline-styles */
import {useNavigation} from '@react-navigation/native';
import React from 'react';
import {SafeAreaView, StatusBar, Text, View} from 'react-native';
import PrimaryButton from '../components/molecules/PrimaryButton';

function WelcomeScreen(): React.JSX.Element {
  const navigation = useNavigation();

  const handleGetStarted = () => {
    navigation.navigate('Steps' as never);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAF9F6] dark:bg-night">
      <StatusBar />
      <View className="relative flex-1 flex-col justify-start items-center px-3 pt-24 space-y-4">
        {/* Video placeholder */}
        <View className="w-[90%] min-h-[300px] bg-[#D9D9D9] dark:bg-night-muted justify-center items-center rounded-lg">
          <Text className="text-black dark:text-night-text-primary">
            Video goes here
          </Text>
        </View>

        {/* Title */}
        <Text className="text-center text-[25px] leading-[25px] font-bold font-cormorant text-black dark:text-night-text-primary max-w-[80%] mt-5">
          Welcome to All Pladomus!
        </Text>

        {/* Subtitle */}
        <Text className="text-center text-[16px] font-normal font-dm-sans leading-6 text-[#2C2C2C80] dark:text-night-text-muted max-w-[80%]">
          Visualize, Plan, and Transform Your Home with Ease.
        </Text>

        <View className="absolute bottom-4 w-[90%]">
          <PrimaryButton title="Get Started" onPress={handleGetStarted} />
        </View>
      </View>
    </SafeAreaView>
  );
}

export default WelcomeScreen;
