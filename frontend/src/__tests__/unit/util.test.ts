import { appendUnique, displayRating, getRatingColor, parseBooleanParam, parseIntParam, parseStrParam } from '../../utils/util';
import { COLORS } from '../../styles/colors';

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
    expect(parseIntParam('42')).toBe(42);
    expect(parseIntParam('abc')).toBeNaN();
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
  [10, COLORS.rating_green],
  [7, COLORS.rating_green],
  [6.99, COLORS.rating_yellow],
  [5, COLORS.rating_yellow],
  [4.99, COLORS.rating_red],
  [0.5, COLORS.rating_red],
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
