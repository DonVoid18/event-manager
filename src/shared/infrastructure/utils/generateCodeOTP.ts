export const generateCodeOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const getExpirationTime = (minutes: number = 15): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

export const TIME_EXPIRATION_MINUTES = 15;
