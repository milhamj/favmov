import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { FlatList } from 'react-native';
import HomePage from '../../app/(tabs)/index';
import ExplorePage from '../../app/explore';
import HomeSection, { SectionType } from '../../components/HomeSection';
import { useAuth } from '../../hooks/useAuth';
import { Error as ApiError, Success } from '../../model/apiResponse';
import { Movie } from '../../model/movieModel';
import { fetchFavoriteMovies, fetchPopularMovies, fetchTrendingMovies, fetchTrendingShows } from '../../services/movieService';
import { CollectionStateStore } from '../../stores/collectionStateStore';
import { MovieStore } from '../../stores/movieStore';
import { refocus, router, searchParams } from '../../../test/expoRouter';

jest.mock('expo-router', () => require('../../../test/expoRouter'));
jest.mock('../../services/movieService', () => ({ searchMovie: jest.fn(), fetchTrendingMovies: jest.fn(), fetchTrendingShows: jest.fn(), fetchPopularMovies: jest.fn(), fetchFavoriteMovies: jest.fn(), fetchMovieDetails: jest.fn() }));
jest.mock('../../hooks/useAuth', () => ({ useAuth: jest.fn() }));

const list = (...titles: string[]) => new Success(titles.map((title, index) => new Movie({ id: index + 1, title })));
const trending = fetchTrendingMovies as jest.Mock;
const shows = fetchTrendingShows as jest.Mock;
const popular = fetchPopularMovies as jest.Mock;
const favorites = fetchFavoriteMovies as jest.Mock;
const signedIn = (isAuthenticated: boolean) => (useAuth as jest.Mock).mockReturnValue({ isAuthenticated });

beforeEach(() => {
  jest.clearAllMocks();
  MovieStore.clear();
  signedIn(false);
  trending.mockResolvedValue(list('Trending One'));
  shows.mockResolvedValue(list('Show One'));
  popular.mockResolvedValue(list('Popular One'));
  favorites.mockResolvedValue(list('Favorite One'));
});

describe('home', () => {
  test('guests see the public sections but not favorites', async () => {
    render(<HomePage />);
    expect(await screen.findByText('Trending One')).toBeTruthy();
    expect(await screen.findByText('Show One')).toBeTruthy();
    expect(await screen.findByText('Popular One')).toBeTruthy();
    expect(favorites).not.toHaveBeenCalled();
    expect(screen.queryByText('Your Favorites')).toBeNull();
  });

  test('signed-in users also see their favorites, without a View All link', async () => {
    signedIn(true);
    render(<HomeSection section={SectionType.YourFavorites} />);
    expect(await screen.findByText('Favorite One')).toBeTruthy();
    expect(screen.queryByText('View All')).toBeNull();
  });

  test('search opens from the top bar', async () => {
    render(<HomePage />);
    await screen.findByText('Trending One');
    fireEvent.press(screen.getByText('search'));
    expect(router.navigate).toHaveBeenCalledWith('/search');
  });

  test('the favorites header is not a link', async () => {
    signedIn(true);
    render(<HomeSection section={SectionType.YourFavorites} />);
    fireEvent.press(await screen.findByText('Your Favorites'));
    expect(router.navigate).not.toHaveBeenCalled();
  });

  test('a section header opens its full list', async () => {
    render(<HomeSection section={SectionType.PopularMovies} />);
    fireEvent.press(await screen.findByText('View All'));
    expect(router.navigate).toHaveBeenCalledWith('/explore?section_type=Popular%20Movies');
  });

  test('a poster opens the title with its data cached', async () => {
    shows.mockResolvedValue(new Success([new Movie({ id: 5, title: 'Lost', isTvShow: true })]));
    render(<HomeSection section={SectionType.TrendingShows} />);
    fireEvent.press(await screen.findByText('Lost'));
    expect(MovieStore.getCachedMovie('5', true)?.title).toBe('Lost');
    expect(router.navigate).toHaveBeenCalledWith('/movie/5?is_tv_show=true');
  });

  test('favorites reload only after a newer collection change', async () => {
    signedIn(true);
    const { rerender } = render(<HomeSection section={SectionType.YourFavorites} collectionLastUpdated={null} />);
    await screen.findByText('Favorite One');

    rerender(<HomeSection section={SectionType.YourFavorites} collectionLastUpdated={1} />);
    expect(favorites).toHaveBeenCalledTimes(1);

    favorites.mockResolvedValue(list('Favorite Two'));
    rerender(<HomeSection section={SectionType.YourFavorites} collectionLastUpdated={Date.now() + 1000} />);
    expect(await screen.findByText('Favorite Two')).toBeTruthy();
  });

  test('an empty section disappears', async () => {
    trending.mockResolvedValue(list());
    render(<HomeSection section={SectionType.TrendingMovies} />);
    await waitFor(() => expect(screen.queryByText('Trending Movies')).toBeNull());
  });

  test('KNOWN ISSUE: a failed section disappears with no error', async () => {
    trending.mockResolvedValue(new ApiError('Failed'));
    render(<HomeSection section={SectionType.TrendingMovies} />);
    await waitFor(() => expect(screen.queryByText('Trending Movies')).toBeNull());
    expect(screen.queryByText(/Failed/)).toBeNull();
  });
});

