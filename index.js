/**
 * @format
 */

import {AppRegistry} from 'react-native';
import * as Sentry from '@sentry/react-native';
import {SENTRY_DSN} from '@env';
import App from './App';
import {name as appName} from './app.json';

// Crash reporting — no-op until SENTRY_DSN is set in .env
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    // Capture 100% of traces while the tester pool is small
    tracesSampleRate: 1.0,
    // Skip dev-reload noise — report from release builds only
    enabled: !__DEV__,
    environment: __DEV__ ? 'development' : 'production',
  });
}

AppRegistry.registerComponent(appName, () =>
  SENTRY_DSN ? Sentry.wrap(App) : App,
);
