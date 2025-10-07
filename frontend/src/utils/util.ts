import { FAVMOV_NODE_ENV } from '@env';

/**
 * Checks if the current environment is development
 * @returns {boolean} True if the environment is development, false otherwise
 */
export const isDevelopment = (): boolean => {
  return FAVMOV_NODE_ENV === 'development';
};

export const parseStrParam = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
}

export const parseIntParam = (param: string | string[]): number => {
  return parseInt(parseStrParam(param), 10);
};

export const parseBooleanParam = (param: string | string[]): boolean => {
  return parseStrParam(param) == "true";
};