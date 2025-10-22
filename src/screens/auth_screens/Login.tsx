import {ChevronLeft, LockKeyhole, Mail} from 'lucide-react-native';
import React from 'react';
import {Controller, useForm} from 'react-hook-form';
import {Pressable, ScrollView, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import PrimaryButton from '../../components/molecules/PrimaryButton';
import {goBack} from '../../utils/navigation';
import {useNavigation} from '@react-navigation/native';

type FormData = {
  email: string;
  password: string;
};

const Login = () => {
  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm<FormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const navigation = useNavigation();

  const onSubmit = (data: FormData) => {
    console.log('Form data:', data);
  };

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
            Log In
          </Text>
        </View>

        <View className="my-5">
          <Text className="cormorant text-2xl">Welcome Back!</Text>
          <Text className="text-left text-light-gray text-lg">
            Please enter your details to proceed.
          </Text>

          <View className="flex flex-col gap-5 py-5 justify-center">
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
          </View>
          <Text className="w-full text-right">Forgot password ?</Text>
        </View>
        <View className="w-full flex-1 flex-col space-y-4 mt-20 items-center">
          <PrimaryButton title="Log In" onPress={handleSubmit(onSubmit)} />

          <Text className="w-full text-center self-end">
            Don't have an account?
            <Pressable onPress={() => navigation.navigate('SignUp')}>
              <Text className="text-brand">Sign Up</Text>
            </Pressable>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Login;
