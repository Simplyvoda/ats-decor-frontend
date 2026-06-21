import React, {createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ISignInResponse} from '../../interface/auth_user.interface';
import UserService, { IUpdateProfilePayload, IGetProfileResponse } from '../services/UserService';

interface IUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  design_style?: string;
}

interface IUserContext {
  user: IUser | null;
  isLoadingUser: boolean;
  signInUser: (data: ISignInResponse) => Promise<void>;
  logoutUser: () => Promise<void>;
  updateUser: (payload: IUpdateProfilePayload) => Promise<void>;
}

const UserContext = createContext<IUserContext | undefined>(undefined);

export const UserProvider = ({children}: {children: React.ReactNode}) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Restore user on app launch
  useEffect(() => {
    const restoreUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        // Try to fetch fresh profile from API
        try {
          const freshProfile = await UserService.getProfile();
          const simplifiedUser: IUser = {
            id: freshProfile.id,
            email: freshProfile.email,
            first_name: freshProfile.first_name,
            last_name: freshProfile.last_name,
            bio: freshProfile.bio,
          };
          setUser(simplifiedUser);
          await AsyncStorage.setItem('user', JSON.stringify(simplifiedUser));
        } catch (err) {
          console.log('Error fetching fresh profile:', err);
        }
      } catch (err) {
        console.log('Error restoring user:', err);
      } finally {
        setIsLoadingUser(false);
      }
    };

    restoreUser();
  }, []);

  const signInUser = async (data: ISignInResponse) => {
    const usr = data.data.user;

    const simplifiedUser: IUser = {
      id: usr.id,
      email: usr.email,
      first_name: usr.user_metadata?.first_name,
      last_name: usr.user_metadata?.last_name,
    };

    setUser(simplifiedUser);
    await AsyncStorage.setItem('token', data.data.session.access_token);
    await AsyncStorage.setItem('user', JSON.stringify(simplifiedUser));
    await AsyncStorage.setItem('session', JSON.stringify(data.data.session));
  };

  const updateUser = async (payload: IUpdateProfilePayload) => {
    const updatedProfile = await UserService.updateProfile(payload);
    const simplifiedUser: IUser = {
      id: updatedProfile.id,
      email: updatedProfile.email,
      first_name: updatedProfile.first_name,
      last_name: updatedProfile.last_name,
      bio: updatedProfile.bio,
      design_style: updatedProfile.design_style,
    };
    setUser(simplifiedUser);
    await AsyncStorage.setItem('user', JSON.stringify(simplifiedUser));
  };

  const logoutUser = async () => {
    setUser(null);
    await AsyncStorage.multiRemove(['user', 'token', 'session']);
  };

  return (
    <UserContext.Provider value={{user, isLoadingUser, signInUser, logoutUser, updateUser}}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used inside UserProvider');
  }
  return context;
};
