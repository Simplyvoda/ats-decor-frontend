import {useNavigation} from '@react-navigation/native';
import React from 'react';
import {SafeAreaView, Text, TouchableOpacity, View} from 'react-native';
import PrimaryButton from '../../components/molecules/PrimaryButton';
import SecondaryButton from '../../components/molecules/SecondaryButton';

export default function GetReady() {
  const navigation = useNavigation();

  const handleSignUp = () => {
    navigation.navigate('SignUp' as never);
  };

  const handleLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <SafeAreaView className="h-screen bg-offWhite flex flex-col justify-between items-center p-6">
      {/* Content */}
      <View className="mt-32 items-center">
        <Text className="text-[25px] font-semibold font-cormorant text-black text-center mb-2">
          Ready to Design Your Dream
        </Text>
        <Text className="text-[25px] font-semibold font-cormorant text-black text-center mb-2">
          Home?
        </Text>
        <Text className="text-[16px] text-[#7A7A7A] font-dm-sans text-center leading-5 max-w-[300px]">
          Join us to save your styles and get personalized design inspiration.
        </Text>
      </View>

      <View className="w-full p-6 mx-auto flex flex-col space-x-3">
        <View className='w-full mb-5'>

        <PrimaryButton title="Sign Up" onPress={handleSignUp} />
        </View>

        <SecondaryButton title="Log In" onPress={handleLogin} />
      </View>
    </SafeAreaView>
  );
}
