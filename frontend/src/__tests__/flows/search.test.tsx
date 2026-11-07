import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { FlatList } from 'react-native';
import SearchPage from '../../app/search';
import { Error as ApiError, Success } from '../../model/apiResponse';
import { Movie } from '../../model/movieModel';
import { People } from '../../model/peopleModel';
import { SearchMovieResponse, SearchPeopleResponse } from '../../model/searchResponse';
import { searchMovie } from '../../services/movieService';
import { searchPeople } from '../../services/peopleService';
import { MovieStore } from '../../stores/movieStore';
import { router } from '../../../test/expoRouter';

jest.mock('expo-router', () => require('../../../test/expoRouter'));
jest.mock('../../services/movieService', () => ({ searchMovie: jest.fn(), fetchTrendingMovies: jest.fn(), fetchTrendingShows: jest.fn(), fetchPopularMovies: jest.fn(), fetchFavoriteMovies: jest.fn(), fetchMovieDetails: jest.fn() }));
jest.mock('../../services/peopleService', () => ({ searchPeople: jest.fn(), fetchPeopleDetails: jest.fn() }));

const findMovies = searchMovie as jest.Mock;
const findPeople = searchPeople as jest.Mock;
const results = (titles: string[], totalPages = 1) =>
  new Success(new SearchMovieResponse(titles.map((title, index) => new Movie({ id: index + 1, title })), totalPages));

const settle = () => act(async () => { await jest.advanceTimersByTimeAsync(300); });
const type = async (text: string, placeholder = 'Type any Movie title...') => {
  fireEvent.changeText(screen.getByPlaceholderText(placeholder), text);
  await settle();
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  MovieStore.clear();
  findMovies.mockResolvedValue(results(['Up']));
  render(<SearchPage />);
});
afterEach(() => jest.useRealTimers());

test('starts with a prompt and no request', async () => {
  await settle();
  expect(screen.getByText('Type any Movie title...')).toBeTruthy();
  expect(screen.getByLabelText('Search')).toBeTruthy();
  expect(findMovies).not.toHaveBeenCalled();
});

test('waits for typing to stop before searching', async () => {
  const input = screen.getByPlaceholderText('Type any Movie title...');
  fireEvent.changeText(input, 'u');
  act(() => { jest.advanceTimersByTime(200); });
  fireEvent.changeText(input, 'up');
  await settle();

  expect(findMovies).toHaveBeenCalledTimes(1);
  expect(findMovies).toHaveBeenCalledWith('up', 1, false);
  expect(screen.getByText('Up')).toBeTruthy();
});

test('hides the filter while typing and brings it back with the results', async () => {
  fireEvent.changeText(screen.getByPlaceholderText('Type any Movie title...'), 'up');
  expect(screen.queryByText('TV Show')).toBeNull();
  await settle();
  expect(screen.getByText('TV Show')).toBeTruthy();
});

test('opens a result with its data cached for the detail page', async () => {
  await type('up');
  fireEvent.press(screen.getByText('Up'));
  expect(MovieStore.getCachedMovie('1')?.title).toBe('Up');
  expect(router.navigate).toHaveBeenCalledWith('/movie/1');
});

test('searches TV shows after switching the filter', async () => {
  fireEvent.press(screen.getByText('TV Show'));
  await type('lost', 'Type any TV Show title...');
  expect(findMovies).toHaveBeenCalledWith('lost', 1, true);
});

test('searches people and opens their page', async () => {
  findPeople.mockResolvedValue(new Success(new SearchPeopleResponse([new People({ id: 9, name: 'Ann' })], 1)));
  fireEvent.press(screen.getByText('People'));
  await type('ann', 'Type any name...');
  expect(findPeople).toHaveBeenCalledWith('ann', 1);
  fireEvent.press(screen.getByText('Ann'));
  expect(router.navigate).toHaveBeenCalledWith('/people/9');
});

