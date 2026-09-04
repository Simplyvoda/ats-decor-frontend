/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// App.tsx already exports its component pre-wrapped in Sentry.wrap() —
// wrapping it again here nests two Sentry wrapper trees inside each other,
// which is a second, separate duplicate-Sentry-setup bug (same shape as the
// double Sentry.init() bug, just for wrap()). Only register the app as-is.
AppRegistry.registerComponent(appName, () => App);
