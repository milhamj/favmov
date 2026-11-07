import { Error as ApiError, Success } from '../../model/apiResponse';
import backendClient from '../../services/backendClient';
import { fetchFavoriteMovies, fetchMovieDetails, fetchPopularMovies, fetchTrendingMovies, fetchTrendingShows, searchMovie } from '../../services/movieService';
import tmdbApiClient from '../../services/tmdbClient';

jest.mock('../../services/tmdbClient', () => {
  const client = { get: jest.fn() };
  return { __esModule: true, default: () => client, TMDB_IMAGE_BIG: 'big/', TMDB_IMAGE_SMALL: 'small/' };
});
jest.mock('../../services/backendClient', () => ({ __esModule: true, default: { get: jest.fn() } }));

const tmdb = tmdbApiClient().get as jest.Mock;
const backend = backendClient.get as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

test.each([
  [fetchTrendingMovies, '/trending/movie/week', false],
  [fetchTrendingShows, '/trending/tv/week', true],
  [fetchPopularMovies, '/movie/popular', undefined],
])('lists fetch page 1 by default and mark TV shows', async (fetchList, path, isTvShow) => {
  tmdb.mockResolvedValue({ data: { results: [{ id: 1, name: 'Named', vote_average: 7.123 }] } });
  const result = await fetchList() as Success<any>;

  expect(tmdb).toHaveBeenCalledWith(path, { params: { page: 1 } });
  expect(result.data[0]).toMatchObject({ id: 1, title: 'Named', rating: '7.12', isTvShow: isTvShow === true });
});

test('list failures keep the HTTP status', async () => {
  tmdb.mockRejectedValue({ response: { status: 429 } });
  const result = await fetchTrendingMovies();
  expect(result).toBeInstanceOf(ApiError);
  expect(result).toMatchObject({ message: 'Failed to fetch trending movies', errorCode: 429 });
});

describe('fetchMovieDetails', () => {
  const person = (id: number, job: string) => ({ id, name: `P${id}`, job, profile_path: '/p.jpg' });

  test('picks the endpoint by media type', async () => {
    tmdb.mockResolvedValue({ data: { id: 1 } });
    await fetchMovieDetails('1');
    await fetchMovieDetails('1', true);
    expect(tmdb.mock.calls.map(([url]) => url)).toEqual(['/movie/1?append_to_response=credits', '/tv/1?append_to_response=credits']);
  });

  test('maps TV fields', async () => {
    tmdb.mockResolvedValue({ data: { id: 1, name: 'Show', first_air_date: '2020-01-01' } });
    const { data } = await fetchMovieDetails('1', true) as Success<any>;
    expect(data).toMatchObject({ title: 'Show', releaseDate: '2020-01-01', isTvShow: true });
  });

  test('keeps the first 10 cast, and lists director then producers first in 20 crew', async () => {
    const cast = Array.from({ length: 12 }, (_, id) => ({ id, name: `A${id}`, character: 'C' }));
    const others = Array.from({ length: 30 }, (_, index) => person(100 + index, 'Writer'));
    const crew = [...others, person(2, 'Executive Producer'), person(1, 'Director')];
    tmdb.mockResolvedValue({ data: { id: 1, genres: [{ name: 'Drama' }], credits: { cast, crew } } });

    const { data } = await fetchMovieDetails('1') as Success<any>;
    expect(data.cast).toHaveLength(10);
    expect(data.crew).toHaveLength(20);
    expect(data.crew.slice(0, 3).map((c: any) => c.job)).toEqual(['Director', 'Executive Producer', 'Writer']);
    expect(data.genres).toEqual(['Drama']);
  });

  test('reports failures', async () => {
    tmdb.mockRejectedValue({ response: { status: 404 } });
    expect(await fetchMovieDetails('1')).toMatchObject({ message: 'Failed to fetch movie details', errorCode: 404 });
  });
});

describe('searchMovie', () => {
  test('searches movies, excluding adult titles unless asked', async () => {
    tmdb.mockResolvedValue({ data: { results: [{ id: 1, title: 'Up' }], total_pages: 3 } });
    const { data } = await searchMovie('up', 2) as Success<any>;
    expect(tmdb).toHaveBeenCalledWith('/search/movie', { params: { query: 'up', page: 2, include_adult: false } });
    expect(data.totalPages).toBe(3);
    expect(data.movies[0].title).toBe('Up');
  });

  test('searches TV shows', async () => {
    tmdb.mockResolvedValue({ data: { results: [{ id: 1, name: 'Lost' }], total_pages: 1 } });
    const { data } = await searchMovie('lost', 1, true, true) as Success<any>;
    expect(tmdb).toHaveBeenCalledWith('/search/tv', { params: { query: 'lost', page: 1, include_adult: true } });
    expect(data.movies[0]).toMatchObject({ title: 'Lost', isTvShow: true });
  });
});

describe('fetchFavoriteMovies', () => {
  test('maps the backend rows', async () => {
    backend.mockResolvedValue({ data: { data: [
      { id: 1, title: 'Up', poster_path: '/up.jpg', is_tv_show: false, rating: 7.123, rating_count: 10, notes: 'n', last_added_at: '2026-01-01T00:00:00Z' },
    ] } });
    const { data } = await fetchFavoriteMovies() as Success<any>;
    expect(backend).toHaveBeenCalledWith('/collections/latest_movies');
    expect(data[0]).toMatchObject({ id: 1, posterPath: '/up.jpg', rating: '7.12', ratingCount: 10, collectionNotes: 'n', collectionAddTime: Date.parse('2026-01-01T00:00:00Z') });
  });

  test('surfaces the backend message', async () => {
    backend.mockRejectedValue({ response: { status: 401, data: { message: 'Authentication required' } } });
    expect(await fetchFavoriteMovies()).toMatchObject({ message: 'Authentication required', errorCode: 401 });
  });
});