test('repeats the search when the filter changes', async () => {
  await type('up');
  fireEvent.press(screen.getByText('TV Show'));
  await settle();
  expect(findMovies).toHaveBeenLastCalledWith('up', 1, true);
});

test('says when nothing matched', async () => {
  findMovies.mockResolvedValue(results([]));
  await type('zzz');
  expect(screen.getByText('No results found.')).toBeTruthy();
});

test('loads more pages at the end of the list, and stops at the last', async () => {
  findMovies.mockResolvedValue(results(['First'], 2));
  await type('up');
  findMovies.mockResolvedValue(new Success(new SearchMovieResponse([new Movie({ id: 2, title: 'Second' })], 2)));

  const list = screen.UNSAFE_getByType(FlatList);
  await act(async () => { list.props.onEndReached(); });
  expect(findMovies).toHaveBeenLastCalledWith('up', 2, false);
  await waitFor(() => expect(screen.getByText('Second')).toBeTruthy());
  expect(screen.getByText('First')).toBeTruthy();

  await act(async () => { screen.UNSAFE_getByType(FlatList).props.onEndReached(); });
  expect(findMovies).toHaveBeenCalledTimes(2);
});

test('goes back from the top bar', () => {
  fireEvent.press(screen.getByText('arrow-back'));
  expect(router.back).toHaveBeenCalled();
});

test('a failed search offers a retry that recovers', async () => {
  findMovies.mockResolvedValue(new ApiError('Failed to search movie'));
  await type('up');
  expect(screen.getByText('Unable to load results')).toBeTruthy();
  expect(screen.queryByText('No results found.')).toBeNull();

  findMovies.mockResolvedValue(results(['Up']));
  fireEvent.press(screen.getByText('Retry'));
  await settle();
  expect(screen.getByText('Up')).toBeTruthy();
});

test('a failed later page keeps the results and retries that page', async () => {
  findMovies.mockResolvedValue(results(['First'], 2));
  await type('up');
  findMovies.mockResolvedValue(new ApiError('Failed'));
  await act(async () => { screen.UNSAFE_getByType(FlatList).props.onEndReached(); });
  expect(screen.getByText('First')).toBeTruthy();

  findMovies.mockResolvedValue(results(['First', 'Second'], 2));
  fireEvent.press(screen.getByText('Retry'));
  await settle();
  expect(findMovies).toHaveBeenLastCalledWith('up', 2, false);
  expect(screen.getByText('Second')).toBeTruthy();
});

test('a title repeated across pages shows once', async () => {
  findMovies.mockResolvedValue(results(['First'], 2));
  await type('up');
  findMovies.mockResolvedValue(results(['First'], 2));
  await act(async () => { screen.UNSAFE_getByType(FlatList).props.onEndReached(); });
  expect(screen.getAllByText('First')).toHaveLength(1);
});

test('text typed during a running search replaces it', async () => {
  let finish = (_: unknown) => {};
  findMovies.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
  await type('first');
  findMovies.mockResolvedValue(results(['Second result']));
  await type('second');
  await act(async () => { finish(results(['First result'])); });

  expect(findMovies).toHaveBeenLastCalledWith('second', 1, false);
  expect(screen.getByText('Second result')).toBeTruthy();
  expect(screen.queryByText('First result')).toBeNull();
});

 test('keeps odd movie cells half-width when the list resizes', async () => {
  findMovies.mockResolvedValue(results(['One', 'Two', 'Three']));
  await type('one');
  const list = () => screen.UNSAFE_getByType(FlatList);
  // The outer width includes a 15px classic scrollbar; content width does not.
  fireEvent(list(), 'layout', { nativeEvent: { layout: { width: 303 } } });
  fireEvent(list(), 'contentSizeChange', 288, 1200);
  for (let index = 0; index < 3; index++) {
    expect(list().props.renderItem({ item: list().props.data[index], index }).props.style.width).toBe(136);
  }
  fireEvent(list(), 'contentSizeChange', 608, 1200);
  expect(list().props.renderItem({ item: list().props.data[2], index: 2 }).props.style.width).toBe(296);
});
