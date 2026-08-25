import React, {createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ISignInResponse} from '../../interface/auth_user.interface';
import UserService from '../services/UserService';
import {onUnauthorized} from '../utils/authEvents';

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
  signInFromSession: (accessToken: string, refreshToken: string) => Promise<void>;
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
            // The cached record only proves a session existed at some point —
            // confirm the token itself is still accepted, and refresh the
            // cache with whatever the server currently has (name/etc. may
            // have changed since this record was cached).
            try {
              const profile = await UserService.getProfile();
              const refreshed: IUser = {
                ...parsed,
                first_name: profile.data.first_name,
                last_name: profile.data.last_name,
                email: profile.data.email,
              };
              await AsyncStorage.setItem('user', JSON.stringify(refreshed));
              setUser(refreshed);
            } catch {
              await AsyncStorage.multiRemove(['user', 'token', 'session']);
            }
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

  // A 401 from any API call means the backend no longer accepts this
  // token — drop straight to the unauthenticated screens.
  useEffect(() => {
    return onUnauthorized(() => {
      setUser(null);
      AsyncStorage.multiRemove(['user', 'token', 'session']);
    });
  }, []);

  const signInUser = async (data: ISignInResponse) => {
    const usr = data.data.user;

    // user_metadata is a snapshot of the name taken at signup — the /user
    // backend table (edited via Profile & Preferences) is the source of
    // truth for the current name, so start from the metadata as a fallback
    // and overwrite it with the live profile once the token is in place.
    const simplifiedUser: IUser = {
      id: usr.id,
      email: usr.email,
      first_name: usr.user_metadata?.first_name,
      last_name: usr.user_metadata?.last_name,
    };

    // Persist before flipping `user` — that state change swaps the navigator
    // to the authenticated stack, whose screens fire API calls immediately.
    // If the token write hasn't landed yet, those first requests go out
    // with no (or a stale) Authorization header.
    await AsyncStorage.setItem('token', data.data.session.access_token);
    await AsyncStorage.setItem('user', JSON.stringify(simplifiedUser));
    await AsyncStorage.setItem('session', JSON.stringify(data.data.session));
    setUser(simplifiedUser);

    try {
      const profile = await UserService.getProfile();
      const refreshed: IUser = {
        ...simplifiedUser,
        first_name: profile.data.first_name,
        last_name: profile.data.last_name,
        email: profile.data.email,
      };
      await AsyncStorage.setItem('user', JSON.stringify(refreshed));
      setUser(refreshed);
    } catch {
      // Profile table is unreachable right after login — keep the
      // signup-metadata fallback rather than blocking sign-in on it.
    }
  };

  // Establishes a session from tokens handed back by a Supabase redirect
  // (e.g. the signup-confirmation deep link) rather than a signin response —
  // there's no user payload on the link itself, so fetch the profile once
  // the token is in place.
  const signInFromSession = async (accessToken: string, refreshToken: string) => {
    console.log(
      '[signInFromSession] starting, accessToken len=',
      accessToken?.length,
      'refreshToken len=',
      refreshToken?.length,
    );
    await AsyncStorage.setItem('token', accessToken);
    await AsyncStorage.setItem(
      'session',
      JSON.stringify({access_token: accessToken, refresh_token: refreshToken}),
    );

    try {
      let profile;
      try {
        console.log('[signInFromSession] calling getProfile (attempt 1)');
        profile = await UserService.getProfile();
        console.log('[signInFromSession] getProfile succeeded on attempt 1');
      } catch (err: any) {
        console.log('[signInFromSession] getProfile attempt 1 failed:', {
          message: err?.message,
          code: err?.code,
          baseURL: err?.config?.baseURL,
          url: err?.config?.url,
          hasResponse: !!err?.response,
          status: err?.response?.status,
        });
        // The very first network call after a cold launch triggered by an
        // external URL (Mail → Safari → app) can fire before iOS's
        // networking stack is fully warmed up — one retry clears it.
        if (err.message !== 'Network Error') {
          throw err;
        }
        console.log('[signInFromSession] retrying getProfile in 1.5s');
        await new Promise<void>(resolve => setTimeout(resolve, 1500));
        profile = await UserService.getProfile();
        console.log('[signInFromSession] getProfile succeeded on retry');
      }
      const verifiedUser: IUser = {
        id: profile.data.id,
        email: profile.data.email,
        first_name: profile.data.first_name,
        last_name: profile.data.last_name,
      };
      await AsyncStorage.setItem('user', JSON.stringify(verifiedUser));
      setUser(verifiedUser);
      console.log('[signInFromSession] done, user set:', verifiedUser.email);
    } catch (err: any) {
      console.log('[signInFromSession] giving up, clearing storage:', {
        message: err?.message,
        code: err?.code,
        baseURL: err?.config?.baseURL,
        url: err?.config?.url,
        hasResponse: !!err?.response,
        status: err?.response?.status,
      });
      await AsyncStorage.multiRemove(['user', 'token', 'session']);
      throw err;
    }
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
      value={{
        user,
        isLoadingUser,
        signInUser,
        signInFromSession,
        logoutUser,
        updateUser,
      }}>
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
