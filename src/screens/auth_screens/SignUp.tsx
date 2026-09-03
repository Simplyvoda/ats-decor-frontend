import {
  ChevronLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  User,
} from 'lucide-react-native';
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
import PrimaryButton from '../../components/molecules/PrimaryButton';
import {useNavigation} from '@react-navigation/native';
import {goBack, navigateTo} from '../../utils/navigation';
import {images} from '../../../assets/constants/images';
import AuthService from '../../services/AuthService';
import {ISignUpPayload} from '../../../interface/auth_user.interface';
import Toast from 'react-native-toast-message';
import {appleAuth} from '@invertase/react-native-apple-authentication';
import {useUserContext} from '../../context/UserContext';

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
    reset,
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
  const {signInUser} = useUserContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAppleSubmitting, setIsAppleSubmitting] = useState(false);

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
        // The library auto-generates a nonce, SHA256-hashes it into the
        // Apple request, and returns the RAW value here. Supabase needs the
        // raw nonce to verify the hashed claim inside identityToken —
        // omitting it fails with "Passed nonce and nonce in id_token
        // should either both exist or not."
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

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await AuthService.signUp({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
      } as ISignUpPayload);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Sign up successful',
        position: 'bottom',
      });
      Toast.show({
        type: 'info',
        text1: 'Info',
        text2: 'Please check your email for verification',
        position: 'bottom',
      });

      navigateTo(navigation, 'Login');
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
      reset();
    }
  };

  const password = watch('password');

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
                      className="flex-1 ml-2"
                      autoCapitalize="none"
                      placeholderTextColor="#9ca3af"
                      placeholder="Confirm Password"
                      secureTextEntry={!showConfirmPassword}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(s => !s)}
                      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                      {showConfirmPassword ? (
                        <EyeOff color="#9ca3af" size={18} />
                      ) : (
                        <Eye color="#9ca3af" size={18} />
                      )}
                    </TouchableOpacity>
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
            <Text
              className="text-brand"
              onPress={() => (navigation as any).navigate('TermsOfService')}>
              Terms and Conditions
            </Text>{' '}
            and{' '}
            <Text
              className="text-brand"
              onPress={() => (navigation as any).navigate('PrivacyPolicy')}>
              Privacy Policy.
            </Text>
          </Text>
        </View>
        <View className="w-full flex-1 flex-col space-y-4 items-center">
          <PrimaryButton
            title="Sign Up"
            onPress={handleSubmit(onSubmit)}
            isSubmitting={isSubmitting}
          />

          <Text className="text-center text-light-gray text-sm">
            Or Sign Up with
          </Text>

          <View className="w-full mt-2">
            {/* Google and Facebook sign-up disabled for MVP — Apple only for now */}
            {/*
            <View className="flex flex-row justify-center items-center space-x-6">
              <Pressable className="flex flex-row items-center justify-center bg-white border border-gray-300 rounded-full p-3 w-20 h-20">
                <Image
                  source={images.google_icon}
                  style={{width: 20, height: 20}}
                />
              </Pressable>

              <Pressable className="flex flex-row items-center justify-center bg-white border border-gray-300 rounded-full p-3 w-20 h-20">
                <Image source={images.fb_icon} style={{width: 20, height: 20}} />
              </Pressable>
            </View>
            */}

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
          </View>

          <Text className="w-full text-center self-end items-center">
            Already have an account?
            <Text
              className="text-brand"
              onPress={() => navigateTo(navigation, 'Login')}>
              {' '}
              Log In
            </Text>
          </Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;
