import { renderWithProviders } from '../../../test/renderWithProviders';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { FlatList } from 'react-native';
import HomePage from '@/app/(tabs)/index';
import ExplorePage from '@/app/explore';
import HomeSection, { SectionType } from '@/features/movies/HomeSection';
import { useAuth } from '@/features/auth/useAuth';
import { ApiError } from '@/lib/apiError';
import { Movie } from '@/features/movies/movieModel';
import {
  fetchFavoriteMovies,
  fetchPopularMovies,
  fetchTrendingMovies,
  fetchTrendingShows,
} from '@/features/movies/movieService';
import { movieDetailKey } from '@/features/movies/movieQueries';
import { createQueryClient } from '@/lib/queryClient';
import { refocus, router, searchParams } from '../../../test/expoRouter';
import { movie as makeMovie } from '../../../test/factories';

jest.mock('@/features/auth/AuthProvider', () => ({
  AuthProvider: ({ children }: any) => children,
}));
jest.mock('expo-router', () => require('../../../test/expoRouter'));
jest.mock('expo-router/react-navigation', () => require('../../../test/expoRouter'));
jest.mock('@/features/movies/movieService', () => ({
  searchMovie: jest.fn(),
  fetchTrendingMovies: jest.fn(),
  fetchTrendingShows: jest.fn(),
  fetchPopularMovies: jest.fn(),
  fetchFavoriteMovies: jest.fn(),
  fetchMovieDetails: jest.fn(),
}));
jest.mock('@/features/auth/useAuth', () => ({ useAuth: jest.fn() }));

const list = (...titles: string[]) =>
  titles.map((title, index) => makeMovie({ id: index + 1, title }));
const trending = fetchTrendingMovies as jest.Mock;
const shows = fetchTrendingShows as jest.Mock;
const popular = fetchPopularMovies as jest.Mock;
const favorites = fetchFavoriteMovies as jest.Mock;
const signedIn = (isAuthenticated: boolean) =>
  (useAuth as jest.Mock).mockReturnValue({ isAuthenticated });

beforeEach(() => {
  queryClient = createQueryClient();
  jest.clearAllMocks();
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
    fireEvent.press(screen.getByRole('button', { name: 'Search' }));
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
    shows.mockResolvedValue([makeMovie({ id: 5, title: 'Lost', isTvShow: true })]);
    render(<HomeSection section={SectionType.TrendingShows} />);
    fireEvent.press(await screen.findByText('Lost'));
    expect(queryClient.getQueryData<Movie>(movieDetailKey('5', true))?.title).toBe('Lost');
    expect(router.navigate).toHaveBeenCalledWith('/movie/5?is_tv_show=true');
  });

  test('favorites reload only after a newer collection change', async () => {
    signedIn(true);
    render(<HomeSection section={SectionType.YourFavorites} />);
    await screen.findByText('Favorite One');

    await act(async () => refocus());
    expect(favorites).toHaveBeenCalledTimes(1);

    favorites.mockResolvedValue(list('Favorite Two'));
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['collections'], refetchType: 'none' });
    });
    await act(async () => refocus());
    expect(await screen.findByText('Favorite Two')).toBeTruthy();
  });

  test('an empty section disappears', async () => {
    trending.mockResolvedValue(list());
    render(<HomeSection section={SectionType.TrendingMovies} />);
    await waitFor(() => expect(screen.queryByText('Trending Movies')).toBeNull());
  });

  test('a failed section retains its heading and retries successfully', async () => {
    trending.mockRejectedValue(new ApiError('Failed'));
    render(<HomeSection section={SectionType.TrendingMovies} />);
    expect(await screen.findByText('Failed')).toBeTruthy();
    expect(screen.getByText('Trending Movies')).toBeTruthy();
    trending.mockResolvedValue(list('Recovered'));
    fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Recovered')).toBeTruthy();
    expect(screen.queryByText('Failed')).toBeNull();
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
    popular.mockResolvedValue([makeMovie({ id: 2, title: 'Popular Two' })]);

    await act(async () => {
      screen.UNSAFE_getByType(FlatList).props.onEndReached();
    });
    expect(popular).toHaveBeenLastCalledWith(2);
    expect(await screen.findByText('Popular Two')).toBeTruthy();
    expect(screen.getByText('Popular One')).toBeTruthy();
  });

  test('labels the pagination loading indicator', async () => {
    open(SectionType.PopularMovies);
    await screen.findByText('Popular One');
    popular.mockReturnValue(new Promise(() => {}));
    await act(async () => {
      screen.UNSAFE_getByType(FlatList).props.onEndReached();
    });
    expect(screen.getByLabelText('Loading more results')).toBeTruthy();
  });

  test('opens a title with its data cached', async () => {
    open(SectionType.TrendingMovies);
    fireEvent.press(await screen.findByText('Trending One'));
    expect(queryClient.getQueryData<Movie>(movieDetailKey('1'))?.title).toBe('Trending One');
    expect(router.navigate).toHaveBeenCalledWith('/movie/1');
  });

  test('an unknown section shows no results', async () => {
    open('Nonsense');
    expect(await screen.findByText('No results found.')).toBeTruthy();
  });

  test('a failed load offers a retry that recovers', async () => {
    trending.mockRejectedValue(new ApiError('Failed'));
    open(SectionType.TrendingMovies);
    expect(await screen.findByText('Unable to load results')).toBeTruthy();

    trending.mockResolvedValue(list('Trending One'));
    fireEvent.press(screen.getByText('Retry'));
    expect(await screen.findByText('Trending One')).toBeTruthy();
  });

  test('a failed later page keeps the list and retries that page', async () => {
    open(SectionType.PopularMovies);
    await screen.findByText('Popular One');
    popular.mockRejectedValue(new ApiError('Failed'));
    await act(async () => {
      screen.UNSAFE_getByType(FlatList).props.onEndReached();
    });

    popular.mockResolvedValue([makeMovie({ id: 2, title: 'Popular Two' })]);
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
  await act(async () => {
    await queryClient.invalidateQueries({ queryKey: ['collections'], refetchType: 'none' });
  });
  await act(async () => refocus());
  expect(await screen.findByText('After')).toBeTruthy();
});

test('explore recalculates equal movie cell widths on layout changes', async () => {
  searchParams.current = { section_type: SectionType.TrendingMovies };
  trending.mockResolvedValue(list('One', 'Two', 'Three'));
  render(<ExplorePage />);
  await screen.findByText('Three');
  const grid = () => screen.UNSAFE_getByType(FlatList);
  fireEvent(grid(), 'contentSizeChange', 288, 1200);
  expect(grid().props.renderItem({ item: grid().props.data[2], index: 2 }).props.style.width).toBe(
    136,
  );
  fireEvent(grid(), 'contentSizeChange', 608, 1200);
  expect(grid().props.renderItem({ item: grid().props.data[0], index: 0 }).props.style.width).toBe(
    192,
  );
  expect(grid().props.numColumns).toBe(3);
  expect(trending).toHaveBeenCalledTimes(1);
});

let queryClient = createQueryClient();
const render = (ui: React.ReactElement) => renderWithProviders(ui, { queryClient });

afterEach(() => queryClient.clear());
