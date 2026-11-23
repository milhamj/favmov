import { act, render, renderHook } from '@testing-library/react-native';
import { StyleSheet, View } from 'react-native';
import CollectionCard from '@/features/collections/CollectionCard';
import { useGridLayout } from '@/hooks/useGridLayout';
import { COLORS } from '@/theme/colors';
import { collection as makeCollection } from '../../test/factories';

it('recalculates two equal cells from the current list width, including an odd final cell', () => {
  const { result } = renderHook(() => useGridLayout(300));
  act(() => result.current.onContentSizeChange(288));
  expect(result.current.itemWidth).toBe(136);
  act(() => result.current.onContentSizeChange(608));
  expect(result.current.itemWidth).toBe(296);
  expect(result.current.itemWidth * 2 + 16).toBe(608);
});

it('keeps collection colors stable through remounts and ID changes', () => {
  const color = () => StyleSheet.flatten(view.UNSAFE_getByType(View).props.style).backgroundColor;
  const view = render(
    <CollectionCard
      collection={makeCollection('c1', 'One')}
      link={{ href: '/collection/c', onPress: () => {} }}
    />,
  );
  const original = color();
  view.rerender(
    <CollectionCard
      collection={makeCollection('c2', 'Two')}
      link={{ href: '/collection/c', onPress: () => {} }}
    />,
  );
  const other = color();
  expect(other).not.toBe(original);
  view.unmount();
  const remount = render(
    <CollectionCard
      collection={makeCollection('c1', 'One renamed')}
      link={{ href: '/collection/c', onPress: () => {} }}
    />,
  );
  expect(StyleSheet.flatten(remount.UNSAFE_getByType(View).props.style).backgroundColor).toBe(
    original,
  );
});

const luminance = (hex: string) =>
  hex
    .slice(1)
    .match(/../g)!
    .map((value) => {
      const channel = parseInt(value, 16) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);

it('keeps secondary, link and semantic rating text readable on page and field surfaces', () => {
  // Rating yellow is a deliberate design choice (bold text beside a yellow star): it stays near 2.3:1 so it still reads as yellow
  const minimum = (text: string) => (text === COLORS.ratingAverage ? 2.2 : 4.5);
  for (const text of [
    COLORS.secondaryText,
    COLORS.accentText,
    COLORS.ratingGood,
    COLORS.ratingBad,
    COLORS.ratingAverage,
  ]) {
    for (const surface of [COLORS.page, COLORS.field]) {
      expect((luminance(surface) + 0.05) / (luminance(text) + 0.05)).toBeGreaterThanOrEqual(
        minimum(text),
      );
    }
  }
});
