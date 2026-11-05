import { Success, Error as ApiError } from '../../model/apiResponse';
import { Collection } from '../../model/collectionModel';
import { Crew, DEFAULT_MOVIE_POSTER, Movie } from '../../model/movieModel';
import { People, PeopleMovieCredit } from '../../model/peopleModel';

describe('Movie', () => {
  test('builds image URLs and falls back when artwork is missing', () => {
    const movie = new Movie({ posterPath: '/p.jpg', backdropPath: '/b.jpg' });
    expect(movie.smallPosterUrl()).toBe('small//p.jpg');
    expect(movie.bigPosterUrl()).toBe('big//p.jpg');
    expect(movie.smallBackdropUrl()).toBe('small//b.jpg');
    expect(movie.bigBackdropUrl()).toBe('big//b.jpg');

    const bare = new Movie({});
    expect(bare.smallPosterUrl()).toBe(DEFAULT_MOVIE_POSTER);
    expect(bare.bigPosterUrl()).toBe(DEFAULT_MOVIE_POSTER);
    expect(bare.bigBackdropUrl()).toBeNull();
  });

  test('reads the release year', () => {
    expect(new Movie({ releaseDate: '2009-05-28' }).releaseYear()).toBe('2009');
    expect(new Movie({ releaseDate: '' }).releaseYear()).toBeNull();
    expect(new Movie({}).releaseYear()).toBeNull();
  });

  test('finds the director', () => {
    const crew = [new Crew(1, 'A', '', 'Writer'), new Crew(2, 'B', '', 'Director')];
    expect(new Movie({ crew }).director()?.name).toBe('B');
    expect(new Movie({}).director()).toBeUndefined();
  });

  test('finds the notes for one collection', () => {
    const collection = new Collection('c1', 'One');
    collection.moviesCollectionNotes = 'Nice';
    const movie = new Movie({ collections: [collection] });
    expect(movie.notesInCollection('c1')).toBe('Nice');
    expect(movie.notesInCollection('c2')).toBeUndefined();
    expect(new Movie({}).notesInCollection('c1')).toBeUndefined();
  });
});

describe('People', () => {
  test.each([[1, 'Female'], [2, 'Male'], [3, 'Non-binary'], [0, 'Unspecified'], [undefined, 'Unspecified']])(
    'gender %s reads %s', (gender, text) => expect(new People({ gender }).genderText()).toBe(text));

  test('falls back to the default image', () => {
    expect(new People({ photoPath: '/a.jpg' }).photoUrl()).toBe('small//a.jpg');
    expect(new People({}).photoUrl()).toBe(DEFAULT_MOVIE_POSTER);
    expect(new PeopleMovieCredit({ posterPath: '/a.jpg' }).posterUrl()).toBe('small//a.jpg');
    expect(new PeopleMovieCredit({}).posterUrl()).toBe(DEFAULT_MOVIE_POSTER);
  });
});

test('results say whether they succeeded', () => {
  expect(new Success('x')).toMatchObject({ isSuccess: true, message: 'Success', data: 'x' });
  expect(new ApiError('nope')).toMatchObject({ isSuccess: false, message: 'nope', errorCode: 0 });
  expect(new ApiError('nope', 404).errorCode).toBe(404);
});
