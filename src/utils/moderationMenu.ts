import {Alert} from 'react-native';
import Toast from 'react-native-toast-message';
import ModerationService, {
  ReportReason,
  ReportTarget,
} from '../services/ModerationService';

export type ModerationOutcome = 'reported' | 'blocked' | null;

const REASONS: [ReportReason, string][] = [
  ['offensive', 'Offensive or inappropriate'],
  ['harassment', 'Harassment or hate'],
  ['spam', 'Spam or misleading'],
  ['copyright', 'Copied without permission'],
  ['other', 'Something else'],
];

const errorText = (err: any) =>
  err?.response?.data?.message || err?.message || 'Please try again';

// "Report / Block" for someone else's design or comment. Resolves with
// what the user did, so the screen can drop the content from view:
//   'reported' → hide that item; 'blocked' → hide everything by its author.
export function openModerationMenu(
  type: ReportTarget,
  id: string,
): Promise<ModerationOutcome> {
  const noun = type === 'design' ? 'design' : 'comment';
  const person = type === 'design' ? 'creator' : 'author';

  return new Promise(resolve => {
    const report = () =>
      Alert.alert(`Why are you reporting this ${noun}?`, undefined, [
        ...REASONS.map(([reason, label]) => ({
          text: label,
          onPress: async () => {
            try {
              await ModerationService.report(type, id, reason);
              Toast.show({
                type: 'success',
                text1: 'Thanks for reporting',
                text2: 'We’ll review it within 48 hours.',
              });
              resolve('reported');
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: 'Could not send the report',
                text2: errorText(err),
              });
              resolve(null);
            }
          },
        })),
        {text: 'Cancel', style: 'cancel', onPress: () => resolve(null)},
      ]);

    const block = () =>
      Alert.alert(
        `Block this ${person}?`,
        'You won’t see their designs or comments any more. You can unblock them in Settings → Security & Privacy.',
        [
          {text: 'Cancel', style: 'cancel', onPress: () => resolve(null)},
          {
            text: 'Block',
            style: 'destructive',
            onPress: async () => {
              try {
                await ModerationService.block(type, id);
                Toast.show({type: 'success', text1: 'Blocked'});
                resolve('blocked');
              } catch (err) {
                Toast.show({
                  type: 'error',
                  text1: 'Could not block',
                  text2: errorText(err),
                });
                resolve(null);
              }
            },
          },
        ],
      );

    Alert.alert('', undefined, [
      {text: `Report ${noun}`, onPress: report},
      {text: `Block ${person}`, style: 'destructive', onPress: block},
      {text: 'Cancel', style: 'cancel', onPress: () => resolve(null)},
    ]);
  });
}
