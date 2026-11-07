import React from 'react';
import { render } from '@testing-library/react-native';
import RootLayout from '../app/_layout';
import { SeoHead } from '../components/SeoHead';

let mockSegments = ['+not-found'];
jest.mock('expo-router', () => ({
  useSegments: () => mockSegments,
  Stack: Object.assign(() => null, { Screen: () => null }),
}));
jest.mock('react-native-elements', () => ({ getIconType: () => ({ loadFont: jest.fn() }) }));
jest.mock('../components/SeoHead', () => ({ SeoHead: jest.fn(() => null) }));

test('resets not-found metadata when navigating to a normal route', () => {
  const ui = render(<RootLayout />);
  expect(SeoHead).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Page not found | FavMov' }), expect.anything());
  mockSegments = ['(tabs)'];
  ui.rerender(<RootLayout />);
  expect(SeoHead).toHaveBeenLastCalledWith(expect.objectContaining({ title: undefined, description: undefined }), expect.anything());
});
