import {useNavigation} from '@react-navigation/native';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Trash,
  User,
} from 'lucide-react-native';
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
import {openLegal} from '../../utils/openLegal';
import {appleAuth} from '@invertase/react-native-apple-authentication';
import PrimaryButton from '../../components/molecules/PrimaryButton';
import AppSwitch from '../../components/molecules/AppSwitch';
import AuthService from '../../services/AuthService';
import UserService from '../../services/UserService';
import {
  isAnalyticsEnabled,
  setAnalyticsEnabled,
} from '../../services/analytics';
import {useUserContext} from '../../context/UserContext';
import {
  isStrongPassword,
  PASSWORD_REQUIREMENTS_MESSAGE,
} from '../../utils/passwordValidation';
import {useTheme} from '../../theme/useTheme';

const EMPTY_PASSWORDS = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const SecurityPrivacy = () => {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const {logoutUser} = useUserContext();

  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
  const {currentPassword, newPassword, confirmPassword} = passwords;
  const setPassword = (field: keyof typeof EMPTY_PASSWORDS) => (value: string) =>
    setPasswords(p => ({...p, [field]: value}));
  const [isUpdating, setIsUpdating] = useState(false);

  // The privacy switches below.
  const [{marketingEmails, analytics}, setPrefs] = useState({
    marketingEmails: false,
    analytics: true,
  });

  const hasPasswordInput =
    currentPassword.length > 0 ||
    newPassword.length > 0 ||
    confirmPassword.length > 0;

  useEffect(() => {
    isAnalyticsEnabled().then(enabled =>
      setPrefs(p => ({...p, analytics: enabled})),
    );
  }, []);

  const handleToggleAnalytics = (value: boolean) => {
    setPrefs(p => ({...p, analytics: value}));
    setAnalyticsEnabled(value);
  };

  useEffect(() => {
    UserService.getProfile()
      .then(res =>
        setPrefs(p => ({...p, marketingEmails: res.data.marketing_emails})),
      )
      .catch(() => {});
  }, []);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Toast.show({type: 'error', text1: 'Fill in all password fields'});
      return;
    }
    if (!isStrongPassword(newPassword)) {
      Toast.show({
        type: 'error',
        text1: 'Password too weak',
        text2: PASSWORD_REQUIREMENTS_MESSAGE,
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
      setPasswords(EMPTY_PASSWORDS);
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
    setPrefs(p => ({...p, marketingEmails: value}));
    try {
      await UserService.updateProfile({marketing_emails: value});
    } catch {
      setPrefs(p => ({...p, marketingEmails: !value}));
      Toast.show({type: 'error', text1: 'Could not update preference'});
    }
  };

  const handleToggleTwoFactor = (value: boolean) => {
    if (value) {
      Toast.show({
        type: 'info',
        text1: 'Two-factor authentication coming soon',
      });
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your account and everything in it: rooms, scans, designs (including ones you shared to Explore), notes, mood boards and saved designs. This cannot be undone.\n\nIf you subscribe through the App Store, cancel in your Apple ID settings too, or Apple will keep billing you.\n\nIf you signed in with Apple, you’ll be asked to confirm with Apple.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            // Sign in with Apple accounts confirm with Apple once more, so
            // the server can revoke the app's access to their Apple ID.
            let appleCode: string | undefined;
            try {
              const profile = await UserService.getProfile();
              if (profile.data.sso_type === 'apple') {
                const res = await appleAuth.performRequest({
                  requestedOperation: appleAuth.Operation.LOGIN,
                  requestedScopes: [],
                });
                appleCode = res.authorizationCode ?? undefined;
              }
            } catch (err: any) {
              if (err?.code === appleAuth.Error.CANCELED) {
                // They backed out of the Apple prompt: don't delete.
                return;
              }
              // Anything else: delete anyway; the server logs the missed
              // revoke.
            }
            try {
              await AuthService.deleteAccount(appleCode);
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
        className="flex-1 bg-offWhite dark:bg-night px-5 pt-[70px]"
        contentContainerStyle={{paddingBottom: 40}}
        showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View className="flex-row items-center mb-6 gap-3">
          <ChevronLeft
            className="text-[#2C2C2C] dark:text-night-text"
            size={24}
            onPress={() => goBack(navigation)}
          />
          <Text className="text-[20px] ml-5 font-semibold text-[#1A1A1A] dark:text-night-text-primary font-cormorant">
            Security & Privacy
          </Text>
        </View>

        {/* PASSWORD */}
        <View className="bg-transparent border-[1px] border-[#2C2C2C33] dark:border-night-border rounded-2xl p-4 mb-5">
          <View className="flex-row items-center gap-2 mb-5">
            <User size={18} color={colors.brand} />
            <Text className="text-[20px] font-semibold text-[#1A1A1A] dark:text-night-text-primary font-cormorant">
              Password & Security
            </Text>
          </View>

          <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444] dark:text-night-text-secondary">
            Current Password
          </Text>
          <TextInput
            className="border border-[#F1EADC] dark:border-night-border rounded-lg py-2.5 px-3 mb-3 text-[14px] text-[#333] dark:text-night-text"
            value={currentPassword}
            onChangeText={setPassword('currentPassword')}
            placeholder="Enter current password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
          />
          <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444] dark:text-night-text-secondary">
            New Password
          </Text>
          <TextInput
            className="border border-[#F1EADC] dark:border-night-border rounded-lg py-2.5 px-3 mb-3 text-[14px] text-[#333] dark:text-night-text"
            value={newPassword}
            onChangeText={setPassword('newPassword')}
            placeholder="Enter new password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444] dark:text-night-text-secondary">
            Confirm Password
          </Text>
          <TextInput
            className="border border-[#F1EADC] dark:border-night-border rounded-lg py-2.5 px-3 mb-3 text-[14px] text-[#333] dark:text-night-text"
            value={confirmPassword}
            onChangeText={setPassword('confirmPassword')}
            placeholder="Re-enter new password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
          />

          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-[14px] text-[#333] dark:text-night-text font-dm-sans">
              Two-factor authentication
            </Text>
            <AppSwitch
              // Not built yet: always off, and turning it on just says so.
              value={false}
              onValueChange={handleToggleTwoFactor}
            />
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
        <View className="bg-transparent border-[1px] border-[#2C2C2C33] dark:border-night-border rounded-2xl p-4 mb-5">
          <View className="flex-row items-center gap-2 mb-3">
            <Bell size={18} color={colors.brand} />
            <Text className="text-[20px] font-semibold font-cormorant text-[#1A1A1A] dark:text-night-text-primary">
              Privacy Settings
            </Text>
          </View>

          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-[14px] text-[#333] dark:text-night-text font-dm-sans">
              Marketing Emails
            </Text>
            <AppSwitch
              value={marketingEmails}
              onValueChange={handleToggleMarketing}
            />
          </View>

          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-1 mr-3">
              <Text className="text-[14px] text-[#333] dark:text-night-text font-dm-sans">
                Share usage analytics
              </Text>
              <Text className="text-[12px] text-[#999] dark:text-night-text-muted font-dm-sans mt-0.5">
                Stats on how features are used, to help us improve the app.
              </Text>
            </View>
            <AppSwitch
              value={analytics}
              onValueChange={handleToggleAnalytics}
            />
          </View>

          <TouchableOpacity
            className="flex-row justify-between items-center py-2.5 border-t-[1px] border-[#2C2C2C1A] dark:border-night-border"
            onPress={() => (navigation as any).navigate('BlockedUsers')}>
            <Text className="text-[14px] text-[#333] dark:text-night-text font-dm-sans">
              Blocked users
            </Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* The documents live on the website and open in an in-app
              browser, so they're always the current version. */}
          {(
            [
              ['privacy', 'Privacy Policy'],
              ['terms', 'Terms of Use'],
              ['credits', 'Credits & licences'],
            ] as const
          ).map(([doc, label]) => (
            <TouchableOpacity
              key={doc}
              className="flex-row justify-between items-center py-2.5 border-t-[1px] border-[#2C2C2C1A] dark:border-night-border"
              accessibilityRole="link"
              onPress={() => openLegal(doc)}>
              <Text className="text-[14px] text-[#333] dark:text-night-text font-dm-sans">
                {label}
              </Text>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <View className="bg-transparent border-[1.5px] border-[#D21616] rounded-2xl p-4 mb-5">
          <TouchableOpacity
            className="flex-row justify-center items-center gap-3"
            onPress={handleDeleteAccount}>
            <Trash size={18} color={colors.danger} />
            <Text className="text-[#D21616] dark:text-[#FF6B6B] font-semibold text-[16px]">
              Delete My Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SecurityPrivacy;
