import {useNavigation} from '@react-navigation/native';
import {
  Bell,
  Camera,
  ChevronLeft,
  Globe,
  Palette,
  Sun,
  Trash,
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
import PrimaryButton from '../../components/molecules/PrimaryButton';
import AppSwitch from '../../components/molecules/AppSwitch';

const SecurityProvacy = () => {
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
          Security & Privacy
        </Text>
      </View>

      {/* INFO */}
      <View className="bg-transparent  border-[1px] border-[#2C2C2C33]  rounded-2xl p-4 mb-5">
        <View className="flex-row items-center gap-2 mb-5">
          <User size={18} color="#C4A663" />
          <Text className="text-[20px] font-semibold text-[#1A1A1A] font-cormorant">
            Password & Security
          </Text>
        </View>

        <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444]">
          Current Password
        </Text>
        <TextInput
          className="border border-[#F1EADC]  rounded-lg py-2.5 px-3 mb-3 text-[14px] text-[#333]"
          placeholder="Ahmad Fola"
          placeholderTextColor="#2C2C2C80"
        />
        <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444]">
          New Password
        </Text>
        <TextInput
          className="border border-[#F1EADC]  rounded-lg py-2.5 px-3 mb-3 text-[14px] text-[#333]"
          placeholder="Ahmad Fola"
          placeholderTextColor="#2C2C2C80"
        />

        <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444]">
          Confirm Password
        </Text>
        <TextInput
          className="border border-[#F1EADC]  rounded-lg py-2.5 px-3 mb-3 text-[14px] text-[#333]"
          placeholder="ahmad.fola@gmail.com"
          placeholderTextColor="#2C2C2C80"
        />

        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-[14px] text-[#333] font-dm-sans">
            Two-factor authentication
          </Text>
          <AppSwitch value={pushNotif} onValueChange={setPushNotif} />
        </View>

        <View className="my-5">
          <PrimaryButton title="Update Password" onPress={() => {}} />
        </View>
      </View>

      {/* PRIVACY SETTINGS */}
      <View className="bg-transparent border-[1px] border-[#2C2C2C33] rounded-2xl p-4 mb-5">
        <View className="flex-row items-center gap-2 mb-3">
          <Bell size={18} color="#C4A663" />
          <Text className="text-[20px] font-semibold font-cormorant text-[#1A1A1A]">
            Privacy Settings
          </Text>
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-[14px] text-[#333] font-dm-sans">
            Marketing Emails
          </Text>
          <AppSwitch value={pushNotif} onValueChange={setPushNotif} />
        </View>
      </View>

      <View className="bg-transparent border-[1.5px] border-[#D21616] rounded-2xl p-4 mb-5">
        <TouchableOpacity className="flex-row justify-center items-center gap-3">
          <Trash size={18} color="#D21616" />
          <Text className="text-[#D21616] font-semibold text-[16px]">
            Delete My Account
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default SecurityProvacy;
