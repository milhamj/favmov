import { COLORS } from '@/theme/colors';

// TMDB repeats titles across pages, and repeated list keys make React pile up stale copies of the card
export const appendUnique = <T extends { id: number | string }>(list: T[], more: T[]): T[] => {
  const seen = new Set(list.map((item) => item.id));
  return [...list, ...more.filter((item) => !seen.has(item.id) && seen.add(item.id))];
};

export const parseStrParam = (param: string | string[]): string => {
  // useLocalSearchParams has already decoded the value.
  return (Array.isArray(param) ? param[0] : param) ?? '';
};

// TMDB ids are positive, without leading zeros, and fit 32-bit integer columns.
export const parseTmdbId = (param: string | string[]): number | null => {
  const raw = parseStrParam(param);
  const id = Number(raw);
  return /^[1-9]\d*$/.test(raw) && id <= 2147483647 ? id : null;
};

export const parseBooleanParam = (param: string | string[]): boolean => {
  return parseStrParam(param) === 'true';
};

// TMDB reports 0 for titles nobody has rated yet; show those neutrally instead of as a bad score
export const displayRating = (rating: number | string): string =>
  Number(rating) === 0 ? '–' : Number(rating).toFixed(2);

// Fixed 'en' locale so the server render and the browser produce the same text
const compactCount = new Intl.NumberFormat('en', { notation: 'compact' });
export const displayCount = (count: number): string => compactCount.format(count);

export const getRatingColor = (rating: number | string): string => {
  const value = Number(Number(rating).toFixed(2)); // same rounding as displayRating, so text and color agree
  if (value === 0) {
    return COLORS.secondaryText;
  } else if (value >= 7.0) {
    return COLORS.ratingGood;
  } else if (value >= 5.0) {
    return COLORS.ratingAverage;
  } else {
    return COLORS.ratingBad;
  }
};
