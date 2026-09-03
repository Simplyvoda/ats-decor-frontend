// Shared password strength policy — used anywhere a new password is set
// (sign up, reset password, change password). Keep this in one place so the
// rule can't drift between screens or from what the backend enforces
// (see be/src/auth/dto/auth.dto.ts's PASSWORD_REGEX).
export const PASSWORD_REQUIREMENTS_MESSAGE =
  'At least 8 characters, with an uppercase letter, a lowercase letter, a number, and a special character';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const isStrongPassword = (password: string): boolean =>
  PASSWORD_REGEX.test(password);
