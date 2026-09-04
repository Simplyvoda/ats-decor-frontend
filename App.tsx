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
import * as Sentry from '@sentry/react-native';

// TEMPORARILY DISABLED (whole block, not just `enabled: false`, since the
// mobileReplayIntegration()/feedbackIntegration() calls below still run
// even if init is told not to activate) to test whether Sentry is the
// cause of the launch crash — app worked fine before Sentry was added,
// and the crash happens the instant JS starts running, which is exactly
// when this code runs. Re-enable once we confirm this is/isn't the cause.
//
// Sentry.init({
//   dsn: 'https://3ebba0aa6c9d687851fa970a8c58f2d3@o4512024176361472.ingest.de.sentry.io/4512024193531984',
//
//   // Adds more context data to events (IP address, cookies, user, etc.)
//   // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
//   sendDefaultPii: true,
//
//   // Enable Logs
//   enableLogs: true,
//
//   // Configure Session Replay
//   replaysSessionSampleRate: 0.1,
//   replaysOnErrorSampleRate: 1,
//   integrations: [
//     Sentry.mobileReplayIntegration(),
//     Sentry.feedbackIntegration(),
//   ],
//
//   // uncomment the line below to enable Spotlight (https://spotlightjs.com)
//   // spotlight: __DEV__,
// });

// Lives inside UserProvider (not App itself) so it can call
// signInFromSession when a signup-confirmation link comes in.
function AppContent() {
  const navigationRef = useNavigationContainerRef();
  const pendingUrlRef = useRef<string | null>(null);
  const {signInFromSession} = useUserContext();

  const handleDeepLink = async (url: string | null) => {
    const verified = extractVerifiedSession(url);
    if (verified) {
      try {
        await signInFromSession(verified.accessToken, verified.refreshToken);
        Toast.show({
          type: 'success',
          text1: 'Email confirmed',
          text2: 'Welcome to Pladomus!',
        });
      } catch (err: any) {
        Toast.show({
          type: 'error',
          text1: 'Could not complete verification',
          text2: err.response?.data?.message || err.message,
        });
      }
      return;
    }

    const authError = extractAuthError(url);
    if (authError) {
      Toast.show({
        type: 'error',
        text1: 'Verification link expired',
        text2: authError,
      });
      return;
    }

    const accessToken = extractRecoveryToken(url);
    if (!accessToken) {
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

export default Sentry.wrap(function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <AppContent />
        <Toast />
      </UserProvider>
    </SafeAreaProvider>
  );
});
