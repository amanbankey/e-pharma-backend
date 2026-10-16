// Shared password policy used across user and admin auth flows.
// Rule: at least 8 characters, with a letter, a number and a special character.
export function validatePassword(password) {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Za-z]/.test(password)) {
    return "Password must include at least one character (letter)";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include at least one special character";
  }
  return null;
}
