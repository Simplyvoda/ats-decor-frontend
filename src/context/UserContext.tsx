import React, {createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ISignInResponse} from '../../interface/auth_user.interface';

interface IUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface IUserContext {
  user: IUser | null;
  isLoadingUser: boolean;
  signInUser: (data: ISignInResponse) => Promise<void>;
  logoutUser: () => Promise<void>;
  updateUser: (partial: Partial<IUser>) => Promise<void>;
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
          const parsed: IUser = JSON.parse(storedUser);
          // Clear stale sessions missing name data so the user re-authenticates
          if (!parsed.first_name || !parsed.last_name) {
            await AsyncStorage.multiRemove(['user', 'token', 'session']);
          } else {
            setUser(parsed);
          }
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

  const logoutUser = async () => {
    setUser(null);
    await AsyncStorage.multiRemove(['user', 'token', 'session']);
  };

  // Merge profile edits (e.g. name changes) into the cached session user
  const updateUser = async (partial: Partial<IUser>) => {
    setUser(prev => {
      if (!prev) {
        return prev;
      }
      const next = {...prev, ...partial};
      AsyncStorage.setItem('user', JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  return (
    <UserContext.Provider
      value={{user, isLoadingUser, signInUser, logoutUser, updateUser}}>
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
