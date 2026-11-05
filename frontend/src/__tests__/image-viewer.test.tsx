import React from 'react';
import { Image } from 'react-native';
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
 expect(router.navigate).toHaveBeenCalledWith(routes.image(big));
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
 expect(router.navigate).toHaveBeenCalledWith(routes.image(big));
});
