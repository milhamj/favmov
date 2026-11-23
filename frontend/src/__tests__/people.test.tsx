import { renderWithProviders as render } from '../../test/renderWithProviders';
import React from 'react';
import { Image } from 'react-native';
import { act, fireEvent } from '@testing-library/react-native';
import Screen from '@/app/people/[id]';
import { fetchPeopleDetails } from '@/features/people/peopleService';
import { ApiError } from '@/lib/apiError';
import { DEFAULT_MOVIE_POSTER } from '@/features/movies/movieModel';
import { routes } from '@/navigation/routes';
import { router } from '@/navigation/router';
import { person as makePeople } from '../../test/factories';
let mockId = '1';
jest.mock('expo-router', () => ({
  ...require('../../test/expoRouter'),
  useLocalSearchParams: () => ({ id: mockId }),
}));
jest.mock('@/navigation/router', () => ({
  router: { goBackSafely: jest.fn(), navigate: jest.fn() },
}));
jest.mock('@/features/people/peopleService', () => ({ fetchPeopleDetails: jest.fn() }));
jest.mock('@/features/people/PeopleMovieCreditView', () => 'Credit');
test('a malformed encoded id shows an invalid URL message without a request', async () => {
  mockId = '100%';
  const ui = render(<Screen />);
  await act(async () => {});
  expect(fetchPeopleDetails).not.toHaveBeenCalled();
  expect(ui.getByText('Invalid person URL')).toBeTruthy();
  mockId = '1';
});
test('failed person lookup ends loading and Retry can succeed', async () => {
  (fetchPeopleDetails as jest.Mock)
    .mockRejectedValueOnce(new ApiError('offline'))
    .mockResolvedValueOnce(makePeople({ id: 1, name: 'Actor' }));
  const ui = render(<Screen />);
  await act(async () => {});
  expect(ui.getByText('offline')).toBeTruthy();
  await act(async () => {
    fireEvent.press(ui.getByText('Retry'));
  });
  expect(ui.getAllByText('Actor')).toHaveLength(2);
});

test('404 shows not found instead of a permanent loader', async () => {
  (fetchPeopleDetails as jest.Mock).mockRejectedValue(new ApiError('missing', 404));
  const ui = render(<Screen />);
  await act(async () => {});
  expect(ui.getByText('Person not found')).toBeTruthy();
  expect(ui.queryByText('Retry')).toBeNull();
});
test('a late response cannot replace the next person', async () => {
  let finish: any;
  mockId = '1';
  (fetchPeopleDetails as jest.Mock)
    .mockImplementationOnce(() => new Promise((r) => (finish = r)))
    .mockResolvedValueOnce(makePeople({ id: 2, name: 'Current' }));
  const ui = render(<Screen />);
  mockId = '2';
  ui.rerender(<Screen />);
  await act(async () => {});
  await act(async () => {
    finish(makePeople({ id: 1, name: 'Obsolete' }));
  });
  expect(ui.queryByText('Obsolete')).toBeNull();
  expect(ui.getAllByText('Current')).toHaveLength(2);
});

test('tapping the photo opens the viewer', async () => {
  (fetchPeopleDetails as jest.Mock).mockResolvedValueOnce(makePeople({ id: 1, name: 'Actor' }));
  const ui = render(<Screen />);
  await act(async () => {});
  fireEvent.press(ui.getByLabelText(/View full photo of /));
  expect(router.navigate).toHaveBeenCalledWith(routes.image(DEFAULT_MOVIE_POSTER));
});

test('keeps the small person photo on the page and opens the original in the viewer', async () => {
  (fetchPeopleDetails as jest.Mock).mockResolvedValueOnce(
    makePeople({ id: 1, name: 'Actor', photoPath: '/person.jpg' }),
  );
  const ui = render(<Screen />);
  await act(async () => {});
  expect(ui.UNSAFE_getAllByType(Image).map((image) => image.props.source.uri)).toEqual([
    'small//person.jpg',
  ]);
  fireEvent.press(ui.getByLabelText(/View full photo of /));
  expect(router.navigate).toHaveBeenCalledWith(
    routes.image('big//person.jpg', 'small//person.jpg'),
  );
});

jest.mock('@/features/auth/AuthProvider', () => ({
  AuthProvider: ({ children }: any) => children,
}));
