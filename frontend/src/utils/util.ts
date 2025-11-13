export const parseStrParam = (param: string | string[]): string => {
  return Array.isArray(param) ? decodeURIComponent(param[0]) : decodeURIComponent(param);
}

export const parseIntParam = (param: string | string[]): number => {
  return parseInt(parseStrParam(param), 10);
};

export const parseBooleanParam = (param: string | string[]): boolean => {
  return parseStrParam(param) == "true";
};