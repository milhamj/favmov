import { ActivityIndicator, Image } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import ProfilePage from '../../app/(tabs)/profile';
import MovieDetailPage from '../../app/movie/[id]';
import PeopleDetailPage from '../../app/people/[id]';
import { SeoHead } from '../../components/SeoHead';
import { useAuth } from '../../hooks/useAuth';
import { Error as ApiError, Success } from '../../model/apiResponse';
import { Collection } from '../../model/collectionModel';
import { Actor, Crew, Movie } from '../../model/movieModel';
import { People, PeopleMovieCredit } from '../../model/peopleModel';
import { getCheckMovieExistInCollection } from '../../services/collectionService';
import { fetchMovieDetails } from '../../services/movieService';
import { fetchPeopleDetails } from '../../services/peopleService';
import { supabase } from '../../services/supabaseClient';
import { MovieStore } from '../../stores/movieStore';
import { unsavedNotes } from '../../stores/unsavedNotesStore';
import { refocus, router, searchParams } from '../../../test/expoRouter';

jest.mock('expo-router', () => require('../../../test/expoRouter'));
jest.mock('@react-navigation/native', () => require('../../../test/expoRouter'));
jest.mock('../../services/movieService', () => ({ searchMovie: jest.fn(), fetchTrendingMovies: jest.fn(), fetchTrendingShows: jest.fn(), fetchPopularMovies: jest.fn(), fetchFavoriteMovies: jest.fn(), fetchMovieDetails: jest.fn() }));
jest.mock('../../services/peopleService', () => ({ searchPeople: jest.fn(), fetchPeopleDetails: jest.fn() }));
jest.mock('../../services/collectionService', () => ({ createCollection: jest.fn(), deleteMovieFromCollection: jest.fn(), getCheckMovieExistInCollection: jest.fn(), getCollectionDetail: jest.fn(), getUserCollections: jest.fn(), postAddMovieToCollection: jest.fn(), updateNotes: jest.fn() }));
jest.mock('../../services/supabaseClient', () => ({ supabase: { auth: { signOut: jest.fn() } } }));
jest.mock('../../hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('../../components/SeoHead', () => ({ SeoHead: jest.fn(() => null), URL_DEFAULT: 'https://site' }));

const details = fetchMovieDetails as jest.Mock;
const savedIn = getCheckMovieExistInCollection as jest.Mock;
const person = fetchPeopleDetails as jest.Mock;
const signedIn = (isAuthenticated: boolean, user?: object) => (useAuth as jest.Mock).mockReturnValue({ isAuthenticated, loading: false, user });

const fullMovie = () => new Movie({
  id: 7, title: 'Up', overview: 'Balloons', releaseDate: '2009-05-28', runtime: '96', rating: 8.1, ratingCount: 100, genres: ['Family'],
  cast: [new Actor(11, 'Ed', '/e.jpg', 'Carl')],
  crew: [new Crew(12, 'Pete', '/p.jpg', 'Director')],
});

beforeEach(() => {
  jest.clearAllMocks();
  MovieStore.clear();
  signedIn(false);
  details.mockResolvedValue(new Success(fullMovie()));
  savedIn.mockResolvedValue(new Success([]));
});

describe('movie detail', () => {
  beforeEach(() => { searchParams.current = { id: '7' }; });

  test('shows cached data at once, then the full details', async () => {
    MovieStore.cacheMovie(new Movie({ id: 7, title: 'From cache' }));
    let finish = (_: unknown) => {};
    details.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    render(<MovieDetailPage />);
    expect(screen.getAllByText('From cache').length).toBeGreaterThan(0);

    await act(async () => finish(new Success(fullMovie())));
    expect(screen.getByText('Balloons')).toBeTruthy();
    expect(screen.getByText('Family')).toBeTruthy();
    expect(screen.getByText('96 minutes • 2009-05-28 • Directed by Pete')).toBeTruthy();
  });

  test('uses the TV endpoint and label for a TV show', async () => {
    searchParams.current = { id: '7', is_tv_show: 'true' };
    details.mockResolvedValue(new Success(new Movie({ id: 7, title: 'Lost', isTvShow: true })));
    render(<MovieDetailPage />);
    expect(await screen.findByText(/• TV Show/)).toBeTruthy();
    expect(details).toHaveBeenCalledWith('7', true);
  });

  test.each([false, true])('keeps the detail poster small, loads the backdrop progressively and opens originals (TV: %s)', async (isTvShow) => {
    searchParams.current = { id: '7', ...(isTvShow ? { is_tv_show: 'true' } : {}) };
    details.mockResolvedValue(new Success(new Movie({ id: 7, title: 'Up', posterPath: '/poster.jpg', backdropPath: '/backdrop.jpg', isTvShow })));
    render(<MovieDetailPage />);
    const backdrop = await screen.findByLabelText('View full backdrop');
    expect(screen.UNSAFE_getAllByType(Image).map(image => image.props.source.uri)).toEqual(['small//backdrop.jpg', 'big//backdrop.jpg', 'small//poster.jpg']);
    fireEvent.press(backdrop);
    expect(router.navigate).toHaveBeenLastCalledWith('/image?url=' + encodeURIComponent('big//backdrop.jpg') + '&preview=' + encodeURIComponent('small//backdrop.jpg'));
    fireEvent.press(screen.getByLabelText('View full poster'));
    expect(router.navigate).toHaveBeenLastCalledWith('/image?url=' + encodeURIComponent('big//poster.jpg') + '&preview=' + encodeURIComponent('small//poster.jpg'));
  });

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
    expect((SeoHead as jest.Mock).mock.lastCall?.[0]).toMatchObject({ title: 'Up | FavMov', description: 'Balloons', url: 'https://site/movie/7' });
  });

  test('shows a toast when details fail', async () => {
    details.mockResolvedValue(new ApiError('Failed to fetch movie details', 404));
    render(<MovieDetailPage />);
    await waitFor(() => expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', text2: 'Failed to fetch movie details' })));
  });

  test('guests are sent to login by the favorite button', async () => {
    render(<MovieDetailPage />);
    fireEvent.press(await screen.findByText('favorite-outline'));
    expect(savedIn).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith('/login?return_to=%2Fmovie%2F7');
  });

  test('a saved title shows a filled heart and opens the editor with its data', async () => {
    signedIn(true);
    savedIn.mockResolvedValue(new Success([new Collection('c1', 'Sci-Fi')]));
    render(<MovieDetailPage />);
    fireEvent.press(await screen.findByText('favorite'));

    expect(savedIn).toHaveBeenCalledWith('7', false);
    expect(MovieStore.getCachedMovie('7')?.collections?.[0].id).toBe('c1');
    expect(router.navigate).toHaveBeenCalledWith('/collection/add?movie_id=7');
  });

  test('the heart shows a spinner, not an empty heart, while the saved state is loading', async () => {
    signedIn(true);
    let finish!: (value: Success<Collection[]>) => void;
    savedIn.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    render(<MovieDetailPage />);
    await screen.findByText('Balloons');
    expect(screen.UNSAFE_getAllByType(ActivityIndicator).length).toBeGreaterThan(0);
    expect(screen.queryByText('favorite-outline')).toBeNull();

    fireEvent.press(screen.UNSAFE_getAllByType(ActivityIndicator)[0]);
    expect(router.navigate).not.toHaveBeenCalled();

    await act(async () => finish(new Success([new Collection('c1', 'Sci-Fi')])));
    expect(await screen.findByText('favorite')).toBeTruthy();
  });

  test('the heart waits for a fresh lookup when the user signs in again', async () => {
    signedIn(true);
    const { rerender } = render(<MovieDetailPage />);
    await screen.findByText('favorite-outline');

    signedIn(false);
    rerender(<MovieDetailPage {...({ session: 1 } as any)} />);
    let finish!: (value: Success<Collection[]>) => void;
    savedIn.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    signedIn(true);
    rerender(<MovieDetailPage {...({ session: 2 } as any)} />);

    await waitFor(() => expect(savedIn).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('favorite-outline')).toBeNull();
    await act(async () => finish(new Success([new Collection('c1', 'Sci-Fi')])));
    expect(await screen.findByText('favorite')).toBeTruthy();
  });

  test('re-checks saved state on return from the editor', async () => {
    signedIn(true);
    render(<MovieDetailPage />);
    await screen.findByText('favorite-outline');

    savedIn.mockResolvedValue(new Success([new Collection('c1', 'Sci-Fi')]));
    await act(async () => refocus());
    expect(await screen.findByText('favorite')).toBeTruthy();
  });

  test('shows a toast when the saved state cannot be read', async () => {
    signedIn(true);
    savedIn.mockResolvedValue(new ApiError('Failed to fetch collection detail'));
    render(<MovieDetailPage />);
    await waitFor(() => expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ text2: 'Failed to fetch collection detail' })));
  });
});