describe('explore', () => {
  const open = (section: string) => {
    searchParams.current = { section_type: section };
    render(<ExplorePage />);
  };

  test.each([
    [SectionType.TrendingMovies, 'Trending One'],
    [SectionType.TrendingShows, 'Show One'],
    [SectionType.PopularMovies, 'Popular One'],
  ])('%s lists its titles', async (section, title) => {
    open(section);
    expect(await screen.findByText(title)).toBeTruthy();
    expect(screen.getByText(section)).toBeTruthy();
  });

  test('appends the next page at the end of the list', async () => {
    open(SectionType.PopularMovies);
    await screen.findByText('Popular One');
    popular.mockResolvedValue(new Success([new Movie({ id: 2, title: 'Popular Two' })]));

    await act(async () => { screen.UNSAFE_getByType(FlatList).props.onEndReached(); });
    expect(popular).toHaveBeenLastCalledWith(2);
    expect(await screen.findByText('Popular Two')).toBeTruthy();
    expect(screen.getByText('Popular One')).toBeTruthy();
  });

  test('opens a title with its data cached', async () => {
    open(SectionType.TrendingMovies);
    fireEvent.press(await screen.findByText('Trending One'));
    expect(MovieStore.getCachedMovie('1')?.title).toBe('Trending One');
    expect(router.navigate).toHaveBeenCalledWith('/movie/1');
  });

  test('an unknown section shows no results', async () => {
    open('Nonsense');
    expect(await screen.findByText('No results found.')).toBeTruthy();
  });

  test('a failed load offers a retry that recovers', async () => {
    trending.mockResolvedValue(new ApiError('Failed'));
    open(SectionType.TrendingMovies);
    expect(await screen.findByText('Unable to load results')).toBeTruthy();

    trending.mockResolvedValue(list('Trending One'));
    fireEvent.press(screen.getByText('Retry'));
    expect(await screen.findByText('Trending One')).toBeTruthy();
  });

  test('a failed later page keeps the list and retries that page', async () => {
    open(SectionType.PopularMovies);
    await screen.findByText('Popular One');
    popular.mockResolvedValue(new ApiError('Failed'));
    await act(async () => { screen.UNSAFE_getByType(FlatList).props.onEndReached(); });

    popular.mockResolvedValue(new Success([new Movie({ id: 2, title: 'Popular Two' })]));
    fireEvent.press(await screen.findByText('Retry'));
    expect(await screen.findByText('Popular Two')).toBeTruthy();
    expect(popular).toHaveBeenLastCalledWith(2);
  });

  test('without a section there is nothing to load', async () => {
    searchParams.current = {};
    render(<ExplorePage />);
    expect(await screen.findByText('No results found.')).toBeTruthy();
    expect(trending).not.toHaveBeenCalled();
  });
});

test('the collection change store feeds the home page', async () => {
  signedIn(true);
  favorites.mockResolvedValue(list('Before'));
  render(<HomePage />);
  await screen.findByText('Before');

  favorites.mockResolvedValue(list('After'));
  CollectionStateStore.setLastUpdated(Date.now() + 60_000);
  await act(async () => refocus());
  expect(await screen.findByText('After')).toBeTruthy();
});
