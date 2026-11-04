import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { FlatList } from 'react-native';
import Search from '../app/search';
import Explore from '../app/explore';
import { searchMovie, fetchTrendingMovies } from '../services/movieService';
import { Success, Error as ApiError } from '../model/apiResponse';
import { Movie } from '../model/movieModel';
jest.mock('../services/movieService', () => ({ searchMovie: jest.fn(), fetchTrendingMovies: jest.fn() }));
jest.mock('../services/peopleService', () => ({ searchPeople: jest.fn() }));
jest.mock('../navigation/router', () => ({ router: { navigate: jest.fn(), goBackSafely: jest.fn() } }));
let mockSection = 'Trending Movies';
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ section_type: mockSection }) }));
jest.mock('../components/MovieCard', () => ({ __esModule: true, default: ({ movie }: any) => { const { Text } = require('react-native'); return <Text>{movie.title}</Text>; } }));
jest.mock('../components/PeopleCardHorizontal', () => 'PeopleCard');
jest.mock('../components/HomeSection', () => ({ SectionType: { TrendingMovies: 'Trending Movies', TrendingShows: 'Trending TV Shows', PopularMovies: 'Popular Movies' } }));
const data = (title: string) => ({ movies: [new Movie({ id: 1, title })], totalPages: 3 });
beforeEach(() => { jest.useFakeTimers(); jest.clearAllMocks(); mockSection = 'Trending Movies'; });
afterEach(() => jest.useRealTimers());
test('a newer query starts while the previous request runs and ignores its late response', async () => {
 let old: any;
 (searchMovie as jest.Mock).mockImplementationOnce(() => new Promise(r => old = r)).mockResolvedValueOnce(new Success(data('Arrival')));
 const ui = render(<Search/>);
 fireEvent.changeText(ui.getByPlaceholderText('Type any Movie title...'), 'Alien');
 await act(async () => { jest.advanceTimersByTime(300); });
 fireEvent.changeText(ui.getByPlaceholderText('Type any Movie title...'), 'Arrival');
 await act(async () => { jest.advanceTimersByTime(300); });
 expect(searchMovie).toHaveBeenCalledTimes(2);
 await act(async () => { old(new Success(data('Alien'))); });
 expect(ui.getByText('Arrival')).toBeTruthy();
 expect(ui.queryByText('Alien')).toBeNull();
});
test.each(['search', 'explore'])('%s retries the failed page without gaps', async screen => {
 const service = (screen === 'search' ? searchMovie : fetchTrendingMovies) as jest.Mock;
 const success = new Success(screen === 'search' ? data('Arrival') : data('Arrival').movies);
 service.mockResolvedValueOnce(success).mockResolvedValueOnce(new ApiError('offline')).mockResolvedValueOnce(success);
 const ui = render(screen === 'search' ? <Search/> : <Explore/>);
 if (screen === 'search') fireEvent.changeText(ui.getByPlaceholderText('Type any Movie title...'), 'Arrival');
 await act(async () => { jest.advanceTimersByTime(300); });
 await act(async () => { ui.UNSAFE_getByType(FlatList).props.onEndReached(); });
 expect(ui.getByText('Retry')).toBeTruthy();
 await act(async () => { fireEvent.press(ui.getByText('Retry')); });
 const pages = service.mock.calls.map(call => call[screen === 'search' ? 1 : 0]);
 expect(pages).toEqual([1, 2, 2]);
});

test('clearing a query invalidates pending results immediately', async () => {
 let finish: any;
 (searchMovie as jest.Mock).mockImplementation(() => new Promise(r => finish = r));
 const ui = render(<Search/>);
 const input = ui.getByPlaceholderText('Type any Movie title...');
 fireEvent.changeText(input, 'Alien');
 await act(async () => { jest.advanceTimersByTime(300); });
 fireEvent.changeText(input, '');
 await act(async () => { finish(new Success(data('Alien'))); });
 expect(ui.queryByText('Alien')).toBeNull();
 expect(ui.getByText('Type any Movie title...')).toBeTruthy();
});

test('unsupported Explore sections show an empty state without a futile Retry', async () => {
 mockSection = 'Your Favorites';
 const ui = render(<Explore/>);
 await act(async () => {});
 expect(ui.getByText('No results found.')).toBeTruthy();
 expect(ui.queryByText('Retry')).toBeNull();
 expect(fetchTrendingMovies).not.toHaveBeenCalled();
});