describe('people detail', () => {
  const credit = (id: number, title: string, extra = {}) => new PeopleMovieCredit({ id, title, character: 'Hero', releaseDate: '2001-02-03', rating: 7.456, ratingCount: 5, ...extra });

  beforeEach(() => { searchParams.current = { id: '3' }; });

  test('shows the profile with N/A for gaps', async () => {
    person.mockResolvedValue(new Success(new People({ id: 3, name: 'Ann', gender: 1, biography: 'Born in Oslo' })));
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
    person.mockResolvedValue(new Success(new People({ id: 3, name: 'Ann' })));
    render(<PeopleDetailPage />);
    expect(await screen.findByText('No biography available.')).toBeTruthy();
  });

  test('hides and shows each credit list', async () => {
    person.mockResolvedValue(new Success(new People({ id: 3, name: 'Ann', actingCredits: [credit(1, 'Acted')], crewCredits: [credit(2, 'Directed')] })));
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
    person.mockResolvedValue(new Success(new People({ id: 3, name: 'Ann', actingCredits: [credit(1, 'Upcoming', { rating: 0, ratingCount: 0 })] })));
    render(<PeopleDetailPage />);
    await screen.findByText('Upcoming');
    expect(screen.getByText(' – ')).toBeTruthy();
    expect(screen.getAllByText('(0)')).toHaveLength(2); // the credit's count plus the empty crew section header
  });

  test('a credit shows its year and role, and opens with data cached', async () => {
    person.mockResolvedValue(new Success(new People({ id: 3, name: 'Ann', actingCredits: [credit(1, 'Series', { isTvShow: true })] })));
    render(<PeopleDetailPage />);
    expect(await screen.findByText('2001')).toBeTruthy();
    expect(screen.getByText('as Hero')).toBeTruthy();
    expect(screen.getByText(' 7.46 ')).toBeTruthy();

    fireEvent.press(screen.getByText('Series'));
    expect(MovieStore.getCachedMovie('1', true)?.title).toBe('Series');
    expect(router.navigate).toHaveBeenCalledWith('/movie/1?is_tv_show=true');
  });

  test('a failed lookup offers a retry that recovers', async () => {
    person.mockResolvedValue(new ApiError('Failed to fetch people details.'));
    render(<PeopleDetailPage />);
    expect(await screen.findByText('Failed to fetch people details.')).toBeTruthy();

    person.mockResolvedValue(new Success(new People({ id: 3, name: 'Ann' })));
    fireEvent.press(screen.getByText('Retry'));
    expect(await screen.findByText('Biography')).toBeTruthy();
  });

  test('an unknown person has nothing to retry', async () => {
    person.mockResolvedValue(new ApiError('Failed to fetch people details.', 404));
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
    expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ text1: 'Logout successful' }));
  });

  test('stays put when logout fails', async () => {
    signOut.mockResolvedValue({ error: { message: 'Offline' } });
    render(<ProfilePage />);
    fireEvent.press(screen.getByText('Logout'));
    await waitFor(() => expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ text1: 'Logout Failed' })));
    expect(router.replace).not.toHaveBeenCalled();
  });
});
