import {useNavigation} from '@react-navigation/native';
import {Bell, ChevronLeft, Trash, User} from 'lucide-react-native';
import React, {useEffect, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {goBack} from '../../utils/navigation';
import PrimaryButton from '../../components/molecules/PrimaryButton';
import AppSwitch from '../../components/molecules/AppSwitch';
import AuthService from '../../services/AuthService';
import UserService from '../../services/UserService';
import {useUserContext} from '../../context/UserContext';

const SecurityPrivacy = () => {
  const navigation = useNavigation();
  const {logoutUser} = useUserContext();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [twoFactor, setTwoFactor] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const hasPasswordInput =
    currentPassword.length > 0 ||
    newPassword.length > 0 ||
    confirmPassword.length > 0;

  useEffect(() => {
    UserService.getProfile()
      .then(res => setMarketingEmails(res.data.marketing_emails))
      .catch(() => {});
  }, []);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Toast.show({type: 'error', text1: 'Fill in all password fields'});
      return;
    }
    if (newPassword.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'New password must be at least 6 characters',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({type: 'error', text1: 'Passwords do not match'});
      return;
    }
    setIsUpdating(true);
    try {
      await AuthService.updatePassword(
        currentPassword,
        newPassword,
        confirmPassword,
      );
      Toast.show({type: 'success', text1: 'Password updated'});
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not update password',
        text2: err.response?.data?.message || err.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleMarketing = async (value: boolean) => {
    setMarketingEmails(value);
    try {
      await UserService.updateProfile({marketing_emails: value});
    } catch {
      setMarketingEmails(!value);
      Toast.show({type: 'error', text1: 'Could not update preference'});
    }
  };

  const handleToggleTwoFactor = (value: boolean) => {
    if (value) {
      Toast.show({type: 'info', text1: 'Two-factor authentication coming soon'});
    }
    setTwoFactor(false);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your account, designs, and notes. This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.deleteAccount();
              Toast.show({type: 'success', text1: 'Account deleted'});
              await logoutUser();
            } catch (err: any) {
              Toast.show({
                type: 'error',
                text1: 'Could not delete account',
                text2: err.response?.data?.message || err.message,
              });
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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

        {/* PASSWORD */}
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
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor="#2C2C2C80"
            secureTextEntry
            autoCapitalize="none"
          />
          <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444]">
            New Password
          </Text>
          <TextInput
            className="border border-[#F1EADC]  rounded-lg py-2.5 px-3 mb-3 text-[14px] text-[#333]"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            placeholderTextColor="#2C2C2C80"
            secureTextEntry
            autoCapitalize="none"
          />

          <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444]">
            Confirm Password
          </Text>
          <TextInput
            className="border border-[#F1EADC]  rounded-lg py-2.5 px-3 mb-3 text-[14px] text-[#333]"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            placeholderTextColor="#2C2C2C80"
            secureTextEntry
            autoCapitalize="none"
          />

          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-[14px] text-[#333] font-dm-sans">
              Two-factor authentication
            </Text>
            <AppSwitch value={twoFactor} onValueChange={handleToggleTwoFactor} />
          </View>

          {hasPasswordInput && (
            <View className="my-5">
              <PrimaryButton
                title={isUpdating ? 'Updating...' : 'Update Password'}
                onPress={handleUpdatePassword}
              />
            </View>
          )}
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
            <AppSwitch
              value={marketingEmails}
              onValueChange={handleToggleMarketing}
            />
          </View>
        </View>

        <View className="bg-transparent border-[1.5px] border-[#D21616] rounded-2xl p-4 mb-5">
          <TouchableOpacity
            className="flex-row justify-center items-center gap-3"
            onPress={handleDeleteAccount}>
            <Trash size={18} color="#D21616" />
            <Text className="text-[#D21616] font-semibold text-[16px]">
              Delete My Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SecurityPrivacy;
