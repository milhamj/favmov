import { FAVMOV_NODE_ENV } from '@env';

/**
 * Checks if the current environment is development
 * @returns {boolean} True if the environment is development, false otherwise
 */
export const isDevelopment = (): boolean => {
  return FAVMOV_NODE_ENV === 'development';
};