export const getPasswordResetIdentifier = (email: string) =>
  `password-reset:${email}`;
