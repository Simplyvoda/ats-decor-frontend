import {Alert} from 'react-native';

// TEMPORARY, for finding crashes in TestFlight builds. Remove before the
// App Store release.
//
// When a JavaScript error is about to close the app, show its message
// first. Tapping OK hands the error on as before (Sentry reports it, then
// the app closes). Development builds already show a red error screen, so
// this only runs in release builds.
export function showFatalErrors() {
  if (__DEV__) {
    return;
  }
  const g = globalThis as any;
  const previous = g.ErrorUtils?.getGlobalHandler?.();
  if (!previous) {
    return;
  }
  g.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    if (!isFatal) {
      previous(error, isFatal);
      return;
    }
    const message = String(error?.message ?? error);
    const stack = String(error?.stack ?? '')
      .split('\n')
      .slice(0, 8)
      .join('\n');
    Alert.alert('The app hit an error', `${message}\n\n${stack}`, [
      {text: 'OK', onPress: () => previous(error, isFatal)},
    ]);
  });
}
