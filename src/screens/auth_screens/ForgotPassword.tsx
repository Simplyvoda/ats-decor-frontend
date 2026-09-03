import {ChevronLeft, Mail} from 'lucide-react-native';
import React, {useState} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import PrimaryButton from '../../components/molecules/PrimaryButton';
import {goBack} from '../../utils/navigation';
import AuthService from '../../services/AuthService';

type FormData = {
  email: string;
};

const ForgotPassword = () => {
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm<FormData>({defaultValues: {email: ''}});

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await AuthService.forgotPassword(data.email);
      setSent(true);
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
          Forgot Password
        </Text>
      </View>

      {sent ? (
        <View className="my-8 items-center">
          <Text className="cormorant text-2xl text-center mb-2">
            Check your email
          </Text>
          <Text className="text-center text-light-gray text-lg">
            We've sent a password reset link to your email. Tap the link on
            this device to set a new password.
          </Text>
        </View>
      ) : (
        <View className="my-5">
          <Text className="cormorant text-2xl">Reset your password</Text>
          <Text className="text-left text-light-gray text-lg">
            Enter the email on your account and we'll send you a link to
            reset your password.
          </Text>

          <View className="py-5">
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

          <PrimaryButton
            title="Send Reset Link"
            onPress={handleSubmit(onSubmit)}
            isSubmitting={isSubmitting}
          />
        </View>
      )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;
