import React, {useEffect, useRef} from 'react';
import {Linking} from 'react-native';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {UserProvider, useUserContext} from './src/context/UserContext';
import {
  extractAuthError,
  extractRecoveryToken,
  extractVerifiedSession,
} from './src/utils/deepLinking';

// Lives inside UserProvider (not App itself) so it can call
// signInFromSession when a signup-confirmation link comes in.
function AppContent() {
  const navigationRef = useNavigationContainerRef();
  const pendingUrlRef = useRef<string | null>(null);
  const {signInFromSession} = useUserContext();

  const handleDeepLink = async (url: string | null) => {
    console.log('[handleDeepLink] received url:', url);

    const verified = extractVerifiedSession(url);
    console.log('[handleDeepLink] extractVerifiedSession ->', verified);
    if (verified) {
      try {
        await signInFromSession(verified.accessToken, verified.refreshToken);
        console.log('[handleDeepLink] signInFromSession succeeded');
        Toast.show({
          type: 'success',
          text1: 'Email confirmed',
          text2: 'Welcome to All Things Snug!',
        });
      } catch (err: any) {
        console.log('[handleDeepLink] signInFromSession threw:', {
          message: err?.message,
          code: err?.code,
          baseURL: err?.config?.baseURL,
          url: err?.config?.url,
          hasResponse: !!err?.response,
          status: err?.response?.status,
        });
        Toast.show({
          type: 'error',
          text1: 'Could not complete verification',
          text2: err.response?.data?.message || err.message,
        });
      }
      return;
    }

    const authError = extractAuthError(url);
    console.log('[handleDeepLink] extractAuthError ->', authError);
    if (authError) {
      Toast.show({
        type: 'error',
        text1: 'Verification link expired',
        text2: authError,
      });
      return;
    }

    const accessToken = extractRecoveryToken(url);
    console.log(
      '[handleDeepLink] extractRecoveryToken ->',
      accessToken ? '(token present)' : null,
    );
    if (!accessToken) {
      console.log('[handleDeepLink] no matcher recognized this url, ignoring');
      return;
    }
    if (navigationRef.isReady()) {
      (navigationRef as any).navigate('Auth', {
        screen: 'SetPassword',
        params: {accessToken},
      });
    } else {
      pendingUrlRef.current = url;
    }
  };

  useEffect(() => {
    Linking.getInitialURL().then(handleDeepLink);
    const subscription = Linking.addEventListener('url', ({url}) =>
      handleDeepLink(url),
    );
    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        if (pendingUrlRef.current) {
          handleDeepLink(pendingUrlRef.current);
          pendingUrlRef.current = null;
        }
      }}>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <AppContent />
        <Toast />
      </UserProvider>
    </SafeAreaProvider>
  );
}
