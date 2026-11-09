import {Camera, Ruler} from 'lucide-react-native';
import React from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {navigateTo} from '../../utils/navigation';
import {useNavigation} from '@react-navigation/native';
import {isRoomScanSupported} from '../../utils/deviceCapabilities';
import {Toast} from 'react-native-toast-message/lib/src/Toast';

// The Design tab: where a new room is made, by scanning or by entering its
// measurements. Either way the room is saved first (SaveRoomScreen), and
// designs start from saved rooms. Templates are under Home → Studio.
const DesignScreen = () => {
  const navigation = useNavigation();
  const scanSupported = isRoomScanSupported();

  const handleScanPress = () => {
    if (!scanSupported) {
      Toast.show({
        type: 'info',
        text1: 'Room scanning is not supported on this device',
        text2:
          'Please use a compatible device (pro models) with iOS 16 or later to scan rooms',
      });
      return;
    }
    navigateTo(navigation, 'ScanScreen');
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{paddingBottom: 24}}
      showsVerticalScrollIndicator={false}>
      <View className="h-[150px] bg-brand w-full px-5 pt-6 flex">
        <Text className="font-cormorant text-white dark:text-night text-[32px] mb-2">
          Create your design
        </Text>
        <Text className="font-dm-sans text-white dark:text-night text-[16px]">
          Choose how you'd like to start
        </Text>
      </View>
      <View className="flex flex-col px-4 gap-5 mt-[-45px]">
        <TouchableOpacity
          onPress={handleScanPress}
          activeOpacity={1}
          className="px-3 py-5 flex flex-row justify-start items-center shadow-slate-600 shadow-sm rounded-[16px] bg-white dark:bg-night-surface">
          <View className="bg-[#4169E1] w-[30px] h-[80px] rounded-[14px] flex items-center justify-center">
            <Camera color={'white'} />
          </View>
          <View className="ml-5">
            <Text className="font-cormorant text-xl text-black dark:text-night-text-primary">
              Scan a room
            </Text>
            <Text className="font-dm-sans text-md text-black dark:text-night-text-secondary">
              Use your camera to capture your space
            </Text>
            {!scanSupported && (
              <Text className="font-dm-sans text-sm text-orange-600">
                Room scanning is not supported on this device
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <View className="items-center -mt-1">
          <Text className="font-dm-sans text-sm text-[#7A7A7A] dark:text-night-text-muted mb-3">
            Prefer to measure it yourself?
          </Text>
          <TouchableOpacity
            onPress={() => navigateTo(navigation, 'RoomBuilder')}
            accessibilityRole="button"
            className="flex-row items-center px-5 py-3 rounded-[12px] border-[1px] border-brand">
            <Ruler color={'#C1A36A'} size={18} />
            <Text className="font-dm-sans text-[16px] text-brand ml-2">
              Enter room dimensions manually
            </Text>
          </TouchableOpacity>
        </View>

        <View className="px-3 py-8 flex flex-row justify-start items-center rounded-[16px] bg-transparent border-[1px] border-[#2C2C2C33] dark:border-night-border">
          <View className="ml-5 flex-1">
            <Text className="font-cormorant text-2xl mb-5 text-black dark:text-night-text-primary">
              Design Tips
            </Text>
            <View className="flex-row items-center mb-5">
              <View className="h-3 w-3 rounded-full bg-brand" />
              <Text className="font-dm-sans text-base ml-2 text-black dark:text-night-text-secondary">
                Scan in good lighting for best results
              </Text>
            </View>
            <View className="flex-row items-center mb-5">
              <View className="h-3 w-3 rounded-full bg-brand" />
              <Text className="font-dm-sans text-base ml-2 text-black dark:text-night-text-secondary">
                Test different ideas till you get it right
              </Text>
            </View>
            <View className="flex-row items-center pr-6">
              <View className="h-3 w-3 rounded-full bg-brand" />
              <Text className="font-dm-sans text-base ml-2 text-black dark:text-night-text-secondary">
                Measure each wall carefully and enter dimensions in metres
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default DesignScreen;
