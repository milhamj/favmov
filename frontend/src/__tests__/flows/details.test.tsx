import { containingCollectionsKey } from '@/features/collections/collectionQueries';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { ActivityIndicator, Image } from 'react-native';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import ProfilePage from '@/app/(tabs)/profile';
import MovieDetailPage from '@/app/movie/[id]';
import PeopleDetailPage from '@/app/people/[id]';
import { SeoHead } from '@/components/SeoHead';
import { useAuth } from '@/features/auth/useAuth';
import { ApiError } from '@/lib/apiError';
import { Collection } from '@/features/collections/collectionModel';
import { Movie } from '@/features/movies/movieModel';
import { getCheckMovieExistInCollection } from '@/features/collections/collectionService';
import { fetchMovieDetails } from '@/features/movies/movieService';
import { fetchPeopleDetails } from '@/features/people/peopleService';
import { supabase } from '@/lib/supabaseClient';
import { seedMovieDetails, movieDetailKey } from '@/features/movies/movieQueries';
import { createQueryClient } from '@/lib/queryClient';
import { unsavedNotes } from '@/features/collections/unsavedNotesStore';
import { refocus, router, searchParams } from '../../../test/expoRouter';
import {
  actor as makeActor,
  collection as makeCollection,
  crew as makeCrew,
  movie as makeMovie,
  person as makePeople,
  credit as makePeopleMovieCredit,
} from '../../../test/factories';

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
jest.mock('@/features/people/peopleService', () => ({
  searchPeople: jest.fn(),
  fetchPeopleDetails: jest.fn(),
}));
jest.mock('@/features/collections/collectionService', () => ({
  createCollection: jest.fn(),
  deleteMovieFromCollection: jest.fn(),
  getCheckMovieExistInCollection: jest.fn(),
  getCollectionDetail: jest.fn(),
  getUserCollections: jest.fn(),
  postAddMovieToCollection: jest.fn(),
  updateNotes: jest.fn(),
}));
jest.mock('@/lib/supabaseClient', () => ({ supabase: { auth: { signOut: jest.fn() } } }));
jest.mock('@/features/auth/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('@/components/SeoHead', () => ({
  SeoHead: jest.fn(() => null),
  URL_DEFAULT: 'https://site',
}));

const details = fetchMovieDetails as jest.Mock;
const savedIn = getCheckMovieExistInCollection as jest.Mock;
const person = fetchPeopleDetails as jest.Mock;
const signedIn = (isAuthenticated: boolean, user?: object) =>
  (useAuth as jest.Mock).mockReturnValue({ isAuthenticated, loading: false, user });

const fullMovie = () =>
  makeMovie({
    id: 7,
    title: 'Up',
    overview: 'Balloons',
    releaseDate: '2009-05-28',
    runtime: '96',
    rating: 8.1,
    ratingCount: 100,
    genres: ['Family'],
    cast: [makeActor(11, 'Ed', '/e.jpg', 'Carl')],
    crew: [makeCrew(12, 'Pete', '/p.jpg', 'Director')],
  });

beforeEach(() => {
  queryClient = createQueryClient();
  jest.clearAllMocks();
  signedIn(false);
  details.mockResolvedValue(fullMovie());
  savedIn.mockResolvedValue([]);
});

