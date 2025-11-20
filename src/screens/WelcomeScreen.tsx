/* eslint-disable react-native/no-inline-styles */
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  Text,
  View
} from 'react-native';
import PrimaryButton from '../components/molecules/PrimaryButton';

function WelcomeScreen(): React.JSX.Element {
  const navigation = useNavigation();

  const handleGetStarted = () => {
    navigation.navigate('Steps' as never);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAF9F6]">
      <StatusBar />
      <View className="relative flex-1 flex-col justify-start items-center px-3 pt-24 space-y-4">
        {/* Video placeholder */}
        <View className="w-[90%] min-h-[300px] bg-[#D9D9D9] justify-center items-center rounded-lg">
          <Text className="text-black">Video goes here</Text>
        </View>

        {/* Title */}
        <Text className="text-center text-[25px] leading-[25px] font-bold font-cormorant max-w-[80%] mt-5">
          Welcome to All Things Snug!
        </Text>

        {/* Subtitle */}
        <Text className="text-center text-[16px]  font-normal font-dm-sans leading-6 text-[#2C2C2C80] max-w-[80%]">
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
