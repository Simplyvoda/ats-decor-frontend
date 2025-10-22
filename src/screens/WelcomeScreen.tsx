/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {Text, View, TouchableOpacity, StatusBar} from 'react-native';
import {useNavigation} from '@react-navigation/native';

function WelcomeScreen(): React.JSX.Element {
  const navigation = useNavigation();

  const handleGetStarted = () => {
    navigation.navigate('Steps' as never);
  };

  return (
    <View className="flex-1 bg-[#FAF9F6]">
      <StatusBar/>
      <View className="relative flex-1 flex-col justify-start items-center px-3 pt-20 space-y-5">
        {/* Video placeholder */}
        <View className="w-[90%] min-h-[300px] bg-[#D9D9D9] justify-center items-center rounded-lg">
          <Text className="text-black">Video goes here</Text>
        </View>

        {/* Title */}
        <Text className="text-center text-[25px] leading-[25px] font-bold font-[CormorantGaramond-SemiBold] max-w-[80%] my-2">
          Welcome to All Things Snug!
        </Text>

        {/* Subtitle */}
        <Text className="text-center text-[16px] leading-[16px] font-normal font-[DMSans-Regular] text-[#2C2C2C80] max-w-[80%]">
          Visualize, Plan, and Transform Your Home with Ease.
        </Text>

        {/* Button */}
        <TouchableOpacity
          className="absolute bottom-8 w-[90%] bg-[#C1A36A] py-3 px-5 rounded-lg items-center"
          onPress={handleGetStarted}>
          <Text className="text-white text-[16px] font-semibold">
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default WelcomeScreen;
