import { calculateGridLayout } from '@/hooks/useGridLayout';
import { SPACING } from '@/theme/colors';

it.each([
  [0, 150, 2],
  [390, 150, 2],
  [1200, 150, 7],
  [1200, 200, 5],
])('lays out width %i with minimum %i in %i columns', (width, minimum, columns) => {
  expect(calculateGridLayout(width, minimum).numColumns).toBe(columns);
});

it('keeps at least two columns and fits rows into every usable measured width', () => {
  for (const minimum of [150, 200]) {
    for (let width = SPACING.medium; width <= 1920; width++) {
      const { numColumns, itemWidth } = calculateGridLayout(width, minimum);
      expect(numColumns).toBeGreaterThanOrEqual(2);
      expect(itemWidth).toBeGreaterThanOrEqual(0);
      expect(itemWidth * numColumns + SPACING.medium * (numColumns - 1)).toBeLessThanOrEqual(
        width + 1e-9,
      );
    }
  }
  expect(calculateGridLayout(0, 150)).toEqual({ numColumns: 2, itemWidth: 0 });
});
