/* eslint-disable react-native/no-inline-styles */
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Image,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import PrimaryButton from '../components/molecules/PrimaryButton';
import { navigateTo } from '../utils/navigation';

const stepsData = [
  {
    image: require('../../assets/images/step1.png'),
    title: 'Scan Your Space in Minutes',
    subtitle: 'Say Goodbye to Guesswork and Hello to Precise Planning',
    buttonText: 'Next',
  },
  {
    image: require('../../assets/images/step2.png'),
    title: 'Bring Your Existing Pieces to Life',
    subtitle:
      'Visualize How Your Beloved Items Will Fit In Your Redesigned Spaces.',
    buttonText: 'Next',
  },
  // {
  //   image: require('../../assets/images/step2.png'),
  //   title: 'Bring Your Existing Pieces to Life',
  //   subtitle:
  //     'Visualize How Your Beloved Items Will Fit In Your Redesigned Spaces.',
  //   buttonText: 'Finish',
  // },
];

export default function StepsScreen() {
  const [step, setStep] = useState(0);
  const navigation = useNavigation();

  const nextStep = () => {
    if (step < stepsData.length - 1) {
      setStep(step + 1);
    } else {
      navigateTo(navigation, 'Auth', { screen: 'GetReady' });
    }
  };

  const {image, title, subtitle, buttonText} = stepsData[step];

  return (
    <SafeAreaView className="flex-1 bg-[#FAF9F6]">
      <View className="relative flex-1 flex-col justify-start items-center px-3 pt-20 space-y-5">
        {/* Image container */}
        <View className="w-[90%] min-h-[300px] justify-center items-center rounded-lg overflow-hidden bg-[#D9D9D9]">
          <Image
            source={image}
            className="w-full h-[350px] rounded-lg"
            resizeMode="cover"
          />
        </View>

        {/* Title */}
        <Text className="text-center text-[25px] leading-[25px] font-bold font-cormorant max-w-[80%] my-2">
          {title}
        </Text>

        {/* Subtitle */}
        <Text className="text-center text-[16px] leading-[16px] font-normal font-dm-sans text-[#2C2C2C80] max-w-[80%]">
          {subtitle}
        </Text>



        <View className="absolute bottom-4 w-[90%]">
          <PrimaryButton title={buttonText} onPress={nextStep} />
        </View>
      </View>
    </SafeAreaView>
  );
}
