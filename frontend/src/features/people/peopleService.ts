import { People, PeopleMovieCredit, SearchPeopleResponse } from './peopleModel';
import { toApiError } from '@/lib/apiError';
import tmdbApiClient from '@/lib/tmdbClient';

interface TmdbCredit {
  id: number;
  title?: string;
  name?: string;
  character?: string;
  job?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
}
interface TmdbPerson {
  id: number;
  name: string;
  profile_path?: string;
  biography?: string;
  birthday?: string;
  place_of_birth?: string;
  known_for_department?: string;
  gender?: number;
  movie_credits?: { cast?: TmdbCredit[]; crew?: TmdbCredit[] };
  tv_credits?: { cast?: TmdbCredit[]; crew?: TmdbCredit[] };
}

const mTmdbApiClient = tmdbApiClient();

const transformPeopleData = (data: TmdbPerson): People => {
  const actingCredits = [] as PeopleMovieCredit[];
  data.movie_credits?.cast?.forEach((credit) => {
    actingCredits.push({
      id: credit.id ?? 0,
      title: credit.title ?? '',
      character: credit.character,
      posterPath: credit.poster_path,
      releaseDate: credit.release_date,
      rating: credit.vote_average,
      ratingCount: credit.vote_count,
      isTvShow: false,
    });
  });
  data.tv_credits?.cast?.forEach((credit) => {
    actingCredits.push({
      id: credit.id ?? 0,
      title: credit.name ?? '',
      character: credit.character,
      posterPath: credit.poster_path,
      releaseDate: credit.first_air_date,
      rating: credit.vote_average,
      ratingCount: credit.vote_count,
      isTvShow: true,
    });
  });
  actingCredits.sort(sortByReleaseDate);

  const crewCredits = [] as PeopleMovieCredit[];
  data.movie_credits?.crew?.forEach((credit) => {
    crewCredits.push({
      id: credit.id ?? 0,
      title: credit.title ?? '',
      character: credit.job,
      posterPath: credit.poster_path,
      releaseDate: credit.release_date,
      rating: credit.vote_average,
      ratingCount: credit.vote_count,
      isTvShow: false,
    });
  });
  data.tv_credits?.crew?.forEach((credit) => {
    crewCredits.push({
      id: credit.id ?? 0,
      title: credit.name ?? '',
      character: credit.job,
      posterPath: credit.poster_path,
      releaseDate: credit.first_air_date,
      rating: credit.vote_average,
      ratingCount: credit.vote_count,
      isTvShow: true,
    });
  });
  crewCredits.sort(sortByReleaseDate);

  const people: People = {
    id: data.id ?? 0,
    name: data.name ?? '',
    photoPath: data.profile_path ?? '',
    biography: data.biography,
    birthday: data.birthday,
    placeOfBirth: data.place_of_birth,
    knownForDepartment: data.known_for_department,
    gender: data.gender,
    actingCredits: actingCredits,
    crewCredits: crewCredits,
  };

  return people;
};

const sortByReleaseDate = (a: PeopleMovieCredit, b: PeopleMovieCredit): number => {
  const MAX_DATE = 8640000000000000;
  const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date(MAX_DATE);
  const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date(MAX_DATE);
  return dateB.getTime() - dateA.getTime();
};

export const fetchPeopleDetails = async (peopleId: string): Promise<People> => {
  try {
    const params = {
      append_to_response: 'movie_credits,tv_credits',
    };
    const response = await mTmdbApiClient.get<TmdbPerson>(`person/${peopleId}`, { params });
    const people = transformPeopleData(response.data);
    return people;
  } catch (error: unknown) {
    throw toApiError(error, 'Failed to fetch people details.');
  }
};

export const searchPeople = async (query: string, page: number): Promise<SearchPeopleResponse> => {
  try {
    const params = {
      query,
      page,
      append_to_response: 'movie_credits,tv_credits',
    };
    const response = await mTmdbApiClient.get<{ results: TmdbPerson[]; total_pages: number }>(
      `search/person`,
      { params },
    );
    const people = response.data.results.map((data: TmdbPerson) => transformPeopleData(data));
    return { people: people, totalPages: response.data.total_pages };
  } catch (error: unknown) {
    throw toApiError(error, 'Failed to search people.');
  }
};
