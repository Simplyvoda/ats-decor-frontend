import {NativeModules} from 'react-native';

// The installed app's real version, build number and build date (native
// AppInfoModule), so Help & Feedback never shows a typed-in version or
// date. Empty strings if the native module isn't there (an old build).
type NativeAppInfo = {version: string; build: string; buildDate: string};

const native: Partial<NativeAppInfo> = NativeModules.AppInfoModule ?? {};

export const APP_VERSION = native.version ?? '';
export const APP_BUILD = native.build ?? '';

// "Version 1.0 (42)"
export const versionLabel = () =>
  APP_VERSION
    ? `Version ${APP_VERSION}${APP_BUILD ? ` (${APP_BUILD})` : ''}`
    : '';

// "13 Nov 2026" from the YYYY-MM-DD the build stamped, or '' if unknown.
export const buildDateLabel = () => {
  const iso = native.buildDate ?? '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) {
    return '';
  }
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
};
