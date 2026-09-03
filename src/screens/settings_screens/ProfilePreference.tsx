import {useNavigation} from '@react-navigation/native';
import {Camera, ChevronLeft, Palette, User} from 'lucide-react-native';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
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

const ProfilePreference = () => {
  const navigation = useNavigation();
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
    <SafeAreaView style={{flex: 1, backgroundColor: '#FAF9F6'}}>
      <ScrollView
        className="flex-1 bg-offWhite px-5 pt-[70px]"
        contentContainerStyle={{paddingBottom: 24}}
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

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#C1A36A" />
          </View>
        ) : (
          <>
            {/* PROFILE INFO */}
            <View className="bg-transparent  border-[1px] border-[#2C2C2C33]  rounded-2xl p-4 mb-5">
              <View className="flex-row items-center gap-2 mb-3">
                <User size={18} color="#C4A663" />
                <Text className="text-[20px] font-semibold text-[#1A1A1A] font-cormorant">
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

              <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444]">
                First Name
              </Text>
              <TextInput
                className="border border-[#F1EADC]  rounded-lg py-2.5 px-3 mb-3 text-[14px] text-[#333]"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor="#2C2C2C80"
              />

              <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444]">
                Last Name
              </Text>
              <TextInput
                className="border border-[#F1EADC]  rounded-lg py-2.5 px-3 mb-3 text-[14px] text-[#333]"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor="#2C2C2C80"
              />

              <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444]">
                Email
              </Text>
              <TextInput
                className="border border-[#F1EADC] bg-[#F5F1E8] rounded-lg py-2.5 px-3 mb-3 text-[14px] text-[#888]"
                value={email}
                editable={false}
              />

              <Text className="text-[14px] font-medium font-dm-sans mb-1 text-[#444]">
                Bio
              </Text>
              <TextInput
                className="border border-[#F1EADC]  rounded-lg py-2.5 px-3 mb-3 text-[14px] text-[#333]"
                value={bio}
                onChangeText={setBio}
                placeholder="Interior design enthusiast"
                placeholderTextColor="#2C2C2C80"
                multiline
              />
            </View>

            {/* APPEARANCE */}
            {/* <View className="bg-transparent border-[1px] border-[#2C2C2C33]  rounded-2xl p-4 mb-5">
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
                <AppSwitch value={darkMode} onValueChange={setDarkMode} />
              </View>
            </View> */}

            {/* DESIGN STYLE */}
            <View className="bg-transparent border-[1px] border-[#2C2C2C33] rounded-2xl p-4 mb-20">
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
                value={designStyle}
                onChangeText={setDesignStyle}
                placeholder="e.g. tech minimalist, bohemian, Scandinavian..."
                placeholderTextColor="#2C2C2C80"
              />
            </View>
          </>
        )}
      </ScrollView>
      <View style={{paddingHorizontal: 20, paddingBottom: 16, paddingTop: 16}}>
        <PrimaryButton
          title={isSaving ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
        />
      </View>
    </SafeAreaView>
  );
};

export default ProfilePreference;
