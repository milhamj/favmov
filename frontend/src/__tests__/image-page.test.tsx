import React from 'react';
import { Image, Platform } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import ImagePage from '../app/image';
import ZoomImageViewer from 'react-native-image-zoom-viewer';
import { router } from '../navigation/router';

let mockUrl: unknown;
let mockPreview: unknown;
const mockViewerMount = jest.fn();
const prefetch = jest.spyOn(Image, 'prefetch');
const getSize = jest.spyOn(Image, 'getSize');
let mockWindow = { width: 1280, height: 800, scale: 1, fontScale: 1 };
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => mockWindow }));
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ url: mockUrl, preview: mockPreview }) }));
jest.mock('../navigation/router', () => ({ router: { goBackSafely: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0 }) }));
jest.mock('react-native-image-zoom-viewer', () => jest.fn(({ imageUrls, onSwipeDown }: any) => {
 const { Text } = require('react-native');
 // The real viewer retains its first dimensions but renders updated image sources.
 const [size] = require('react').useState(imageUrls[0]);
 require('react').useEffect(() => { mockViewerMount(); }, []);
 return <Text testID="zoom-viewer" accessibilityValue={{ text: JSON.stringify({ width: size.width, height: size.height }) }} onPress={onSwipeDown}>{imageUrls[0].url}</Text>;
}));
const url = 'https://image.tmdb.org/t/p/w500/a.jpg';
beforeEach(() => {
 mockUrl = url; mockPreview = undefined; jest.clearAllMocks();
 prefetch.mockImplementation(() => new Promise(() => {}));
 getSize.mockImplementation((_uri, success) => success(500, 750));
 mockWindow = { width: 1280, height: 800, scale: 1, fontScale: 1 };
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
 expect(mockViewerMount).toHaveBeenCalledTimes(2);
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

test('switches to the original when web prefetch succeeds without a return value', async () => {
 (prefetch as jest.Mock).mockResolvedValueOnce(undefined);
 mockUrl = original; mockPreview = url;
 const ui = render(<ImagePage/>);
 await act(async () => {});
 expect(ui.getByText(original)).toBeTruthy();
});

const displayedImage = () => (ZoomImageViewer as unknown as jest.Mock).mock.lastCall[0].imageUrls[0];
test.each([[500, 250, 1280, 640], [500, 750, 800 * 2 / 3, 800], [2500, 1250, 1280, 640]])(
 'fits a %s x %s image to the viewport without cropping', (width, height, expectedWidth, expectedHeight) => {
  getSize.mockImplementation((_uri, success) => success(width, height));
  render(<ImagePage/>);
  expect(displayedImage().width).toBeCloseTo(expectedWidth);
  expect(displayedImage().height).toBeCloseTo(expectedHeight);
 });
test('preview and original have the same fitted size', async () => {
 getSize.mockImplementation((uri, success) => uri === original ? success(2000, 1000) : success(500, 250));
 let finish!: (value: boolean) => void;
 prefetch.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
 mockUrl = original; mockPreview = url;
 render(<ImagePage/>);
 expect(displayedImage()).toMatchObject({ url, width: 1280, height: 640 });
 await act(async () => { finish(true); });
 expect(displayedImage()).toMatchObject({ url: original, width: 1280, height: 640 });
});
test('refits and remounts when only the viewport height changes', () => {
 const ui = render(<ImagePage/>);
 mockWindow = { ...mockWindow, height: 600 };
 ui.rerender(<ImagePage/>);
 expect(displayedImage().width).toBeCloseTo(400);
 expect(displayedImage().height).toBeCloseTo(600);
});
test('a late preview measurement cannot replace a measured original', async () => {
 const callbacks = new Map<string, (width: number, height: number) => void>();
 getSize.mockImplementation((uri, success) => { callbacks.set(uri, success); });
 prefetch.mockResolvedValueOnce(true);
 mockUrl = original; mockPreview = url;
 const ui = render(<ImagePage/>);
 await act(async () => {});
 act(() => callbacks.get(original)!(2000, 1000));
 act(() => callbacks.get(url)!(500, 250));
 expect(ui.getByText(original)).toBeTruthy();
 expect(ui.queryByText(url)).toBeNull();
});
test('keeps the preview if original dimensions cannot be read', async () => {
 getSize.mockImplementation((uri, success, failure) => {
  if (uri === original) failure?.(new Error('offline'));
  else success(500, 250);
 });
 prefetch.mockResolvedValueOnce(true);
 mockUrl = original; mockPreview = url;
 const ui = render(<ImagePage/>);
 await act(async () => {});
 expect(ui.getByText(url)).toBeTruthy();
});

test('upgrades resolution without remounting the viewer or resetting its geometry', async () => {
 getSize.mockImplementation((uri, success) => uri === original ? success(2560, 1440) : success(500, 281));
 let finish!: (value: boolean) => void;
 prefetch.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
 mockUrl = original; mockPreview = url;
 const ui = render(<ImagePage/>);
 const geometry = ui.getByTestId('zoom-viewer').props.accessibilityValue.text;
 expect(mockViewerMount).toHaveBeenCalledTimes(1);
 await act(async () => { finish(true); });
 expect(ui.getByText(original)).toBeTruthy();
 expect(mockViewerMount).toHaveBeenCalledTimes(1);
 expect(ui.getByTestId('zoom-viewer').props.accessibilityValue.text).toBe(geometry);
});
