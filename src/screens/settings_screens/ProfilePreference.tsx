import {useNavigation} from '@react-navigation/native';
import {
  ActivityIndicator,
  Bell,
  Camera,
  ChevronLeft,
  Globe,
  Palette,
  Sun,
  User,
} from 'lucide-react-native';
import React, {useEffect, useState} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {
  Image,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {goBack} from '../../utils/navigation';
import {Dropdown} from 'react-native-element-dropdown';
import Toast from 'react-native-toast-message';
import {useUserContext} from '../../context/UserContext';
import PrimaryButton from '../../components/molecules/PrimaryButton';

type FormData = {
  first_name?: string;
  last_name?: string;
  email?: string;
  bio?: string;
};

const ProfilePreference = () => {
  const navigation = useNavigation();
  const {user, isLoadingUser, updateUser} = useUserContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotif, setPushNotif] = useState(false);
  const [emailNotif, setEmailNotif] = useState(false);
  const [language, setLanguage] = useState('English');

  const {
    control,
    reset,
    handleSubmit,
    formState: {errors},
  } = useForm<FormData>({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      bio: '',
    },
  });

  const languageData = [
    {label: 'English', value: 'English'},
    {label: 'French', value: 'French'},
    {label: 'Spanish', value: 'Spanish'},
  ];

  // Reset form when user data is loaded
  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        bio: user.bio || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await updateUser(data);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile updated successfully',
        position: 'bottom',
      });
    } catch (err: any) {
      console.log('Error updating profile:', err.response?.data || err.message);
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

  if (isLoadingUser) {
    return (
      <SafeAreaView className="flex-1 bg-offWhite items-center justify-center">
        <ActivityIndicator size="large" color="#C4A663" />
      </SafeAreaView>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-offWhite px-5 pt-[70px]"
      contentContainerStyle={{paddingBottom: 40}}
      showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View className="flex-row items-center mb-6 gap-3">
        <ChevronLeft
          className="text-[#2C2C2C]"
          size={24}
          onPress={() => goBack(navigation)}
        />
        <Text className="text-[20px] ml-5 font-semibold text-[#1A1A1A] font-cormorant">
          Profile & Preferences
        </Text>
      </View>

      {/* PROFILE INFO */}
      <View className="bg-white border-[1px] border-[#2C2C2C33] rounded-2xl p-4 mb-5">
        <View className="flex-row items-center gap-2 mb-3">
          <User size={18} color="#C4A663" />
          <Text className="text-[20px] font-semibold text-[#1A1A1A] font-cormorant">
            Profile Information
          </Text>
        </View>

        {/* PROFILE INFO */}
        <View className="relative items-center justify-center my-3">
          {/* Avatar image */}
          <Image
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/512/147/147144.png',
            }}
            className="w-20 h-20 rounded-full"
          />

          {/* Dark overlay */}
          <View className="absolute inset-0 bg-black/50 rounded-full" />

          {/* Centered camera icon */}
          <TouchableOpacity className="absolute inset-0 items-center justify-center">
            <View className="p-2 rounded-full">
              <Camera size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444]">
          First Name
        </Text>
        <Controller
          control={control}
          name="first_name"
          rules={{
            required: 'First name is required',
          }}
          render={({field: {onChange, onBlur, value}}) => (
            <View>
              <TextInput
                className="border border-[#F1EADC] rounded-lg py-2.5 px-3 mb-1 text-[14px] text-[#333]"
                placeholder="John"
                placeholderTextColor="#2C2C2C80"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
              />
              {errors.first_name && (
                <Text className="text-red-600 text-sm mb-3">
                  {errors.first_name.message}
                </Text>
              )}
            </View>
          )}
        />

        <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444]">
          Last Name
        </Text>
        <Controller
          control={control}
          name="last_name"
          rules={{
            required: 'Last name is required',
          }}
          render={({field: {onChange, onBlur, value}}) => (
            <View>
              <TextInput
                className="border border-[#F1EADC] rounded-lg py-2.5 px-3 mb-1 text-[14px] text-[#333]"
                placeholder="Doe"
                placeholderTextColor="#2C2C2C80"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
              />
              {errors.last_name && (
                <Text className="text-red-600 text-sm mb-3">
                  {errors.last_name.message}
                </Text>
              )}
            </View>
          )}
        />

        <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444]">
          Email
        </Text>
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
            <View>
              <TextInput
                className="border border-[#F1EADC] rounded-lg py-2.5 px-3 mb-1 text-[14px] text-[#333]"
                placeholder="john.doe@email.com"
                placeholderTextColor="#2C2C2C80"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && (
                <Text className="text-red-600 text-sm mb-3">
                  {errors.email.message}
                </Text>
              )}
            </View>
          )}
        />

        <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444]">
          Bio
        </Text>
        <Controller
          control={control}
          name="bio"
          render={({field: {onChange, onBlur, value}}) => (
            <TextInput
              className="border border-[#F1EADC] rounded-lg py-2.5 px-3 mb-3 text-[14px] text-[#333]"
              placeholder="Interior design enthusiast"
              placeholderTextColor="#2C2C2C80"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              multiline
              numberOfLines={3}
            />
          )}
        />
      </View>

      {/* LANGUAGE & REGION */}
      <View className="bg-white border-[1px] border-[#2C2C2C33]  rounded-2xl p-4 mb-5">
        <View className="flex-row items-center gap-2 mb-3">
          <Globe size={18} color="#C4A663" />
          <Text className="text-[20px] font-semibold font-cormorant text-[#1A1A1A]">
            Language & Region
          </Text>
        </View>

        <Text className="text-[14px] font-dm-sans font-medium mt-1 mb-2 text-[#444]">
          Language
        </Text>
        <Dropdown
          data={languageData}
          labelField="label"
          valueField="value"
          placeholder="Select language"
          value={language}
          onChange={item => setLanguage(item.value)}
          style={{
            borderWidth: 1,
            borderColor: '#F1EADC',
            borderRadius: 8,
            paddingVertical: 10,
            paddingHorizontal: 12,
          }}
          placeholderStyle={{
            color: '#2C2C2C80',
            fontSize: 14,
          }}
          selectedTextStyle={{
            color: '#333',
            fontSize: 14,
          }}
        />
      </View>

      {/* NOTIFICATIONS */}
      <View className="bg-white border-[1px] border-[#2C2C2C33] rounded-2xl p-4 mb-5">
        <View className="flex-row items-center gap-2 mb-3">
          <Bell size={18} color="#C4A663" />
          <Text className="text-[20px] font-semibold font-cormorant text-[#1A1A1A]">
            Notification
          </Text>
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-[14px] text-[#333] font-dm-sans">
            Push Notifications
          </Text>
          <Switch value={pushNotif} onValueChange={setPushNotif} />
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="text-[14px] text-[#333] font-dm-sans">
            Email Notifications
          </Text>
          <Switch value={emailNotif} onValueChange={setEmailNotif} />
        </View>
      </View>

      {/* APPEARANCE */}
      <View className="bg-white border-[1px] border-[#2C2C2C33]  rounded-2xl p-4 mb-5">
        <View className="flex-row items-center gap-2 mb-3">
          <Sun size={18} color="#C4A663" />
          <Text className="text-[20px] font-semibold font-cormorant text-[#1A1A1A]">
            Appearance
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="text-[14px] text-[#333] font-dm-sans">
            Dark Mode
          </Text>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>
      </View>

      {/* DESIGN STYLE */}
      <View className="bg-white border-[1px] border-[#2C2C2C33] rounded-2xl p-4 mb-5">
        <View className="flex-row items-center gap-2 mb-3">
          <Palette size={18} color="#C4A663" />
          <Text className="text-[20px] font-semibold font-cormorant text-[#1A1A1A]">
            Design Style
          </Text>
        </View>

        <Text className="text-[14px] font-dm-sans font-medium mt-1 mb-2 text-[#444]">
          Add Personal Design Style
        </Text>
        <Controller
          control={control}
          name="design_style"
          render={({field: {onChange, onBlur, value}}) => (
            <TextInput
              className="border border-[#F1EADC] bg-[#FFFDF8] rounded-lg py-2.5 px-3 text-[14px]"
              placeholder="e.g. tech minimalist, bohemian, Scandinavian..."
              placeholderTextColor="#2C2C2C80"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
            />
          )}
        />
      </View>

      {/* SAVE BUTTON */}
      <PrimaryButton
        title="Save Changes"
        onPress={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
      />
    </ScrollView>
  );
};

export default ProfilePreference;
