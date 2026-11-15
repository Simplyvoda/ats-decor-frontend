import React, {useReducer, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {appleAuth} from '@invertase/react-native-apple-authentication';
import AuthService from '../services/AuthService';
import {track} from '../services/analytics';
import {useUserContext} from '../context/UserContext';
import DateOfBirthInput from '../components/molecules/DateOfBirthInput';
import TermsNotice from '../components/molecules/TermsNotice';
import {
  DATE_OF_BIRTH_REQUIRED_CODE,
  UNDERAGE_CODE,
  UNDERAGE_MESSAGE,
  validateDateOfBirth,
} from '../utils/age';

type ApplePayload = Parameters<typeof AuthService.appleSignIn>[0];

// The date-of-birth pop-up. Open while `pending` (the Apple sign-in waiting
// for a date) is set.
type PromptState = {
  pending: ApplePayload | null;
  dateOfBirth: string;
  error: string | null;
};

type PromptAction =
  | {type: 'open'; payload: ApplePayload; error?: string}
  | {type: 'dateChanged'; dateOfBirth: string}
  | {type: 'error'; error: string}
  | {type: 'close'};

const closedPrompt: PromptState = {pending: null, dateOfBirth: '', error: null};

function promptReducer(state: PromptState, action: PromptAction): PromptState {
  switch (action.type) {
    case 'open':
      return {...state, pending: action.payload, error: action.error ?? null};
    case 'dateChanged': {
      // Answer as soon as the date is complete.
      const result = action.dateOfBirth
        ? validateDateOfBirth(action.dateOfBirth)
        : true;
      return {
        ...state,
        dateOfBirth: action.dateOfBirth,
        error: result === true ? null : result,
      };
    }
    case 'error':
      return {...state, error: action.error};
    case 'close':
      return closedPrompt;
  }
}

// "Continue with Apple", shared by Sign Up and Log In.
//
// Apple signs existing users in and creates an account for new ones. New
// accounts need a date of birth, so when the server says it's missing we
// ask for it in a small pop-up and send the same Apple sign-in again —
// no second trip through Apple's sheet.
//
// Usage: const apple = useAppleSignIn();
//        <Pressable onPress={apple.onPress} … />  and render {apple.dateOfBirthPrompt}
export function useAppleSignIn(options?: {
  // Sign Up passes the date already typed into its form, so people who
  // filled it in aren't asked again.
  getDateOfBirth?: () => string;
}) {
  const {signInUser} = useUserContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prompt, dispatch] = useReducer(promptReducer, closedPrompt);
  const {pending, dateOfBirth, error: dobError} = prompt;
  // Under 18: the pop-up only offers Close.
  const blocked = dobError === UNDERAGE_MESSAGE;

  const closePrompt = () => dispatch({type: 'close'});

  const send = async (payload: ApplePayload) => {
    try {
      setIsSubmitting(true);
      const res = await AuthService.appleSignIn(payload);
      if (res.data.is_new_user) {
        track.signUp('apple');
      } else {
        track.login('apple');
      }
      closePrompt();
      await signInUser(res);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Signed in with Apple',
        position: 'bottom',
      });
    } catch (err: any) {
      const code = err.response?.data?.code;
      if (code === DATE_OF_BIRTH_REQUIRED_CODE) {
        dispatch({type: 'open', payload});
        return;
      }
      if (code === UNDERAGE_CODE) {
        // Only shown once a date has been entered, inside the pop-up.
        dispatch({type: 'open', payload, error: UNDERAGE_MESSAGE});
        return;
      }
      console.log('Apple sign-in error:', err.response?.data || err.message);
      closePrompt();
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || err.message,
        position: 'bottom',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formDateOfBirth = () => {
    const value = options?.getDateOfBirth?.() ?? '';
    return value && validateDateOfBirth(value) === true ? value : undefined;
  };

  const onPress = async () => {
    try {
      setIsSubmitting(true);
      const appleResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      if (!appleResponse.identityToken) {
        throw new Error('Apple sign-in did not return an identity token');
      }

      await send({
        identityToken: appleResponse.identityToken,
        // The library generates a nonce, puts its SHA256 hash in the Apple
        // request and returns the RAW value here. Supabase needs the raw
        // value to check the hash inside identityToken — leaving it out
        // fails with "Passed nonce and nonce in id_token should either
        // both exist or not."
        nonce: appleResponse.nonce,
        firstName: appleResponse.fullName?.givenName ?? undefined,
        lastName: appleResponse.fullName?.familyName ?? undefined,
        dateOfBirth: formDateOfBirth(),
      });
    } catch (err: any) {
      if (err.code === appleAuth.Error.CANCELED) {
        return;
      }
      console.log('Apple sign-in error:', err.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message,
        position: 'bottom',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onContinue = () => {
    if (!pending) {
      return;
    }
    const result = validateDateOfBirth(dateOfBirth);
    if (result !== true) {
      dispatch({type: 'error', error: result});
      return;
    }
    send({...pending, dateOfBirth});
  };

  const dateOfBirthPrompt = (
    <Modal
      visible={pending !== null}
      transparent
      animationType="fade"
      onRequestClose={closePrompt}>
      <View className="flex-1 justify-center px-6 bg-black/50">
        <View className="rounded-2xl p-6 bg-offWhite dark:bg-night-surface">
          <Text className="cormorant text-2xl text-black dark:text-night-text-primary mb-1">
            One more thing
          </Text>
          <Text className="text-light-gray dark:text-night-text-muted mb-4">
            Please enter your date of birth to finish creating your account.
          </Text>

          <DateOfBirthInput
            hasError={!!dobError}
            onChange={value =>
              dispatch({type: 'dateChanged', dateOfBirth: value})
            }
          />
          {dobError && (
            <Text className="text-red-600 dark:text-red-400">{dobError}</Text>
          )}

          {/* Every new Apple account comes through here, including from
              Log In, which has no terms line of its own. */}
          {!blocked && (
            <TermsNotice
              action="continuing"
              className="mt-4 text-sm text-light-gray dark:text-night-text-muted"
            />
          )}

          <View className="flex-row mt-5 space-x-3">
            <TouchableOpacity
              onPress={closePrompt}
              className="flex-1 items-center py-3 rounded-lg border border-[#ccc] dark:border-night-border">
              <Text className="text-black dark:text-night-text">
                {blocked ? 'Close' : 'Cancel'}
              </Text>
            </TouchableOpacity>
            {!blocked && (
              <Pressable
                onPress={onContinue}
                disabled={isSubmitting}
                className="flex-1 items-center py-3 rounded-lg bg-[#C1A36A] active:opacity-80">
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white dark:text-night font-semibold">
                    Continue
                  </Text>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  return {onPress, isSubmitting, dateOfBirthPrompt};
}
