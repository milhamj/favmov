import { getRatingColor, parseBooleanParam, parseIntParam, parseStrParam } from '../../utils/util';
import { COLORS } from '../../styles/colors';

describe('route param parsing', () => {
  test('takes the first value and decodes it', () => {
    expect(parseStrParam('Popular%20Movies')).toBe('Popular Movies');
    expect(parseStrParam(['a%20b', 'c'])).toBe('a b');
  });

  test('parses numbers and booleans', () => {
    expect(parseIntParam('42')).toBe(42);
    expect(parseIntParam('abc')).toBeNaN();
    expect(parseBooleanParam('true')).toBe(true);
    expect(parseBooleanParam('false')).toBe(false);
    expect(parseBooleanParam(undefined as any)).toBe(false);
  });

  test('KNOWN ISSUE: a missing param becomes the string "undefined"', () => {
    expect(parseStrParam(undefined as any)).toBe('undefined');
  });

  test('KNOWN ISSUE: a stray percent sign throws', () => {
    expect(() => parseStrParam('100%')).toThrow(URIError);
  });
});

test.each([
  [10, COLORS.rating_green],
  [7, COLORS.rating_green],
  [6.99, COLORS.rating_yellow],
  [5, COLORS.rating_yellow],
  [4.99, COLORS.rating_red],
  [0, COLORS.rating_red],
])('rating %s has the right color', (rating, color) => {
  expect(getRatingColor(rating)).toBe(color);
});
