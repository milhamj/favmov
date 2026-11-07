import { act, render, renderHook } from '@testing-library/react-native';
import { StyleSheet, TouchableOpacity } from 'react-native';
import CollectionCard from '../components/CollectionCard';
import { useGridLayout } from '../hooks/useGridLayout';
import { Collection } from '../model/collectionModel';
import { COLORS } from '../styles/colors';

it('recalculates two equal cells from the current list width, including an odd final cell', () => {
  const { result } = renderHook(() => useGridLayout());
  act(() => result.current.onContentSizeChange(288));
  expect(result.current.itemWidth).toBe(136);
  act(() => result.current.onContentSizeChange(608));
  expect(result.current.itemWidth).toBe(296);
  expect(result.current.itemWidth * 2 + 16).toBe(608);
});

it('keeps collection colors stable through remounts and ID changes', () => {
  const color = () => StyleSheet.flatten(view.UNSAFE_getByType(TouchableOpacity).props.style).backgroundColor;
  const view = render(<CollectionCard collection={new Collection('c1', 'One')} onPress={() => {}} />);
  const original = color();
  view.rerender(<CollectionCard collection={new Collection('c2', 'Two')} onPress={() => {}} />);
  const other = color();
  expect(other).not.toBe(original);
  view.unmount();
  const remount = render(<CollectionCard collection={new Collection('c1', 'One renamed')} onPress={() => {}} />);
  expect(StyleSheet.flatten(remount.UNSAFE_getByType(TouchableOpacity).props.style).backgroundColor).toBe(original);
});

const luminance = (hex: string) => hex.slice(1).match(/../g)!.map(value => {
  const channel = parseInt(value, 16) / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);

it('keeps secondary, link and semantic rating text readable on page and field surfaces', () => {
  // Rating yellow is bold text beside a yellow star; true yellow can't reach 4.5:1 on white, so it gets the 3:1 large-text bar
  const minimum = (text: string) => text === COLORS.rating_yellow ? 3 : 4.5;
  for (const text of [COLORS.secondaryText, COLORS.accentText, COLORS.rating_green, COLORS.rating_red, COLORS.rating_yellow]) {
    for (const surface of [COLORS.page, COLORS.field]) {
      expect((luminance(surface) + 0.05) / (luminance(text) + 0.05)).toBeGreaterThanOrEqual(minimum(text));
    }
  }
});
