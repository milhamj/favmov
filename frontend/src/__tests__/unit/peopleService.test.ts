import { Success } from '../../model/apiResponse';
import { fetchPeopleDetails, searchPeople } from '../../services/peopleService';
import tmdbApiClient from '../../services/tmdbClient';

jest.mock('../../services/tmdbClient', () => {
  const client = { get: jest.fn() };
  return { __esModule: true, default: () => client, TMDB_IMAGE_BIG: 'big/', TMDB_IMAGE_SMALL: 'small/' };
});

const tmdb = tmdbApiClient().get as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

test('merges movie and TV credits, undated first, then newest', async () => {
  tmdb.mockResolvedValue({ data: {
    id: 1, name: 'Ann', profile_path: '/a.jpg', known_for_department: 'Acting', place_of_birth: 'Oslo', gender: 1,
    movie_credits: {
      cast: [{ id: 10, title: 'Old', character: 'Hero', release_date: '2001-01-01' }, { id: 11, title: 'Upcoming', character: 'Lead' }],
      crew: [{ id: 12, title: 'Directed', job: 'Director', release_date: '2010-01-01' }],
    },
    tv_credits: {
      cast: [{ id: 20, name: 'Series', character: 'Self', first_air_date: '2015-01-01' }],
      crew: [{ id: 21, name: 'Produced', job: 'Producer', first_air_date: '2020-01-01' }],
    },
  } });

  const { data } = await fetchPeopleDetails('1') as Success<any>;

  expect(tmdb).toHaveBeenCalledWith('person/1', { params: { append_to_response: 'movie_credits,tv_credits' } });
  expect(data).toMatchObject({ name: 'Ann', photoPath: '/a.jpg', knownForDepartment: 'Acting', placeOfBirth: 'Oslo' });
  expect(data.actingCredits.map((c: any) => [c.title, c.isTvShow])).toEqual([['Upcoming', false], ['Series', true], ['Old', false]]);
  expect(data.crewCredits.map((c: any) => [c.title, c.character])).toEqual([['Produced', 'Producer'], ['Directed', 'Director']]);
});

test('reports failures', async () => {
  tmdb.mockRejectedValue({ response: { status: 404 } });
  expect(await fetchPeopleDetails('1')).toMatchObject({ message: 'Failed to fetch people details.', errorCode: 404 });
  expect(await searchPeople('x', 1)).toMatchObject({ message: 'Failed to search people.', errorCode: 404 });
});

test('search returns people and the page count', async () => {
  tmdb.mockResolvedValue({ data: { results: [{ id: 1, name: 'Ann' }], total_pages: 4 } });
  const { data } = await searchPeople('ann', 2) as Success<any>;
  expect(tmdb.mock.calls[0][1].params).toMatchObject({ query: 'ann', page: 2 });
  expect(data.people[0].name).toBe('Ann');
  expect(data.totalPages).toBe(4);
});
