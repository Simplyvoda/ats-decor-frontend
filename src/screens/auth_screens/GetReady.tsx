import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

export default function GetReady() {
  const navigation = useNavigation();

  const handleSignUp = () => {
    navigation.navigate('SignUp' as never);
  };

  const handleLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
<View className="flex-1 bg-[#FAF9F6] justify-between px-6 py-10">
      {/* Content */}
      <View className="mt-20 items-center">
        <Text className="text-[20px] font-semibold text-black text-center mb-2">
          Ready to Design Your Dream Home?
        </Text>
        <Text className="text-[14px] text-[#7A7A7A] text-center leading-5 max-w-[300px]">
          Join us to save your styles and get personalized design inspiration.
        </Text>
      </View>

      {/* Buttons */}
      <View className="w-full space-y-4">
        <TouchableOpacity
          className="bg-[#C9A56A] rounded-lg py-3.5 items-center"
          onPress={handleSignUp}
        >
          <Text className="text-white font-semibold text-[16px]">Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="border border-[#C9A56A] rounded-lg py-3.5 items-center"
          onPress={handleLogin}
        >
          <Text className="text-black font-semibold text-[16px]">Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


