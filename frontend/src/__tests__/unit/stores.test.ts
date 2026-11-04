import { Movie } from '../../model/movieModel';
import { CollectionStateStore } from '../../stores/collectionStateStore';
import { MovieStore } from '../../stores/movieStore';

const THIRTY_MINUTES = 30 * 60 * 1000;

beforeEach(() => MovieStore.clear());
afterEach(() => jest.restoreAllMocks());

describe('MovieStore', () => {
  test('returns a cached movie until it is taken', () => {
    const movie = new Movie({ id: 1 });
    MovieStore.cacheMovie(movie);
    expect(MovieStore.getCachedMovie('1')).toBe(movie);
    expect(MovieStore.getCachedMovieAndDelete('1')).toBe(movie);
    expect(MovieStore.getCachedMovie('1')).toBeUndefined();
  });

  test('keeps a TV show and a movie with the same id apart', () => {
    const movie = new Movie({ id: 1 });
    const show = new Movie({ id: 1, isTvShow: true });
    MovieStore.cacheMovie(movie);
    MovieStore.cacheMovie(show);
    expect(MovieStore.getCachedMovie('1', false)).toBe(movie);
    expect(MovieStore.getCachedMovie('1', true)).toBe(show);
  });

  test('expires entries after 30 minutes', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
    MovieStore.cacheMovie(new Movie({ id: 1 }));
    now.mockReturnValue(1000 + THIRTY_MINUTES);
    expect(MovieStore.getCachedMovie('1')).toBeDefined();
    now.mockReturnValue(1000 + THIRTY_MINUTES + 1);
    expect(MovieStore.getCachedMovie('1')).toBeUndefined();
    expect(MovieStore.getStats().size).toBe(0);
  });

  test('evicts the oldest entry past 100 movies', () => {
    for (let id = 1; id <= 101; id++) MovieStore.cacheMovie(new Movie({ id }));
    expect(MovieStore.getStats().size).toBe(100);
    expect(MovieStore.getCachedMovie('1')).toBeUndefined();
    expect(MovieStore.getCachedMovie('2')).toBeDefined();
  });
});

test('CollectionStateStore remembers the last change', () => {
  CollectionStateStore.setLastUpdated(123);
  expect(CollectionStateStore.getLastUpdated()).toBe(123);
});