describe('movie detail', () => {
  beforeEach(() => {
    searchParams.current = { id: '7' };
  });

  test('shows cached data at once, then the full details', async () => {
    seedMovieDetails(queryClient, makeMovie({ id: 7, title: 'From cache' }));
    let finish = (_: unknown) => {};
    details.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    render(<MovieDetailPage />);
    expect(screen.getAllByText('From cache').length).toBeGreaterThan(0);

    await act(async () => finish(fullMovie()));
    expect(screen.getByText('Balloons')).toBeTruthy();
    expect(screen.getByText('Family')).toBeTruthy();
    expect(screen.getByText('96 minutes • 2009-05-28 • Directed by Pete')).toBeTruthy();
  });

  test('keeps a TV show and a movie with the same id apart', () => {
    seedMovieDetails(queryClient, makeMovie({ id: 7, title: 'Movie' }));
    seedMovieDetails(queryClient, makeMovie({ id: 7, title: 'Show', isTvShow: true }));
    details.mockReturnValue(new Promise(() => {}));
    const ui = render(<MovieDetailPage />);
    expect(screen.getAllByText('Movie').length).toBeGreaterThan(0);
    expect(screen.queryByText('Show')).toBeNull();
    searchParams.current = { id: '7', is_tv_show: 'true' };
    ui.rerender(<MovieDetailPage />);
    expect(screen.getAllByText('Show').length).toBeGreaterThan(0);
    expect(screen.queryByText('Movie')).toBeNull();
  });

  test.each(['abc', '12abc', '0'])('rejects the invalid title id %p without requests', (id) => {
    signedIn(true, { id: 'u1' });
    searchParams.current = { id };
    render(<MovieDetailPage />);
    expect(screen.getByText('Invalid title URL')).toBeTruthy();
    expect(details).not.toHaveBeenCalled();
    expect(savedIn).not.toHaveBeenCalled();
  });

  test('uses the TV endpoint and label for a TV show', async () => {
    searchParams.current = { id: '7', is_tv_show: 'true' };
    details.mockResolvedValue(makeMovie({ id: 7, title: 'Lost', isTvShow: true }));
    render(<MovieDetailPage />);
    expect(await screen.findByText(/• TV Show/)).toBeTruthy();
    expect(details).toHaveBeenCalledWith('7', true);
  });

  test.each([false, true])(
    'keeps the detail poster small, loads the backdrop progressively and opens originals (TV: %s)',
    async (isTvShow) => {
      searchParams.current = { id: '7', ...(isTvShow ? { is_tv_show: 'true' } : {}) };
      details.mockResolvedValue(
        makeMovie({
          id: 7,
          title: 'Up',
          posterPath: '/poster.jpg',
          backdropPath: '/backdrop.jpg',
          isTvShow,
        }),
      );
      render(<MovieDetailPage />);
      const backdrop = await screen.findByLabelText(/View full backdrop for /);
      expect(screen.UNSAFE_getAllByType(Image).map((image) => image.props.source.uri)).toEqual([
        'small//backdrop.jpg',
        'big//backdrop.jpg',
        'small//poster.jpg',
      ]);
      fireEvent.press(backdrop);
      expect(router.navigate).toHaveBeenLastCalledWith(
        '/image?url=' +
          encodeURIComponent('big//backdrop.jpg') +
          '&preview=' +
          encodeURIComponent('small//backdrop.jpg'),
      );
      fireEvent.press(screen.getByLabelText(/View full poster for /));
      expect(router.navigate).toHaveBeenLastCalledWith(
        '/image?url=' +
          encodeURIComponent('big//poster.jpg') +
          '&preview=' +
          encodeURIComponent('small//poster.jpg'),
      );
    },
  );

  test('cast and crew link to their pages', async () => {
    render(<MovieDetailPage />);
    fireEvent.press(await screen.findByText('Ed'));
    expect(router.navigate).toHaveBeenLastCalledWith('/people/11');
    fireEvent.press(screen.getByText('Pete'));
    expect(router.navigate).toHaveBeenLastCalledWith('/people/12');
  });

  test('publishes SEO tags for the title', async () => {
    render(<MovieDetailPage />);
    await screen.findByText('Balloons');
    expect((SeoHead as jest.Mock).mock.lastCall?.[0]).toMatchObject({
      title: 'Up | FavMov',
      description: 'Balloons',
      url: 'https://site/movie/7',
    });
  });

  test('shows a toast when cached details fail to refresh', async () => {
    seedMovieDetails(queryClient, fullMovie());
    details.mockRejectedValue(new ApiError('Failed to fetch movie details', 404));
    render(<MovieDetailPage />);
    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text2: 'Failed to fetch movie details' }),
      ),
    );
  });

  test('a cold details failure offers a persistent retry that recovers', async () => {
    details.mockRejectedValue(new ApiError('Offline'));
    render(<MovieDetailPage />);
    expect(await screen.findByText('Unable to load title')).toBeTruthy();
    expect(Toast.show).not.toHaveBeenCalled();
    details.mockResolvedValue(fullMovie());
    fireEvent.press(screen.getByText('Retry'));
    expect(await screen.findByText('Balloons')).toBeTruthy();
  });

  test('guests are sent to login by the favorite button', async () => {
    render(<MovieDetailPage />);
    fireEvent.press(await screen.findByRole('link', { name: 'Add to collection' }));
    expect(savedIn).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith('/login?return_to=%2Fmovie%2F7');
  });

  test('a saved title shows a filled heart and opens the editor with its data', async () => {
    signedIn(true);
    savedIn.mockResolvedValue([makeCollection('c1', 'Sci-Fi')]);
    render(<MovieDetailPage />);
    fireEvent.press(await screen.findByRole('link', { name: 'In your collections' }));

    expect(savedIn).toHaveBeenCalledWith('7', false);
    expect(
      queryClient.getQueriesData<Collection[]>({
        queryKey: containingCollectionsKey('7', false),
      })[0]?.[1]?.[0].id,
    ).toBe('c1');
    expect(router.navigate).toHaveBeenCalledWith('/collection/add?movie_id=7');
  });

  test('the heart shows a spinner, not an empty heart, while the saved state is loading', async () => {
    signedIn(true);
    let finish!: (value: Collection[]) => void;
    savedIn.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    render(<MovieDetailPage />);
    await screen.findByText('Balloons');
    expect(screen.getByLabelText('Loading collections')).toBeTruthy();
    expect(screen.queryByText('favorite-outline', { includeHiddenElements: true })).toBeNull();

    fireEvent.press(screen.UNSAFE_getAllByType(ActivityIndicator)[0]);
    expect(router.navigate).not.toHaveBeenCalled();

    await act(async () => finish([makeCollection('c1', 'Sci-Fi')]));
    expect(await screen.findByRole('link', { name: 'In your collections' })).toBeTruthy();
  });

  test('the heart waits for a fresh lookup when the user signs in again', async () => {
    signedIn(true);
    const { rerender } = render(<MovieDetailPage />);
    await screen.findByRole('link', { name: 'Add to collection' });

    signedIn(false);
    rerender(<MovieDetailPage {...({ session: 1 } as any)} />);
    let finish!: (value: Collection[]) => void;
    savedIn.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    signedIn(true);
    rerender(<MovieDetailPage {...({ session: 2 } as any)} />);

    await waitFor(() => expect(savedIn).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('favorite-outline', { includeHiddenElements: true })).toBeNull();
    await act(async () => finish([makeCollection('c1', 'Sci-Fi')]));
    expect(await screen.findByRole('link', { name: 'In your collections' })).toBeTruthy();
  });

  test('re-checks saved state on return from the editor', async () => {
    signedIn(true);
    render(<MovieDetailPage />);
    await screen.findByRole('link', { name: 'Add to collection' });

    savedIn.mockResolvedValue([makeCollection('c1', 'Sci-Fi')]);
    await act(async () => refocus());
    expect(await screen.findByRole('link', { name: 'In your collections' })).toBeTruthy();
  });

  test('shows a toast when the saved state cannot be read', async () => {
    signedIn(true);
    savedIn.mockRejectedValue(new ApiError('Failed to fetch collection detail'));
    render(<MovieDetailPage />);
    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ text2: 'Failed to fetch collection detail' }),
      ),
    );
  });
});

