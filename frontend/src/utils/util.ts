import { NODE_ENV } from '@env';

/**
 * Checks if the current environment is development
 * @returns {boolean} True if the environment is development, false otherwise
 */
export const isDevelopment = (): boolean => {
  return NODE_ENV === 'development';
};