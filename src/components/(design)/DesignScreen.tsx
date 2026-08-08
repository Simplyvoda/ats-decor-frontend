import {Camera, LayoutPanelTop} from 'lucide-react-native';
import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {navigateTo} from '../../utils/navigation';
import {useNavigation} from '@react-navigation/native';

const DesignScreen = () => {
  const navigation = useNavigation();

  return (
    <View>
      <View className="h-[150px] bg-brand w-full px-5 pt-6 flex">
        <Text className="font-cormorant text-white text-[32px] mb-2">
          Create your design
        </Text>
        <Text className="font-dm-sans text-white text-[16px]">
          Choose how you'd like to start
        </Text>
      </View>
      <View className="flex flex-col px-4 gap-5 mt-[-45px]">
        <TouchableOpacity
          onPress={() => navigateTo(navigation, 'ScanScreen')}
          className="px-3 py-5 flex flex-row justify-start items-center shadow-slate-600 shadow-sm rounded-[16px] bg-white">
          <View className="bg-[#4169E1] w-[30px] h-[80px] rounded-[14px] flex items-center justify-center">
            <Camera color={'white'} />
          </View>
          <View className="ml-5">
            <Text className="font-cormorant text-xl">Scan a room</Text>
            <Text className="font-dm-sans text-md">
              Use your camera to capture your space
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateTo(navigation, 'ChooseModel')}
          className="px-3 py-5 flex flex-row justify-start items-center shadow-slate-600 shadow-sm rounded-[16px] bg-white">
          <View className="bg-[#0E920E] w-[30px] h-[80px] rounded-[14px] flex items-center justify-center">
            <LayoutPanelTop color={'white'} />
          </View>
          <View className="ml-5">
            <Text className="font-cormorant text-xl">Choose a model</Text>
            <Text className="font-dm-sans text-md">
              Choose a house model and start designing⁠
            </Text>
          </View>
        </TouchableOpacity>

        <View className="px-3 py-8 flex flex-row justify-start items-center  rounded-[16px] bg-transparent border-[1px] border-[#2C2C2C33]">
          <View className="ml-5">
            <Text className="font-cormorant text-2xl mb-5">Design Tips</Text>
            <View className="flex-row items-center mb-5">
              <View className="h-3 w-3 rounded-full bg-brand" />
              <Text className="font-dm-sans text-base ml-2">
                Scan in good lighting for best results
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className="h-3 w-3 rounded-full bg-brand" />
              <Text className="font-dm-sans text-base ml-2">
                Test different ideas till you get it right
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default DesignScreen;
