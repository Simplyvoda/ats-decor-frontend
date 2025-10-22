import {useNavigation} from '@react-navigation/native';
import {
  Bell,
  Camera,
  ChevronLeft,
  Globe,
  Palette,
  Sun,
  User,
} from 'lucide-react-native';
import React, {useState} from 'react';
import {
  Image,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {goBack} from '../../utils/navigation';
import {Dropdown} from 'react-native-element-dropdown';

const ProfilePreference = () => {
  const navigation = useNavigation();
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotif, setPushNotif] = useState(false);
  const [emailNotif, setEmailNotif] = useState(false);
  const [language, setLanguage] = useState('English');

  const languageData = [
    {label: 'English', value: 'English'},
    {label: 'French', value: 'French'},
    {label: 'Spanish', value: 'Spanish'},
  ];

  return (
    // <SafeAreaView className='flex-1  bg-offWhite'>
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
        <Text className="text-[20px] font-semibold text-[#1A1A1A] font-cormorant">
          Profile & Preferences
        </Text>
      </View>

      {/* PROFILE INFO */}
      <View className="bg-white  border-[1px] border-[#2C2C2C33]  rounded-2xl p-4 mb-5">
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
          Full Name
        </Text>
        <TextInput
          className="border border-[#F1EADC]  rounded-lg py-2.5 px-3 mb-3 text-[14px] text-[#333]"
          placeholder="Ahmad Fola"
          placeholderTextColor="#2C2C2C80"
        />

        <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444]">
          Email
        </Text>
        <TextInput
          className="border border-[#F1EADC]  rounded-lg py-2.5 px-3 mb-3 text-[14px] text-[#333]"
          placeholder="ahmad.fola@gmail.com"
          placeholderTextColor="#2C2C2C80"
        />

        <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444]">
          Bio
        </Text>
        <TextInput
          className="border border-[#F1EADC]  rounded-lg py-2.5 px-3 mb-3 text-[14px] text-[#333]"
          placeholder="Interior design enthusiast"
          placeholderTextColor="#2C2C2C80"
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
        <TextInput
          className="border border-[#F1EADC] bg-[#FFFDF8] rounded-lg py-2.5 px-3 text-[14px]"
          placeholder="e.g. tech minimalist, bohemian, Scandinavian..."
          placeholderTextColor="#2C2C2C80"
        />
      </View>

      {/* SAVE BUTTON */}
      <TouchableOpacity className="bg-[#C4A663] rounded-xl py-4 items-center mt-2">
        <Text className="text-white font-semibold text-[16px]">
          Save Changes
        </Text>
      </TouchableOpacity>
    </ScrollView>
    // </SafeAreaView>
  );
};

export default ProfilePreference;
