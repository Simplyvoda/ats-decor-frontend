// Settings → Security & Privacy → Blocked users: everyone this user has
// blocked, with Unblock.
import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {ChevronLeft, UserX} from 'lucide-react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {goBack} from '../../utils/navigation';
import ModerationService, {
  IBlockedUser,
} from '../../services/ModerationService';
import InitialsAvatar from '../../components/molecules/InitialsAvatar';
import {useTheme} from '../../theme/useTheme';

const splitName = (name: string) => {
  const [firstName, ...rest] = name.split(' ');
  return {firstName, lastName: rest.join(' ')};
};

export default function BlockedUsers() {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const [{users, loading}, setState] = useState<{
    users: IBlockedUser[];
    loading: boolean;
  }>({users: [], loading: true});

  useFocusEffect(
    useCallback(() => {
      ModerationService.blocked()
        .then(list => setState({users: list, loading: false}))
        .catch(() => {
          setState(s => ({...s, loading: false}));
          Toast.show({type: 'error', text1: 'Could not load blocked users'});
        });
    }, []),
  );

  const unblock = (user: IBlockedUser) =>
    Alert.alert(
      `Unblock ${user.name}?`,
      'You’ll see their designs and comments again.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Unblock',
          onPress: async () => {
            setState(s => ({...s, users: s.users.filter(u => u.id !== user.id)}));
            try {
              await ModerationService.unblock(user.id);
            } catch {
              setState(s => ({...s, users: [user, ...s.users]}));
              Toast.show({type: 'error', text1: 'Could not unblock'});
            }
          },
        },
      ],
    );

  return (
    <ScrollView
      className="flex-1 bg-offWhite dark:bg-night px-5 pt-[70px]"
      contentContainerStyle={{paddingBottom: 40}}>
      <View className="flex-row items-center mb-6 gap-3">
        <ChevronLeft
          className="text-[#2C2C2C] dark:text-night-text"
          size={24}
          onPress={() => goBack(navigation)}
        />
        <Text className="text-[20px] ml-5 font-semibold text-[#1A1A1A] dark:text-night-text-primary font-cormorant">
          Blocked users
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{marginTop: 32}} />
      ) : users.length === 0 ? (
        <View className="items-center py-14 px-6">
          <UserX size={40} color={colors.textMuted} strokeWidth={1.4} />
          <Text className="font-cormorant text-[20px] text-[#1A1A1A] dark:text-night-text-primary mt-4">
            No one blocked
          </Text>
          <Text className="font-dm-sans text-[14px] text-[#7A7A7A] dark:text-night-text-muted mt-2 text-center">
            To block someone, tap ··· on one of their designs in Explore or
            on their comment.
          </Text>
        </View>
      ) : (
        <View className="bg-transparent border-[1px] border-[#2C2C2C33] dark:border-night-border rounded-2xl px-4">
          {users.map((user, i) => (
            <View
              key={user.id}
              className={`flex-row items-center py-3 ${
                i > 0 ? 'border-t-[1px] border-[#2C2C2C1A] dark:border-night-border' : ''
              }`}>
              {user.profile_picture ? (
                <Image
                  source={{uri: user.profile_picture, cache: 'force-cache'}}
                  style={{width: 36, height: 36, borderRadius: 18}}
                />
              ) : (
                <InitialsAvatar {...splitName(user.name)} size={36} />
              )}
              <Text className="flex-1 ml-3 text-[15px] text-[#333] dark:text-night-text font-dm-sans">
                {user.name}
              </Text>
              <TouchableOpacity
                onPress={() => unblock(user)}
                className="border-[1px] border-brand rounded-lg px-3 py-1.5">
                <Text className="text-brand font-dm-sans text-[13px] font-semibold">
                  Unblock
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
