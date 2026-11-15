import {
  bigBackdropUrl,
  bigPosterUrl,
  DEFAULT_MOVIE_POSTER,
  director,
  notesInCollection,
  releaseYear,
  smallBackdropUrl,
  smallPosterUrl,
} from '@/features/movies/movieModel';
import {
  creditPosterUrl,
  genderText,
  personBigPhotoUrl,
  personPhotoUrl,
} from '@/features/people/peopleModel';
import {
  collection as makeCollection,
  crew as makeCrew,
  movie as makeMovie,
  person as makePeople,
  credit as makePeopleMovieCredit,
} from '../../../test/factories';

describe('Movie', () => {
  test('builds image URLs and falls back when artwork is missing', () => {
    const movie = makeMovie({ posterPath: '/p.jpg', backdropPath: '/b.jpg' });
    expect(smallPosterUrl(movie)).toBe('small//p.jpg');
    expect(bigPosterUrl(movie)).toBe('big//p.jpg');
    expect(smallBackdropUrl(movie)).toBe('small//b.jpg');
    expect(bigBackdropUrl(movie)).toBe('big//b.jpg');

    const bare = makeMovie({});
    expect(smallPosterUrl(bare)).toBe(DEFAULT_MOVIE_POSTER);
    expect(bigPosterUrl(bare)).toBe(DEFAULT_MOVIE_POSTER);
    expect(bigBackdropUrl(bare)).toBeNull();
  });

  test('reads the release year', () => {
    expect(releaseYear(makeMovie({ releaseDate: '2009-05-28' }))).toBe('2009');
    expect(releaseYear(makeMovie({ releaseDate: '' }))).toBeNull();
    expect(releaseYear(makeMovie({}))).toBeNull();
  });

  test('finds the director', () => {
    const crew = [makeCrew(1, 'A', '', 'Writer'), makeCrew(2, 'B', '', 'Director')];
    expect(director(makeMovie({ crew }))?.name).toBe('B');
    expect(director(makeMovie({}))).toBeUndefined();
  });

  test('finds the notes for one collection', () => {
    const collection = makeCollection('c1', 'One');
    collection.moviesCollectionNotes = 'Nice';
    const movie = makeMovie({ collections: [collection] });
    expect(notesInCollection(movie, 'c1')).toBe('Nice');
    expect(notesInCollection(movie, 'c2')).toBeUndefined();
    expect(notesInCollection(makeMovie({}), 'c1')).toBeUndefined();
  });
});

describe('People', () => {
  test.each([
    [1, 'Female'],
    [2, 'Male'],
    [3, 'Non-binary'],
    [0, 'Unspecified'],
    [undefined, 'Unspecified'],
  ])('gender %s reads %s', (gender, text) => expect(genderText(makePeople({ gender }))).toBe(text));

  test('falls back to the default image', () => {
    expect(personPhotoUrl(makePeople({ photoPath: '/a.jpg' }))).toBe('small//a.jpg');
    expect(personPhotoUrl(makePeople({}))).toBe(DEFAULT_MOVIE_POSTER);
    expect(personBigPhotoUrl(makePeople({ photoPath: '/a.jpg' }))).toBe('big//a.jpg');
    expect(personBigPhotoUrl(makePeople({}))).toBe(DEFAULT_MOVIE_POSTER);
    expect(creditPosterUrl(makePeopleMovieCredit({ posterPath: '/a.jpg' }))).toBe('small//a.jpg');
    expect(creditPosterUrl(makePeopleMovieCredit({}))).toBe(DEFAULT_MOVIE_POSTER);
  });
});
