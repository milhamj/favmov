import { COLORS } from "../styles/colors";

export const parseStrParam = (param: string | string[]): string => {
  return Array.isArray(param) ? decodeURIComponent(param[0]) : decodeURIComponent(param);
}

export const parseIntParam = (param: string | string[]): number => {
  return parseInt(parseStrParam(param), 10);
};

export const parseBooleanParam = (param: string | string[]): boolean => {
  return parseStrParam(param) == "true";
};

export const getRatingColor = (rating: number): string => {
  if (rating >= 7.0) {
    return COLORS.rating_green;
  } else if (rating >= 5.0) {
    return COLORS.rating_yellow;
  } else {
    return COLORS.rating_red;
  }
}