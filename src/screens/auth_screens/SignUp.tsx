import {ChevronLeft, LockKeyhole, Mail, User} from 'lucide-react-native';
import React from 'react';
import {Controller, useForm} from 'react-hook-form';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import PrimaryButton from '../../components/molecules/PrimaryButton';
import {useNavigation} from '@react-navigation/native';
import {goBack} from '../../utils/navigation';
// import { images } from '../../../assets/constants/images';
// import FacebookIcon from '../../../assets/icons/fb_icon.svg';
import {images} from '../../../assets/constants/images';

type FormData = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
};

const SignUp = () => {
  const {
    control,
    handleSubmit,
    formState: {errors},
    watch,
  } = useForm<FormData>({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  });

  const navigation = useNavigation();

  const onSubmit = (data: FormData) => {
    console.log('Form data:', data);
  };

  const password = watch('password');

  return (
    <SafeAreaView className="h-screen p-6 bg-offWhite">
      <ScrollView className="w-full">
        <View className="relative flex items-center justify-center my-2">
          <ChevronLeft
            className="absolute left-0 text-gray-primary"
            size={24}
            onPress={() => goBack(navigation)}
          />
          <Text className="text-xl font-semibold text-gray-primary">
            Sign Up
          </Text>
        </View>

        <View className="my-5">
          <Text className="cormorant text-2xl">Create Account</Text>
          <Text className="text-left text-light-gray text-lg">
            Please enter your details to create account.
          </Text>

          <View className="flex flex-col gap-5 py-5 justify-center">
            <View>
              <Controller
                control={control}
                name="first_name"
                rules={{required: 'First name is required'}}
                render={({field: {onChange, onBlur, value}}) => (
                  <View
                    className={`flex flex-row items-center border ${errors.first_name ? 'border-red-600' : 'border-[#ccc]'} bg-white mb-1.5 rounded-md px-2 py-3`}>
                    <User color="#9ca3af" size={18} />
                    <TextInput
                      className="w-full ml-2"
                      autoCapitalize="none"
                      placeholderTextColor="#9ca3af"
                      placeholder="First name"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                  </View>
                )}
              />
              {errors.first_name && (
                <Text className="text-red-600">
                  {errors.first_name.message}
                </Text>
              )}
            </View>

            <View>
              <Controller
                control={control}
                name="last_name"
                rules={{required: 'Last name is required'}}
                render={({field: {onChange, onBlur, value}}) => (
                  <View
                    className={`flex flex-row items-center border ${errors.last_name ? 'border-red-600' : 'border-[#ccc]'} bg-white mb-1.5 rounded-md px-2 py-3`}>
                    <User color="#9ca3af" size={18} />
                    <TextInput
                      className="w-full ml-2"
                      autoCapitalize="none"
                      placeholderTextColor="#9ca3af"
                      placeholder="Last name"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                  </View>
                )}
              />
              {errors.last_name && (
                <Text className="text-red-600">{errors.last_name.message}</Text>
              )}
            </View>

            <View>
              <Controller
                control={control}
                name="email"
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: 'Invalid email address',
                  },
                }}
                render={({field: {onChange, onBlur, value}}) => (
                  <View
                    className={`flex flex-row items-center border ${errors.email ? 'border-red-600' : 'border-[#ccc]'} bg-white mb-1.5 rounded-md px-2 py-3`}>
                    <Mail color="#9ca3af" size={18} />
                    <TextInput
                      className="w-full ml-2"
                      autoCapitalize="none"
                      placeholderTextColor="#9ca3af"
                      placeholder="Email"
                      keyboardType="email-address"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                  </View>
                )}
              />
              {errors.email && (
                <Text className="text-red-600">{errors.email.message}</Text>
              )}
            </View>

            <View>
              <Controller
                control={control}
                name="password"
                rules={{
                  required: 'Password is required',
                  minLength: {value: 6, message: 'Min length is 6'},
                }}
                render={({field: {onChange, onBlur, value}}) => (
                  <View
                    className={`flex flex-row items-center border ${errors.password ? 'border-red-600' : 'border-[#ccc]'} bg-white mb-1.5 rounded-md px-2 py-3`}>
                    <LockKeyhole color="#9ca3af" size={18} />
                    <TextInput
                      className="w-full ml-2"
                      autoCapitalize="none"
                      placeholderTextColor="#9ca3af"
                      placeholder="Password"
                      secureTextEntry
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                  </View>
                )}
              />
              {errors.password && (
                <Text className="text-red-600">{errors.password.message}</Text>
              )}
            </View>

            <View>
              <Controller
                control={control}
                name="confirm_password"
                rules={{
                  required: 'Please confirm your password',
                  validate: value =>
                    value === password || 'Passwords do not match',
                }}
                render={({field: {onChange, onBlur, value}}) => (
                  <View
                    className={`flex flex-row items-center border ${errors.first_name ? 'border-red-600' : 'border-[#ccc]'} bg-white mb-1.5 rounded-md px-2 py-3`}>
                    <LockKeyhole color="#9ca3af" size={18} />
                    <TextInput
                      className="w-full ml-2"
                      autoCapitalize="none"
                      placeholderTextColor="#9ca3af"
                      placeholder="Confirm Password"
                      secureTextEntry
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                  </View>
                )}
              />
              {errors.confirm_password && (
                <Text className="text-red-600">
                  {errors.confirm_password.message}
                </Text>
              )}
            </View>
          </View>
          <Text className="w-full">
            By signing up, you agree to our{' '}
            <Text className="text-brand">Terms and Conditions</Text> and{' '}
            <Text className="text-brand">Privacy Policy.</Text>
          </Text>
        </View>
        <View className="w-full flex-1 flex-col space-y-4 items-center">
          <PrimaryButton title="Sign Up" onPress={handleSubmit(onSubmit)} />

          <Text className="text-center text-light-gray text-sm">
            Or Sign Up with
          </Text>

          <View className="flex flex-row justify-center items-center space-x-6 mt-2">
            <Pressable className="flex flex-row items-center justify-center bg-white border border-gray-300 rounded-full p-3 w-20 h-20">
              <Image
                source={images.google_icon}
                style={{width: 20, height: 20}}
              />
            </Pressable>

            <Pressable className="flex flex-row items-center justify-center bg-white border border-gray-300 rounded-full p-3 w-20 h-20">
              <Image source={images.fb_icon} style={{width: 20, height: 20}} />
            </Pressable>

            <Pressable className="flex flex-row items-center justify-center bg-white border border-gray-300 rounded-full p-3 w-20 h-20">
              <Image
                source={images.apple_icon}
                style={{width: 20, height: 20}}
              />
            </Pressable>
          </View>

          <Text className="w-full text-center self-end items-center">
            Already have an account?
            {/* <Pressable onPress={() => navigation.navigate('Login')}> */}
              <Text className="text-brand">{" "}Log In</Text>
            {/* </Pressable> */}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUp;
