import React from 'react';
import { Platform } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import ImagePage from '../app/image';
import { router } from '../navigation/router';

let mockUrl: unknown;
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ url: mockUrl }) }));
jest.mock('../navigation/router', () => ({ router: { goBackSafely: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0 }) }));
jest.mock('react-native-image-zoom-viewer', () => ({ imageUrls, onSwipeDown }: any) => {
 const { Text } = require('react-native');
 return <Text onPress={onSwipeDown}>{imageUrls[0].url}</Text>;
});
const url = 'https://image.tmdb.org/t/p/w500/a.jpg';
beforeEach(() => { mockUrl = url; jest.clearAllMocks(); });
test('shows an allowed image', () => {
 expect(render(<ImagePage/>).getByText(url)).toBeTruthy();
});
test('rejects a foreign url without loading it', () => {
 mockUrl = 'https://evil.test/x.jpg';
 const ui = render(<ImagePage/>);
 expect(ui.getByText('Image unavailable')).toBeTruthy();
 expect(ui.queryByText(mockUrl as string)).toBeNull();
});
test('missing url shows unavailable', () => {
 mockUrl = undefined;
 expect(render(<ImagePage/>).getByText('Image unavailable')).toBeTruthy();
});
test('close button goes back', () => {
 fireEvent.press(render(<ImagePage/>).getByLabelText('Close image'));
 expect(router.goBackSafely).toHaveBeenCalledTimes(1);
});
test('a second close before unmount does not pop the page underneath', () => {
 const ui = render(<ImagePage/>);
 fireEvent.press(ui.getByLabelText('Close image'));
 fireEvent.press(ui.getByLabelText('Close image'));
 fireEvent.press(ui.getByText(url));
 expect(router.goBackSafely).toHaveBeenCalledTimes(1);
});
test('swipe down goes back', () => {
 fireEvent.press(render(<ImagePage/>).getByText(url));
 expect(router.goBackSafely).toHaveBeenCalledTimes(1);
});

test('Escape closes on web and removes its listener on unmount', () => {
 const platform = Platform.OS;
 const originalDocument = global.document;
 const addEventListener = jest.fn();
 const removeEventListener = jest.fn();
 Platform.OS = 'web';
 global.document = { addEventListener, removeEventListener } as any;
 try {
  const ui = render(<ImagePage/>);
  const listener = addEventListener.mock.calls.find(([type]) => type === 'keyup')[1];
  listener({ key: 'Enter' });
  expect(router.goBackSafely).not.toHaveBeenCalled();
  listener({ key: 'Escape' });
  expect(router.goBackSafely).toHaveBeenCalledTimes(1);
  ui.unmount();
  expect(removeEventListener).toHaveBeenCalledWith('keyup', listener);
 } finally {
  Platform.OS = platform;
  global.document = originalDocument;
 }
});

test('moves focus to the close button on web, as the old Modal did', () => {
 const platform = Platform.OS;
 const originalDocument = global.document;
 const { focus } = require('react-native/jest/MockNativeMethods');
 Platform.OS = 'web';
 global.document = { addEventListener: jest.fn(), removeEventListener: jest.fn() } as any;
 try {
  render(<ImagePage/>);
  expect(focus).toHaveBeenCalledTimes(1);
 } finally {
  Platform.OS = platform;
  global.document = originalDocument;
 }
});
