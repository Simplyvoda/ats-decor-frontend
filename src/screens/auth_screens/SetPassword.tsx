import {LockKeyhole} from 'lucide-react-native';
import React, {useState} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import PrimaryButton from '../../components/molecules/PrimaryButton';
import {navigateTo} from '../../utils/navigation';
import AuthService from '../../services/AuthService';

type SetPasswordRouteParams = {
  SetPassword: {accessToken?: string};
};

type FormData = {
  password: string;
  confirmPassword: string;
};

const SetPassword = () => {
  const navigation = useNavigation();
  const route =
    useRoute<RouteProp<SetPasswordRouteParams, 'SetPassword'>>();
  const accessToken = route.params?.accessToken;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    control,
    handleSubmit,
    watch,
    formState: {errors},
  } = useForm<FormData>({defaultValues: {password: '', confirmPassword: ''}});

  const password = watch('password');

  const onSubmit = async (data: FormData) => {
    if (!accessToken) {
      Toast.show({
        type: 'error',
        text1: 'This reset link is invalid or has expired',
        text2: 'Request a new one from the Forgot Password screen.',
        position: 'bottom',
      });
      return;
    }
    try {
      setIsSubmitting(true);
      await AuthService.resetPassword(accessToken, data.password);
      Toast.show({
        type: 'success',
        text1: 'Password updated',
        text2: 'Please log in with your new password',
        position: 'bottom',
      });
      navigateTo(navigation, 'Login');
    } catch (err: any) {
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

  return (
    <SafeAreaView className="h-screen p-6 bg-offWhite">
      <View className="relative flex items-center justify-center my-2">
        <Text className="text-xl font-semibold text-gray-primary">
          Set New Password
        </Text>
      </View>

      <View className="my-5">
        <Text className="cormorant text-2xl">Choose a new password</Text>
        <Text className="text-left text-light-gray text-lg">
          Please enter and confirm your new password below.
        </Text>

        <View className="flex flex-col gap-5 py-5">
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
                    placeholder="New password"
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
              name="confirmPassword"
              rules={{
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match',
              }}
              render={({field: {onChange, onBlur, value}}) => (
                <View
                  className={`flex flex-row items-center border ${errors.confirmPassword ? 'border-red-600' : 'border-[#ccc]'} bg-white mb-1.5 rounded-md px-2 py-3`}>
                  <LockKeyhole color="#9ca3af" size={18} />
                  <TextInput
                    className="w-full ml-2"
                    autoCapitalize="none"
                    placeholderTextColor="#9ca3af"
                    placeholder="Confirm new password"
                    secureTextEntry
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />
            {errors.confirmPassword && (
              <Text className="text-red-600">
                {errors.confirmPassword.message}
              </Text>
            )}
          </View>
        </View>

        <PrimaryButton
          title="Update Password"
          onPress={handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
        />
      </View>
    </SafeAreaView>
  );
};

export default SetPassword;