describe('people detail', () => {
  const credit = (id: number, title: string, extra = {}) =>
    makePeopleMovieCredit({
      id,
      title,
      character: 'Hero',
      releaseDate: '2001-02-03',
      rating: 7.456,
      ratingCount: 5,
      ...extra,
    });

  beforeEach(() => {
    searchParams.current = { id: '3' };
  });

  test.each(['abc', '..%2Fmovie%2F550', '../movie/550', '0'])(
    'rejects the invalid person id %p without requests',
    (id) => {
      searchParams.current = { id };
      render(<PeopleDetailPage />);
      expect(screen.getByText('Invalid person URL')).toBeTruthy();
      expect(person).not.toHaveBeenCalled();
    },
  );

  test('shows the profile with N/A for gaps', async () => {
    person.mockResolvedValue(
      makePeople({ id: 3, name: 'Ann', gender: 1, biography: 'Born in Oslo' }),
    );
    render(<PeopleDetailPage />);
    expect((await screen.findAllByText('Ann')).length).toBe(2);
    expect(person).toHaveBeenCalledWith('3');
    expect(screen.getByText('Female')).toBeTruthy();
    expect(screen.getByText('Born in Oslo')).toBeTruthy();
    expect(screen.getAllByText('N/A')).toHaveLength(3);
    expect(screen.getByText('No acting credits available.')).toBeTruthy();
    expect(screen.getByText('No crew credits available.')).toBeTruthy();
  });

  test('says when there is no biography', async () => {
    person.mockResolvedValue(makePeople({ id: 3, name: 'Ann' }));
    render(<PeopleDetailPage />);
    expect(await screen.findByText('No biography available.')).toBeTruthy();
  });

  test('hides and shows each credit list', async () => {
    person.mockResolvedValue(
      makePeople({
        id: 3,
        name: 'Ann',
        actingCredits: [credit(1, 'Acted')],
        crewCredits: [credit(2, 'Directed')],
      }),
    );
    render(<PeopleDetailPage />);
    await screen.findByText('Acted');
    expect(screen.getAllByText('(1)')).toHaveLength(2);

    fireEvent.press(screen.getAllByText('Hide')[0]);
    expect(screen.queryByText('Acted')).toBeNull();
    expect(screen.getByText('Directed')).toBeTruthy();
    fireEvent.press(screen.getByText('Show'));
    expect(screen.getByText('Acted')).toBeTruthy();
  });

  test('an unrated credit shows a dash and its zero count, like the cards', async () => {
    person.mockResolvedValue(
      makePeople({
        id: 3,
        name: 'Ann',
        actingCredits: [credit(1, 'Upcoming', { rating: 0, ratingCount: 0 })],
      }),
    );
    render(<PeopleDetailPage />);
    await screen.findByText('Upcoming');
    expect(screen.getByText(' – ')).toBeTruthy();
    expect(screen.getAllByText('(0)')).toHaveLength(2); // the credit's count plus the empty crew section header
  });

  test('a credit shows its year and role, and opens with data cached', async () => {
    person.mockResolvedValue(
      makePeople({
        id: 3,
        name: 'Ann',
        actingCredits: [credit(1, 'Series', { isTvShow: true })],
      }),
    );
    render(<PeopleDetailPage />);
    expect(await screen.findByText('2001')).toBeTruthy();
    expect(screen.getByText('as Hero')).toBeTruthy();
    expect(screen.getByText(' 7.46 ')).toBeTruthy();

    fireEvent.press(screen.getByText('Series'));
    expect(queryClient.getQueryData<Movie>(movieDetailKey('1', true))?.title).toBe('Series');
    expect(router.navigate).toHaveBeenCalledWith('/movie/1?is_tv_show=true');
  });

  test('a failed lookup offers a retry that recovers', async () => {
    person.mockRejectedValue(new ApiError('Failed to fetch people details.'));
    render(<PeopleDetailPage />);
    expect(await screen.findByText('Failed to fetch people details.')).toBeTruthy();

    person.mockResolvedValue(makePeople({ id: 3, name: 'Ann' }));
    fireEvent.press(screen.getByText('Retry'));
    expect(await screen.findByText('Biography')).toBeTruthy();
  });

  test('an unknown person has nothing to retry', async () => {
    person.mockRejectedValue(new ApiError('Failed to fetch people details.', 404));
    render(<PeopleDetailPage />);
    expect(await screen.findByText('Person not found')).toBeTruthy();
    expect(screen.queryByText('Retry')).toBeNull();
  });
});

