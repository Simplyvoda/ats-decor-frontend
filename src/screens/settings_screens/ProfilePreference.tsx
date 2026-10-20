import {useNavigation} from '@react-navigation/native';
import {
  Camera,
  ChevronLeft,
  Moon,
  Palette,
  Smartphone,
  Sun,
  User,
} from 'lucide-react-native';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import UserAvatar from '../../components/molecules/UserAvatar';
import PrimaryButton from '../../components/molecules/PrimaryButton';
import {goBack} from '../../utils/navigation';
import UserService from '../../services/UserService';
import {useUserContext} from '../../context/UserContext';
import {launchImageLibrary} from 'react-native-image-picker';
import {useTheme} from '../../theme/useTheme';
import {ThemePreference, useThemePreference} from '../../theme/ThemePreference';

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  Icon: typeof Sun;
}[] = [
  {value: 'system', label: 'System', Icon: Smartphone},
  {value: 'light', label: 'Light', Icon: Sun},
  {value: 'dark', label: 'Dark', Icon: Moon},
];

const ProfilePreference = () => {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const {preference: themePreference, setPreference: setThemePreference} =
    useThemePreference();
  const {updateUser} = useUserContext();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [designStyle, setDesignStyle] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [initialValues, setInitialValues] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    designStyle: '',
  });

  const hasChanges =
    firstName !== initialValues.firstName ||
    lastName !== initialValues.lastName ||
    bio !== initialValues.bio ||
    designStyle !== initialValues.designStyle;

  const handleChangeAvatar = () => {
    launchImageLibrary({mediaType: 'photo', quality: 0.8}, async response => {
      if (response.didCancel || response.errorCode) return;

      const asset = response.assets?.[0];
      if (!asset?.uri) return;

      setIsUploadingAvatar(true);
      try {
        const res = await UserService.uploadProfilePicture(
          asset.uri,
          asset.type ?? 'image/jpeg',
        );
        setProfilePicture(res.data.profile_picture);
        await updateUser({profile_picture: res.data.profile_picture});
        Toast.show({type: 'success', text1: 'Profile picture updated'});
      } catch (err: any) {
        Toast.show({
          type: 'error',
          text1: 'Could not upload photo',
          text2: err.response?.data?.message || err.message,
        });
      } finally {
        setIsUploadingAvatar(false);
      }
    });
  };

  useEffect(() => {
    UserService.getProfile()
      .then(res => {
        const p = res.data;
        setFirstName(p.first_name ?? '');
        setLastName(p.last_name ?? '');
        setEmail(p.email ?? '');
        setBio(p.bio ?? '');
        setDesignStyle(p.design_style ?? '');
        setProfilePicture(p.profile_picture);
        setInitialValues({
          firstName: p.first_name ?? '',
          lastName: p.last_name ?? '',
          bio: p.bio ?? '',
          designStyle: p.design_style ?? '',
        });
      })
      .catch((err: any) => {
        Toast.show({
          type: 'error',
          text1: 'Could not load profile',
          text2: err.response?.data?.message || err.message,
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Toast.show({type: 'error', text1: 'First and last name are required'});
      return;
    }
    setIsSaving(true);
    try {
      await UserService.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        bio: bio.trim(),
        design_style: designStyle.trim(),
      });
      // Keep the cached session user (header greeting etc.) in sync
      await updateUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      setInitialValues({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bio: bio.trim(),
        designStyle: designStyle.trim(),
      });
      Toast.show({type: 'success', text1: 'Profile updated'});
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not save profile',
        text2: err.response?.data?.message || err.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView
          className="flex-1 bg-offWhite dark:bg-night px-5 pt-[70px]"
          contentContainerStyle={{paddingBottom: 24}}
          showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View className="flex-row items-center mb-6 gap-3">
            <ChevronLeft
              className="text-[#2C2C2C] dark:text-night-text"
              size={24}
              onPress={() => goBack(navigation)}
            />
            <Text className="text-[20px] ml-5 font-semibold text-[#1A1A1A] dark:text-night-text-primary font-cormorant">
              Profile & Preferences
            </Text>
          </View>

          {isLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator size="large" color={colors.brand} />
            </View>
          ) : (
            <>
              {/* PROFILE INFO */}
              <View className="bg-transparent border-[1px] border-[#2C2C2C33] dark:border-night-border rounded-2xl p-4 mb-5">
                <View className="flex-row items-center gap-2 mb-3">
                  <User size={18} color={colors.brand} />
                  <Text className="text-[20px] font-semibold text-[#1A1A1A] dark:text-night-text-primary font-cormorant">
                    Profile Information
                  </Text>
                </View>

                {/* Avatar */}
                <TouchableOpacity
                  onPress={handleChangeAvatar}
                  disabled={isUploadingAvatar}
                  className="relative items-center justify-center my-3">
                  <UserAvatar
                    profilePicture={profilePicture}
                    firstName={firstName}
                    lastName={lastName}
                    email={email}
                    size={80}
                  />

                  {isUploadingAvatar ? (
                    <View className="absolute inset-0 items-center justify-center bg-black/30 rounded-full">
                      <ActivityIndicator color="#fff" />
                    </View>
                  ) : (
                    <View className="absolute bottom-0 right-[110px] bg-[#C4A663] w-7 h-7 rounded-full items-center justify-center border-2 border-white">
                      <Camera size={14} color="white" />
                    </View>
                  )}
                </TouchableOpacity>

                <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444] dark:text-night-text-secondary">
                  First Name
                </Text>
                <TextInput
                  className="border border-[#F1EADC] dark:border-night-border rounded-lg py-2.5 px-3 mb-3 text-[14px] text-[#333] dark:text-night-text"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor={colors.textMuted}
                />

                <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444] dark:text-night-text-secondary">
                  Last Name
                </Text>
                <TextInput
                  className="border border-[#F1EADC] dark:border-night-border rounded-lg py-2.5 px-3 mb-3 text-[14px] text-[#333] dark:text-night-text"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor={colors.textMuted}
                />

                <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444] dark:text-night-text-secondary">
                  Email
                </Text>
                <TextInput
                  className="border border-[#F1EADC] dark:border-night-border bg-[#F5F1E8] dark:bg-night-muted rounded-lg py-2.5 px-3 mb-3 text-[14px] text-[#888] dark:text-night-text-muted"
                  value={email}
                  editable={false}
                />

                <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444] dark:text-night-text-secondary">
                  Bio
                </Text>
                <TextInput
                  className="border border-[#F1EADC] dark:border-night-border rounded-lg py-2.5 px-3 mb-3 text-[14px] text-[#333] dark:text-night-text"
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Interior design enthusiast"
                  placeholderTextColor={colors.textMuted}
                  multiline
                />
              </View>

              {/* APPEARANCE — applies straight away, separate from Save Changes */}
              <View className="bg-transparent border-[1px] border-[#2C2C2C33] dark:border-night-border rounded-2xl p-4 mb-5">
                <View className="flex-row items-center gap-2 mb-1">
                  <Sun size={18} color={colors.brand} />
                  <Text className="text-[20px] font-semibold font-cormorant text-[#1A1A1A] dark:text-night-text-primary">
                    Appearance
                  </Text>
                </View>
                <Text className="text-[13px] font-dm-sans text-[#777] dark:text-night-text-muted mb-3">
                  System matches your phone's Light/Dark setting
                </Text>

                <View className="flex-row bg-[#2C2C2C0D] dark:bg-night-muted rounded-xl p-1">
                  {THEME_OPTIONS.map(({value, label, Icon}) => {
                    const selected = themePreference === value;
                    return (
                      <TouchableOpacity
                        key={value}
                        onPress={() => setThemePreference(value)}
                        accessibilityRole="button"
                        accessibilityState={{selected}}
                        className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg ${
                          selected ? 'bg-white dark:bg-night-surface' : ''
                        }`}>
                        <Icon
                          size={15}
                          color={selected ? colors.brand : colors.textMuted}
                        />
                        <Text
                          className={`ml-1.5 text-[14px] font-dm-sans ${
                            selected
                              ? 'text-[#1A1A1A] dark:text-night-text-primary font-semibold'
                              : 'text-[#777] dark:text-night-text-muted'
                          }`}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* DESIGN STYLE */}
              <View className="bg-transparent border-[1px] border-[#2C2C2C33] dark:border-night-border rounded-2xl p-4 mb-20">
                <View className="flex-row items-center gap-2 mb-3">
                  <Palette size={18} color={colors.brand} />
                  <Text className="text-[20px] font-semibold font-cormorant text-[#1A1A1A] dark:text-night-text-primary">
                    Design Style
                  </Text>
                </View>

                <Text className="text-[14px] font-dm-sans font-medium mt-1 mb-2 text-[#444] dark:text-night-text-secondary">
                  Add Personal Design Style
                </Text>
                <TextInput
                  className="border border-[#F1EADC] dark:border-night-border bg-[#FFFDF8] dark:bg-night-muted rounded-lg py-2.5 px-3 text-[14px] text-[#333] dark:text-night-text"
                  value={designStyle}
                  onChangeText={setDesignStyle}
                  placeholder="e.g. tech minimalist, bohemian, Scandinavian..."
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </>
          )}
        </ScrollView>
        {hasChanges && (
          <View
            style={{paddingHorizontal: 20, paddingBottom: 16, paddingTop: 16}}>
            <PrimaryButton
              title={isSaving ? 'Saving...' : 'Save Changes'}
              onPress={handleSave}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ProfilePreference;
