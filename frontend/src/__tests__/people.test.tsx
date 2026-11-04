import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import Screen from '../app/people/[id]';
import { fetchPeopleDetails } from '../services/peopleService';
import { Error as ApiError, Success } from '../model/apiResponse';
import { People } from '../model/peopleModel';
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: '1' }) }));
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