describe('profile', () => {
  const signOut = supabase.auth.signOut as jest.Mock;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    signedIn(true, { email: 'alice@example.com', created_at: '2025-01-15T12:00:00Z' });
  });

  test('shows who is signed in', () => {
    render(<ProfilePage />);
    expect(screen.getByText('alice@example.com')).toBeTruthy();
    expect(screen.getByText('AL')).toBeTruthy();
    expect(screen.getByText('Member since 15 January 2025')).toBeTruthy();
  });

  test('logs out, drops unsaved note drafts, and returns home', async () => {
    signOut.mockResolvedValue({ error: null });
    unsavedNotes.set('draft', { draft: 'x', base: { current: '' } });
    render(<ProfilePage />);
    fireEvent.press(screen.getByText('Logout'));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
    expect(unsavedNotes.size).toBe(0);
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ text1: 'Logout successful' }),
    );
  });

  test('stays put when logout fails', async () => {
    signOut.mockResolvedValue({ error: { message: 'Offline' } });
    render(<ProfilePage />);
    fireEvent.press(screen.getByText('Logout'));
    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ text1: 'Logout Failed' })),
    );
    expect(router.replace).not.toHaveBeenCalled();
  });
});

let queryClient = createQueryClient();
const render = (ui: React.ReactElement) => renderWithProviders(ui, { queryClient });

jest.mock('@/features/auth/AuthProvider', () => ({
  AuthProvider: ({ children }: any) => children,
}));

afterEach(() => queryClient.clear());
