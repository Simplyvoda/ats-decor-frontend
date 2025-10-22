import {View, Text, TextInput, ScrollView, TouchableOpacity} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {goBack, navigateTo} from '../../utils/navigation';
import {useNavigation} from '@react-navigation/native';
import {
  ChevronLeft,
  Search,
  User,
  ShoppingCart,
  Shield,
  HelpCircle,
} from 'lucide-react-native';
import {Image} from 'react-native';
import {images} from '../../../assets/constants/images';

const InitialScreen = () => {
  const navigation = useNavigation();

  const iconMap = {
    User,
    ShoppingCart,
    Shield,
    HelpCircle,
  };

  const settings_data = [
    {
      icon: 'User',
      title: 'Profile & Preference',
      subtitle: 'Personal info, account settings, preferences',
      tags: [
        'Edit profile',
        'Account Settings',
        'Language & Region',
        '+1 more',
      ],
      screen: 'ProfilePreferences',
    },
    {
      icon: 'ShoppingCart',
      title: 'Shopping',
      subtitle: 'Purchase and payment settings',
      tags: [
        'Payment Methods',
        'Subscription Plan',
        'Purchase History',
        '+1 more',
      ],
      screen: 'Shopping',
    },
    {
      icon: 'Shield',
      title: 'Security & Privacy',
      subtitle: 'Protect your account and data',
      tags: ['Privacy Settings', 'Data Export', 'Account Security', '+1 more'],
      screen: 'SecurityPrivacy',
    },
    {
      icon: 'HelpCircle',
      title: 'Help & Feedback',
      subtitle: 'Get Support & Share Feedback',
      tags: ['FAQs', 'Contact Support', 'Send Feedback', '+1 more'],
      screen: 'HelpFeedback',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-offWhite gap-5">
      <View className="bg-brand h-32 w-full flex flex-row justify-start  items-center pl-5">
        <ChevronLeft
          className="text-white"
          size={24}
          onPress={() => goBack(navigation)}
        />

        <View className="flex flex-row justify-start items-center px-2">
          {/* image */}
          <Image
            source={images.placeholder_icon}
            className="w-12 h-12 rounded-full"
          />
          {/* flex with text */}
          <View className="text-white flex flex-col ml-4">
            <Text className="text-white text-2xl font-cormorant">
              Ahmad Fola
            </Text>
            <Text className="text-white text-sm font-dm-sans">
              Manage your All Things Snug
            </Text>
            <Text className="text-white text-sm font-dm-sans">experience</Text>
          </View>
        </View>
      </View>

      <ScrollView className="py-6 px-5 flex-col space-y-5">
        <View className="flex flex-row items-center border border-[#2C2C2C1A] bg-white mb-1.5 rounded-md px-2 py-3 font-dm-sans">
          <Search color="#9ca3af" size={18} />
          <TextInput
            className="w-full ml-2"
            autoCapitalize="none"
            placeholderTextColor="#9ca3af"
            placeholder="Search settings"
          />
        </View>
        {settings_data.map((section, i) => {
          const Icon = iconMap[section?.icon as keyof typeof iconMap];
          return (
            <TouchableOpacity
              key={i}
              onPress={() => navigateTo(navigation, section.screen)}
              className="w-full border-[1px] border-[#2C2C2C33] rounded-[16px] flex flex-row h-[196px] p-6">
              <View className="bg-[#C1A36A26] w-[42px] h-[39px] rounded-md flex items-center justify-center">
                <Icon color="#C1A36A" size={18} />
              </View>

              <View className="text-white flex flex-col ml-4 space-y-2">
                <Text className="text-[#2C2C2C] text-2xl font-cormorant">
                  {section.title}
                </Text>
                <Text className="text-[#2C2C2C] text-sm font-dm-sans">
                  {section.subtitle}
                </Text>

                <View className="flex flex-row gap-2 flex-wrap w-full">
                  {section.tags.map((each, idx) => {
                    return (
                      <View
                        key={idx}
                        className="bg-[#2C2C2C0D] rounded-[10px] self-start w-auto p-1">
                        <Text className="text-[#2C2C2C80] text-sm font-dm-sans ">
                          {each}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default InitialScreen;
