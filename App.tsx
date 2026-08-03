import React, {useEffect, useRef} from 'react';
import {Linking} from 'react-native';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {UserProvider} from './src/context/UserContext';
import {extractRecoveryToken} from './src/utils/deepLinking';

export default function App() {
  const navigationRef = useNavigationContainerRef();
  const pendingUrlRef = useRef<string | null>(null);

  const handleDeepLink = (url: string | null) => {
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
    <SafeAreaProvider>
      <UserProvider>
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
        <Toast />
      </UserProvider>
    </SafeAreaProvider>
  );
}
