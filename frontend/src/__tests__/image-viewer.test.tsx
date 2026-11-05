import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import ImageViewer from '../components/ImageViewer';
import { router } from '../navigation/router';
import { routes } from '../navigation/routes';

jest.mock('../navigation/router', () => ({ router: { navigate: jest.fn() } }));
const small = 'https://image.tmdb.org/t/p/w500/a.jpg';
const big = 'https://image.tmdb.org/t/p/original/a.jpg';
beforeEach(() => jest.clearAllMocks());
test('opens the big image when there is one', () => {
 const ui = render(<ImageViewer smallImageUrl={small} bigImageUrl={big}/>);
 fireEvent.press(ui.getByLabelText('View full image'));
 expect(router.navigate).toHaveBeenCalledWith(routes.image(big, small));
});
test('falls back to the small image', () => {
 const ui = render(<ImageViewer smallImageUrl={small}/>);
 fireEvent.press(ui.getByLabelText('View full image'));
 expect(router.navigate).toHaveBeenCalledWith(routes.image(small));
});
test('uses a caller label so several images on one page stay distinguishable', () => {
 const ui = render(<ImageViewer smallImageUrl={small} accessibilityLabel="View poster"/>);
 expect(ui.getByLabelText('View poster')).toBeTruthy();
 expect(ui.queryByLabelText('View full image')).toBeNull();
});

test('opens a viewer-only image without loading it in the thumbnail', () => {
 const ui = render(<ImageViewer smallImageUrl={small} fullImageUrl={big}/>);
 expect(ui.UNSAFE_getAllByType(Image).map(image => image.props.source.uri)).toEqual([small]);
 fireEvent.press(ui.getByLabelText('View full image'));
 expect(router.navigate).toHaveBeenCalledWith(routes.image(big, small));
});

test('replaces the small image only after a successful large image load and preserves image styles', () => {
 const ui = render(<ImageViewer smallImageUrl={small} bigImageUrl={big} imageStyle={{ borderRadius: 8 }}/>);
 const images = ui.UNSAFE_getAllByType(Image);
 expect(images.map(image => image.props.source.uri)).toEqual([small, big]);
 fireEvent(images[1], 'load');
 const loaded = ui.UNSAFE_getAllByType(Image);
 expect(loaded.map(image => image.props.source.uri)).toEqual([big]);
 expect(StyleSheet.flatten(loaded[0].props.style).borderRadius).toBe(8);
});
test('retains the small image if loading the large image fails', () => {
 const ui = render(<ImageViewer smallImageUrl={small} bigImageUrl={big}/>);
 const large = ui.UNSAFE_getAllByType(Image)[1];
 fireEvent(large, 'error', { nativeEvent: { error: 'offline' } });
 fireEvent(large, 'loadEnd');
 expect(ui.UNSAFE_getAllByType(Image).map(image => image.props.source.uri)).toContain(small);
});

test('shows the new small image while a different original loads', () => {
 const ui = render(<ImageViewer smallImageUrl={small} bigImageUrl={big}/>);
 fireEvent(ui.UNSAFE_getAllByType(Image)[1], 'load');
 const nextSmall = 'https://image.tmdb.org/t/p/w500/next.jpg';
 const nextBig = 'https://image.tmdb.org/t/p/original/next.jpg';
 ui.rerender(<ImageViewer smallImageUrl={nextSmall} bigImageUrl={nextBig}/>);
 expect(ui.UNSAFE_getAllByType(Image).map(image => image.props.source.uri)).toEqual([nextSmall, nextBig]);
});
