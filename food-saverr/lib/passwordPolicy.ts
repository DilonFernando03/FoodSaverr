export interface PasswordValidationResult {
  valid: boolean;
  message?: string;
}

const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;
const UPPERCASE_REGEX = /[A-Z]/;
const MAX_CHAR_REPEAT = 4;

export function validatePassword(password: string): PasswordValidationResult {
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long.',
    };
  }

  if (!UPPERCASE_REGEX.test(password)) {
    return {
      valid: false,
      message: 'Password must include at least one uppercase letter.',
    };
  }

  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return {
      valid: false,
      message: 'Password must include at least one special character.',
    };
  }

  const charCounts: Record<string, number> = {};
  for (const char of password) {
    charCounts[char] = (charCounts[char] || 0) + 1;
    if (charCounts[char] > MAX_CHAR_REPEAT) {
      return {
        valid: false,
        message: 'Password cannot use the same character more than four times.',
      };
    }
  }

  return { valid: true };
}




