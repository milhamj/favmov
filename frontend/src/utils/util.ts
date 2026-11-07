import { COLORS } from "../styles/colors";

// TMDB repeats titles across pages, and repeated list keys make React pile up stale copies of the card
export const appendUnique = <T extends { id: number | string }>(list: T[], more: T[]): T[] => {
    const seen = new Set(list.map((item) => item.id));
    return [...list, ...more.filter((item) => !seen.has(item.id) && seen.add(item.id))];
};

export const parseStrParam = (param: string | string[]): string => {
  // useLocalSearchParams has already decoded the value.
  return (Array.isArray(param) ? param[0] : param) ?? '';
}

export const parseIntParam = (param: string | string[]): number => {
  return parseInt(parseStrParam(param), 10);
};

export const parseBooleanParam = (param: string | string[]): boolean => {
  return parseStrParam(param) == "true";
};

// TMDB reports 0 for titles nobody has rated yet; show those neutrally instead of as a bad score
export const displayRating = (rating: number | string): string | number => Number(rating) === 0 ? '–' : rating;

export const getRatingColor = (rating: number | string): string => {
  const value = Number(rating);
  if (value === 0) {
    return COLORS.secondaryText;
  } else if (value >= 7.0) {
    return COLORS.rating_green;
  } else if (value >= 5.0) {
    return COLORS.rating_yellow;
  } else {
    return COLORS.rating_red;
  }
}