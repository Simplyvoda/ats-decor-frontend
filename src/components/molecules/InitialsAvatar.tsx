import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type Props = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  size?: number;
};

const getInitials = (
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null,
) => {
  const first = firstName?.trim()?.[0];
  const last = lastName?.trim()?.[0];
  if (first && last) {
    return `${first}${last}`.toUpperCase();
  }
  if (first) {
    return first.toUpperCase();
  }
  if (email?.trim()?.[0]) {
    return email.trim()[0].toUpperCase();
  }
  return '?';
};

export default function InitialsAvatar({firstName, lastName, email, size = 40}: Props) {
  const initials = getInitials(firstName, lastName, email);
  return (
    <View
      style={[
        styles.circle,
        {width: size, height: size, borderRadius: size / 2},
      ]}>
      <Text style={[styles.text, {fontSize: size * 0.4}]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: '#C4A962',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {color: 'white', fontWeight: '600'},
});
