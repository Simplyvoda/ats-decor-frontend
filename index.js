/**
 * @format
 */

import {AppRegistry} from 'react-native';
import * as Sentry from '@sentry/react-native';
import App from './App';
import {name as appName} from './app.json';

// Sentry.init() already runs in App.tsx (which this file imports above) —
// calling it a second time here re-initializes mid-startup and was crashing
// the app on launch, so only Sentry.wrap() belongs in this file.
AppRegistry.registerComponent(appName, () => Sentry.wrap(App));
