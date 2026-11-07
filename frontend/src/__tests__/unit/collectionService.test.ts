import { Error as ApiError, Success } from '../../model/apiResponse';
import { Movie } from '../../model/movieModel';
import backendClient from '../../services/backendClient';
import {
  createCollection, deleteMovieFromCollection, getCheckMovieExistInCollection, getCollectionDetail,
  getUserCollections, postAddMovieToCollection, updateNotes,
} from '../../services/collectionService';

jest.mock('../../services/backendClient', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() } }));

const api = backendClient as jest.Mocked<typeof backendClient>;
const ok = (data: unknown) => ({ data: { success: true, data } }) as any;
const rejected = (status: number, message?: string) => ({ response: { status, data: { message } } });

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

test('createCollection posts the name and maps the row', async () => {
  api.post.mockResolvedValue(ok({ id: 'c1', name: 'Sci-Fi', user_id: 'u', created_at: 'then' }));
  const { data } = await createCollection('Sci-Fi') as Success<any>;
  expect(api.post).toHaveBeenCalledWith('/collections', { name: 'Sci-Fi' });
  expect(data).toMatchObject({ id: 'c1', name: 'Sci-Fi', userId: 'u', createdAt: 'then' });
});

test('createCollection shows the backend message, or a default', async () => {
  api.post.mockRejectedValueOnce(rejected(400, 'You already have a collection with the same name.'));
  expect(await createCollection('x')).toMatchObject({ message: 'You already have a collection with the same name.', errorCode: 400 });
  api.post.mockRejectedValueOnce(new Error('Network Error'));
  expect(await createCollection('x')).toMatchObject({ message: 'Failed to create collection', errorCode: 0 });
});

test('getUserCollections maps counts and dates', async () => {
  api.get.mockResolvedValue(ok([{ id: 'c1', name: 'A', movies_count: 2, last_updated: 'now' }, { id: 'c2', name: 'B', movies_count: 0 }]));
  const { data } = await getUserCollections() as Success<any>;
  expect(data[0]).toMatchObject({ moviesCount: 2, lastUpdated: 'now' });
  expect(data[1].moviesCount).toBeUndefined();
});

test('getCollectionDetail maps the titles', async () => {
  api.get.mockResolvedValue(ok({ id: 'c1', name: 'A', movies: [
    { id: 1, title: 'Up', poster_path: '/up.jpg', is_tv_show: false, rating: 7.123, rating_count: 3, notes: 'n', release_date: '2009-05-28', created_at: '2026-01-01T00:00:00Z' },
  ] }));
  const { data } = await getCollectionDetail('c1') as Success<any>;
  expect(api.get).toHaveBeenCalledWith('/collections/c1/movies');
  expect(data.movies[0]).toBeInstanceOf(Movie);
  expect(data.movies[0]).toMatchObject({ posterPath: '/up.jpg', rating: '7.12', collectionNotes: 'n', releaseDate: '2009-05-28', collectionAddTime: Date.parse('2026-01-01T00:00:00Z') });
});

test('getCheckMovieExistInCollection maps collection names and notes', async () => {
  api.get.mockResolvedValue(ok([{ collection_id: 'c1', collection_name: 'A', notes: 'n' }]));
  const { data } = await getCheckMovieExistInCollection('1', true) as Success<any>;
  expect(api.get).toHaveBeenCalledWith('/collections/check_exist/1?is_tv_show=true');
  expect(data[0]).toMatchObject({ id: 'c1', name: 'A', moviesCollectionNotes: 'n' });
});

describe('postAddMovieToCollection', () => {
  const movie = new Movie({ id: 7, title: 'Up', posterPath: '/up.jpg', rating: 8, ratingCount: 3, releaseDate: '2009-05-28' });

  test('sends a movie under movie_id', async () => {
    api.post.mockResolvedValue(ok({ id: 1, user_id: 'u', collection_id: 'c1', created_at: '2026-01-01T00:00:00Z', is_tv_show: false, movie_id: 7 }));
    const { data } = await postAddMovieToCollection('c1', movie, false) as Success<any>;
    expect(api.post).toHaveBeenCalledWith('/collections/c1/movies', {
      movie_id: 7, tv_show_id: undefined, title: 'Up', poster_path: '/up.jpg', rating: 8, rating_count: 3, release_date: '2009-05-28', is_tv_show: false,
    });
    expect(data).toMatchObject({ collectionId: 'c1', movieId: 7 });
  });

  test('sends a TV show under tv_show_id, with null for missing numbers', async () => {
    api.post.mockResolvedValue(ok({ id: 1, is_tv_show: true, tv_show_id: 7 }));
    const show = new Movie({ id: 7, title: 'Lost', posterPath: '/l.jpg' });
    const { data } = await postAddMovieToCollection('c1', show, true) as Success<any>;
    expect(api.post.mock.calls[0][1]).toMatchObject({ movie_id: undefined, tv_show_id: 7, rating: null, rating_count: null, release_date: null });
    expect(data.tvShowId).toBe(7);
  });

  test('surfaces the backend message', async () => {
    api.post.mockRejectedValue(rejected(404, 'Collection not found or access denied'));
    expect(await postAddMovieToCollection('c1', movie, false)).toMatchObject({ message: 'Collection not found or access denied', errorCode: 404 });
  });

  test('sends a blank poster as null', async () => {
    api.post.mockResolvedValue(ok({ id: 1 }));
    await postAddMovieToCollection('c1', new Movie({ id: 7, title: 'Up', posterPath: '  ' }), false);
    expect(api.post.mock.calls[0][1]).toMatchObject({ poster_path: null });
  });

  test('the fallback message names the media type', async () => {
    api.post.mockRejectedValue(new Error('Network Error'));
    expect(await postAddMovieToCollection('c1', movie, false)).toMatchObject({ message: 'Failed to add movie to the collection.' });
    expect(await postAddMovieToCollection('c1', movie, true)).toMatchObject({ message: 'Failed to add tv show to the collection.' });
  });
});

test('deleteMovieFromCollection passes the media type', async () => {
  api.delete.mockResolvedValue(ok({ is_success: true }));
  expect(await deleteMovieFromCollection('c1', '7', true)).toBeInstanceOf(Success);
  expect(api.delete).toHaveBeenCalledWith('/collections/c1/movies/7?is_tv_show=true');
});

test('deleteMovieFromCollection treats success: false as a failure', async () => {
  api.delete.mockResolvedValue({ data: { success: false, message: 'Nope' } } as any);
  const result = await deleteMovieFromCollection('c1', '7', false);
  expect(result).toBeInstanceOf(ApiError);
  expect(result.message).toBe('Nope');
});

test('updateNotes posts the notes and media type', async () => {
  api.post.mockResolvedValue(ok({}));
  expect(await updateNotes('c1', '7', false, 'Nice')).toBeInstanceOf(Success);
  expect(api.post).toHaveBeenCalledWith('/collections/c1/movies/7/notes', { notes: 'Nice', is_tv_show: false });
});

test('updateNotes surfaces failures', async () => {
  api.post.mockRejectedValue(rejected(404, 'Movie not found in collection.'));
  expect(await updateNotes('c1', '7', false, 'x')).toMatchObject({ message: 'Movie not found in collection.', errorCode: 404 });
});
