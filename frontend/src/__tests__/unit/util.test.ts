import {
  appendUnique,
  displayCount,
  displayRating,
  getRatingColor,
  parseBooleanParam,
  parseStrParam,
  parseTmdbId,
} from '@/lib/util';
import { COLORS } from '@/theme/colors';

describe('route param parsing', () => {
  test('takes the first value, leaving it as the router decoded it', () => {
    expect(parseStrParam('Popular Movies')).toBe('Popular Movies');
    expect(parseStrParam(['a b', 'c'])).toBe('a b');
    expect(parseStrParam('100%')).toBe('100%');
  });

  test('a missing param is empty', () => {
    expect(parseStrParam(undefined as any)).toBe('');
  });

  test('parses numbers and booleans', () => {
    expect(parseTmdbId('42')).toBe(42);
    for (const bad of ['abc', '12abc', '1.5', '1e3', '0', '007', '-1', ' 1', '2147483648', ''])
      expect(parseTmdbId(bad)).toBeNull();
    expect(parseBooleanParam('true')).toBe(true);
    expect(parseBooleanParam('false')).toBe(false);
    expect(parseBooleanParam(undefined as any)).toBe(false);
  });
});

test('appendUnique drops repeated ids, across and within pages', () => {
  const titles = appendUnique([{ id: 1 }], [{ id: 1 }, { id: 2 }, { id: 2 }]);
  expect(titles.map((title) => title.id)).toEqual([1, 2]);
});

test.each([
  [10, COLORS.ratingGood],
  [7, COLORS.ratingGood],
  [6.99, COLORS.ratingAverage],
  [5, COLORS.ratingAverage],
  [4.99, COLORS.ratingBad],
  [0.5, COLORS.ratingBad],
  [6.996, COLORS.ratingGood], // displays as 7.00
  [4.996, COLORS.ratingAverage], // displays as 5.00
  [0, COLORS.secondaryText],
  ['0.00' as any, COLORS.secondaryText],
])('rating %s has the right color', (rating, color) => {
  expect(getRatingColor(rating)).toBe(color);
});

test('unrated titles show a dash, rated ones keep their number', () => {
  expect(displayRating('0.00')).toBe('–');
  expect(displayRating(0)).toBe('–');
  expect(displayRating('7.12')).toBe('7.12');
  expect(displayRating(7.456)).toBe('7.46');
  expect(displayRating(8)).toBe('8.00');
});

test('review counts use the short form', () => {
  expect(displayCount(0)).toBe('0');
  expect(displayCount(999)).toBe('999');
  expect(displayCount(1234)).toBe('1.2K');
  expect(displayCount(35421)).toBe('35K');
  expect(displayCount(1250000)).toBe('1.3M');
});
