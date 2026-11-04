import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import Screen from '../app/people/[id]';
import { fetchPeopleDetails } from '../services/peopleService';
import { Error as ApiError, Success } from '../model/apiResponse';
import { People } from '../model/peopleModel';
let mockId = '1';
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: mockId }) }));
jest.mock('../navigation/router', () => ({ router: { goBackSafely: jest.fn() } }));
jest.mock('../services/peopleService', () => ({ fetchPeopleDetails: jest.fn() }));
jest.mock('../components/people/PeopleMovieCreditView', () => 'Credit');
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
 expect(ui.getByText('Retry')).toBeTruthy();
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
