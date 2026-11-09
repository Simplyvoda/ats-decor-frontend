// Age check for sign-up. The server (be/src/common/age.ts) makes the real
// decision; this copy just lets the app answer straight away.
// The minimum age is only shown AFTER someone enters an under-age date —
// the form itself just asks for a date of birth.

export const MINIMUM_AGE = 18;

export const UNDERAGE_MESSAGE = `You must be ${MINIMUM_AGE} or older to create a Pladomus account.`;

// Error codes the server sends in the response body's `code`.
export const UNDERAGE_CODE = 'UNDERAGE';
export const DATE_OF_BIRTH_REQUIRED_CODE = 'DATE_OF_BIRTH_REQUIRED';

// Whole years old today for a YYYY-MM-DD date, or null if the date isn't
// real (e.g. 30 February), is in the future, or is over 120 years ago.
export function ageFromDateOfBirth(dateOfBirth: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth);
  if (!match) {
    return null;
  }
  const [year, month, day] = match.slice(1).map(Number);

  const birth = new Date(year, month - 1, day);
  if (
    birth.getFullYear() !== year ||
    birth.getMonth() !== month - 1 ||
    birth.getDate() !== day
  ) {
    return null;
  }

  const now = new Date();
  const hadBirthdayThisYear =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  const age = now.getFullYear() - year - (hadBirthdayThisYear ? 0 : 1);
  return age < 0 || age > 120 || birth > now ? null : age;
}

// For form validation: an error message, or true when it's fine.
export function validateDateOfBirth(dateOfBirth: string): string | true {
  if (!dateOfBirth) {
    return 'Please enter your date of birth';
  }
  const age = ageFromDateOfBirth(dateOfBirth);
  if (age === null) {
    return 'Please enter a valid date of birth';
  }
  return age >= MINIMUM_AGE || UNDERAGE_MESSAGE;
}
