import React from 'react';
import { Image } from 'react-native';
import { render, act, fireEvent } from '@testing-library/react-native';
import Screen from '../app/people/[id]';
import { fetchPeopleDetails } from '../services/peopleService';
import { Error as ApiError, Success } from '../model/apiResponse';
import { People } from '../model/peopleModel';
import { DEFAULT_MOVIE_POSTER } from '../model/movieModel';
import { routes } from '../navigation/routes';
import { router } from '../navigation/router';
let mockId = '1';
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: mockId }) }));
jest.mock('../navigation/router', () => ({ router: { goBackSafely: jest.fn(), navigate: jest.fn() } }));
jest.mock('../services/peopleService', () => ({ fetchPeopleDetails: jest.fn() }));
jest.mock('../components/people/PeopleMovieCreditView', () => 'Credit');
test('a malformed encoded id does not crash rendering', async () => {
 mockId = '100%';
 (fetchPeopleDetails as jest.Mock).mockResolvedValueOnce(new ApiError('offline'));
 const ui = render(<Screen/>);
 await act(async () => {});
 expect(fetchPeopleDetails).toHaveBeenCalledWith('100%');
 expect(ui.getByText('offline')).toBeTruthy();
 mockId = '1';
});
test('failed person lookup ends loading and Retry can succeed', async () => {
 (fetchPeopleDetails as jest.Mock).mockResolvedValueOnce(new ApiError('offline')).mockResolvedValueOnce(new Success(new People({ id: 1, name: 'Actor' })));
 const ui = render(<Screen/>);
 await act(async () => {});
 expect(ui.getByText('offline')).toBeTruthy();
 await act(async () => { fireEvent.press(ui.getByText('Retry')); });
 expect(ui.getAllByText('Actor')).toHaveLength(2);
});

test('404 shows not found instead of a permanent loader', async () => {
 (fetchPeopleDetails as jest.Mock).mockResolvedValue(new ApiError('missing', 404));
 const ui = render(<Screen/>);
 await act(async () => {});
 expect(ui.getByText('Person not found')).toBeTruthy();
 expect(ui.queryByText('Retry')).toBeNull();
});
test('a late response cannot replace the next person', async () => {
 let finish: any;
 mockId = '1';
 (fetchPeopleDetails as jest.Mock).mockImplementationOnce(() => new Promise(r => finish = r)).mockResolvedValueOnce(new Success(new People({ id: 2, name: 'Current' })));
 const ui = render(<Screen/>);
 mockId = '2';
 ui.rerender(<Screen/>);
 await act(async () => {});
 await act(async () => { finish(new Success(new People({ id: 1, name: 'Obsolete' }))); });
 expect(ui.queryByText('Obsolete')).toBeNull();
 expect(ui.getAllByText('Current')).toHaveLength(2);
});

test('tapping the photo opens the viewer', async () => {
 (fetchPeopleDetails as jest.Mock).mockResolvedValueOnce(new Success(new People({ id: 1, name: 'Actor' })));
 const ui = render(<Screen/>);
 await act(async () => {});
 fireEvent.press(ui.getByLabelText('View full image'));
 expect(router.navigate).toHaveBeenCalledWith(routes.image(DEFAULT_MOVIE_POSTER));
});

test('keeps the small person photo on the page and opens the original in the viewer', async () => {
 (fetchPeopleDetails as jest.Mock).mockResolvedValueOnce(new Success(new People({ id: 1, name: 'Actor', photoPath: '/person.jpg' })));
 const ui = render(<Screen/>);
 await act(async () => {});
 expect(ui.UNSAFE_getAllByType(Image).map(image => image.props.source.uri)).toEqual(['small//person.jpg']);
 fireEvent.press(ui.getByLabelText('View full image'));
 expect(router.navigate).toHaveBeenCalledWith(routes.image('big//person.jpg', 'small//person.jpg'));
});
