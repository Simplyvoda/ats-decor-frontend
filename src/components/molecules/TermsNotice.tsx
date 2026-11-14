import React from 'react';
import {Text} from 'react-native';
import {openLegal} from '../../utils/openLegal';

// "By signing up, you agree to our Terms of Use and Privacy Policy", with
// both links opening in the in-app browser. Shown wherever an account can
// be created: the Sign Up form and the Apple sign-in date-of-birth pop-up
// (the step every new Apple account goes through, from Sign Up or Log In).
// The server records the acceptance date when it creates the account
// (users.termsAcceptedAt).
export default function TermsNotice({
  action = 'signing up',
  className = '',
}: {
  action?: string;
  className?: string;
}) {
  return (
    <Text className={`w-full text-black dark:text-night-text ${className}`}>
      By {action}, you agree to our{' '}
      <Text className="text-brand" onPress={() => openLegal('terms')}>
        Terms of Use
      </Text>{' '}
      and{' '}
      <Text className="text-brand" onPress={() => openLegal('privacy')}>
        Privacy Policy
      </Text>
      .
    </Text>
  );
}
