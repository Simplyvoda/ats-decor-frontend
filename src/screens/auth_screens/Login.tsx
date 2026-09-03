import {ChevronLeft, Eye, EyeOff, LockKeyhole, Mail} from 'lucide-react-native';
import React, {useState} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {appleAuth} from '@invertase/react-native-apple-authentication';
import PrimaryButton from '../../components/molecules/PrimaryButton';
import {goBack, navigateTo} from '../../utils/navigation';
import {useNavigation} from '@react-navigation/native';
import {images} from '../../../assets/constants/images';

import Toast from 'react-native-toast-message';
import {
  ISignInPayload,
  ISignInResponse,
} from '../../../interface/auth_user.interface';
import AuthService from '../../services/AuthService';
import {useUserContext} from '../../context/UserContext';

type FormData = {
  email: string;
  password: string;
};

const Login = () => {
  const {signInUser} = useUserContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAppleSubmitting, setIsAppleSubmitting] = useState(false);
  const {
    control,
    reset,
    handleSubmit,
    formState: {errors},
  } = useForm<FormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const navigation = useNavigation();

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      const res: ISignInResponse = await AuthService.signIn({
        email: data.email,
        password: data.password,
      } as ISignInPayload);
      await signInUser(res);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Login successful',
        position: 'bottom',
      });
      reset();
    } catch (err: any) {
      console.log('Error:', err.response?.data || err.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || err.message,
        position: 'bottom',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Same identity-based flow as SignUp's onApplePress: signInWithIdToken
  // signs in on any repeat tap and creates the account on first use, so
  // this isn't a distinct "login" variant — it's the same action, just
  // also offered here since a returning user reasonably looks for it here.
  const onApplePress = async () => {
    try {
      setIsAppleSubmitting(true);
      const appleResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      if (!appleResponse.identityToken) {
        throw new Error('Apple sign-in did not return an identity token');
      }

      const res = await AuthService.appleSignIn({
        identityToken: appleResponse.identityToken,
        // See SignUp.tsx's onApplePress for why this is required.
        nonce: appleResponse.nonce,
        firstName: appleResponse.fullName?.givenName ?? undefined,
        lastName: appleResponse.fullName?.familyName ?? undefined,
      });

      await signInUser(res);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Signed in with Apple',
        position: 'bottom',
      });
    } catch (err: any) {
      if (err.code === appleAuth.Error.CANCELED) {
        return;
      }
      console.log('Apple sign-in error:', err.response?.data || err.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || err.message,
        position: 'bottom',
      });
    } finally {
      setIsAppleSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="h-screen p-6 bg-offWhite">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
                        className="flex-1 ml-2"
                        autoCapitalize="none"
                        placeholderTextColor="#9ca3af"
                        placeholder="Password"
                        secureTextEntry={!showPassword}
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(s => !s)}
                        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                        {showPassword ? (
                          <EyeOff color="#9ca3af" size={18} />
                        ) : (
                          <Eye color="#9ca3af" size={18} />
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.password && (
                  <Text className="text-red-600">
                    {errors.password.message}
                  </Text>
                )}
              </View>
            </View>
            <Pressable onPress={() => navigateTo(navigation, 'ForgotPassword')}>
              <Text className="w-full text-right text-brand">
                Forgot password ?
              </Text>
            </Pressable>
          </View>
          <View className="w-full flex-1 flex-col space-y-4 mt-20 items-center">
            <PrimaryButton
              title="Log In"
              onPress={handleSubmit(onSubmit)}
              isSubmitting={isSubmitting}
            />

            <Pressable
              onPress={onApplePress}
              disabled={isAppleSubmitting}
              className="w-full flex flex-row items-center justify-center bg-white border border-gray-800 rounded-full py-3 space-x-2">
              <Image
                source={images.apple_icon}
                style={{width: 18, height: 18}}
              />
              <Text className="text-black font-semibold text-base">
                {isAppleSubmitting ? 'Signing in…' : 'Continue with Apple'}
              </Text>
            </Pressable>

            <View className="w-full flex-row justify-center items-center">
              <Text>Don't have an account?</Text>
              <Pressable onPress={() => navigateTo(navigation, 'SignUp')}>
                <Text className="text-brand ml-2">Sign Up</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;
