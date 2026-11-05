import React from 'react';
import { Image, Platform } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import ImagePage from '../app/image';
import { router } from '../navigation/router';

let mockUrl: unknown;
let mockPreview: unknown;
const prefetch = jest.spyOn(Image, 'prefetch');
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ url: mockUrl, preview: mockPreview }) }));
jest.mock('../navigation/router', () => ({ router: { goBackSafely: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0 }) }));
jest.mock('react-native-image-zoom-viewer', () => ({ imageUrls, onSwipeDown }: any) => {
 const { Text } = require('react-native');
 // Keeps its first url, like the real viewer keeps the first image's measurements.
 const [shown] = require('react').useState(imageUrls[0].url);
 return <Text onPress={onSwipeDown}>{shown}</Text>;
});
const url = 'https://image.tmdb.org/t/p/w500/a.jpg';
beforeEach(() => {
 mockUrl = url; mockPreview = undefined; jest.clearAllMocks();
 prefetch.mockImplementation(() => new Promise(() => {}));
});
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
test('a new url remounts the zoom viewer', () => {
 const ui = render(<ImagePage/>);
 mockUrl = 'https://image.tmdb.org/t/p/w500/b.jpg';
 ui.rerender(<ImagePage/>);
 expect(ui.getByText(mockUrl as string)).toBeTruthy();
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
  const ui = render(<ImagePage/>);
  expect(focus).toHaveBeenCalledTimes(1);
  ui.unmount();
 } finally {
  Platform.OS = platform;
  global.document = originalDocument;
 }
});

const original = 'https://image.tmdb.org/t/p/original/a.jpg';
test('shows the preview until the original finishes loading', async () => {
 let finish!: (value: boolean) => void;
 prefetch.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
 mockUrl = original; mockPreview = url;
 const ui = render(<ImagePage/>);
 expect(ui.getByText(url)).toBeTruthy();
 expect(ui.queryByText(original)).toBeNull();
 expect(prefetch).toHaveBeenCalledWith(original);
 await act(async () => { finish(true); });
 expect(ui.getByText(original)).toBeTruthy();
 expect(ui.queryByText(url)).toBeNull();
});
test.each(['reject', 'false'])('keeps the preview if the original fails (%s)', async failure => {
 if (failure === 'reject') prefetch.mockRejectedValueOnce(new Error('offline'));
 else prefetch.mockResolvedValueOnce(false);
 mockUrl = original; mockPreview = url;
 const ui = render(<ImagePage/>);
 await act(async () => {});
 expect(ui.getByText(url)).toBeTruthy();
 expect(ui.queryByText(original)).toBeNull();
});
test('ignores a late original download after the route changes', async () => {
 let finish!: (value: boolean) => void;
 prefetch.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
 mockUrl = original; mockPreview = url;
 const ui = render(<ImagePage/>);
 mockUrl = 'https://image.tmdb.org/t/p/original/b.jpg';
 mockPreview = 'https://image.tmdb.org/t/p/w500/b.jpg';
 ui.rerender(<ImagePage/>);
 await act(async () => { finish(true); });
 expect(ui.getByText(mockPreview as string)).toBeTruthy();
 expect(ui.queryByText(original)).toBeNull();
});
test.each(['https://evil.test/a.jpg', ['https://image.tmdb.org/a.jpg']])('ignores invalid preview %s', preview => {
 mockUrl = original; mockPreview = preview;
 expect(render(<ImagePage/>).getByText(original)).toBeTruthy();
 expect(prefetch).not.toHaveBeenCalled();
});
test('rejects a foreign original even with an allowed preview', () => {
 mockUrl = 'https://evil.test/a.jpg'; mockPreview = url;
 const ui = render(<ImagePage/>);
 expect(ui.getByText('Image unavailable')).toBeTruthy();
 expect(ui.queryByText(url)).toBeNull();
 expect(prefetch).not.toHaveBeenCalled();
});
test('does not prefetch when the preview and original are the same', () => {
 mockPreview = url;
 expect(render(<ImagePage/>).getByText(url)).toBeTruthy();
 expect(prefetch).not.toHaveBeenCalled();
});
