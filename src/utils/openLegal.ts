import {Linking, NativeModules} from 'react-native';
import Toast from 'react-native-toast-message';
import {LEGAL_URLS, LegalDoc} from '../config/legal';

// Opens the Terms of Use or Privacy Policy in Apple's in-app Safari sheet
// (native SafariViewModule), so the user stays in the app. Falls back to the
// default browser if the native module isn't there (e.g. an old build).
export async function openLegal(doc: LegalDoc): Promise<void> {
  const url = LEGAL_URLS[doc];
  try {
    const safari = NativeModules.SafariViewModule;
    if (safari?.open) {
      await safari.open(url);
      return;
    }
    await Linking.openURL(url);
  } catch {
    Toast.show({
      type: 'error',
      text1: 'Could not open the page',
      text2: url,
    });
  }
}
