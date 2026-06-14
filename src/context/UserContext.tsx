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
      } catch (err) {
        console.log('Error restoring user:', err);
      } finally {
        setIsLoadingUser(false);
      }
    };

    restoreUser();
  }, []);

  const saveUserSession = async (res: ISignInResponse) => {
    await AsyncStorage.setItem('token', res.data.session.access_token);
    await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
    await AsyncStorage.setItem('session', JSON.stringify(res.data.session));
  };

  const signInUser = async (data: ISignInResponse) => {
    const usr = data.data.user;

    const simplifiedUser: IUser = {
      id: usr.id,
      email: usr.email,
      first_name: usr.user_metadata?.first_name,
      last_name: usr.user_metadata?.last_name,
    };

    // save in state
    setUser(simplifiedUser);
    await saveUserSession(data);
  };

  // Clear everything on logout
  const logoutUser = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('access_token');
  };

  return (
    <UserContext.Provider value={{user, isLoadingUser, signInUser, logoutUser}}>
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
