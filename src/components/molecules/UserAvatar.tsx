import React from 'react';
import {Image} from 'react-native';
import InitialsAvatar from './InitialsAvatar';

type Props = {
  profilePicture?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  size?: number;
};

export default function UserAvatar({
  profilePicture,
  firstName,
  lastName,
  email,
  size = 40,
}: Props) {
  if (profilePicture) {
    return (
      <Image
        source={{uri: profilePicture}}
        style={{width: size, height: size, borderRadius: size / 2}}
      />
    );
  }
  return (
    <InitialsAvatar
      firstName={firstName}
      lastName={lastName}
      email={email}
      size={size}
    />
  );
}
