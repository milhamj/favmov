import { TMDB_IMAGE_SMALL, TMDB_IMAGE_BIG } from '@/lib/tmdbClient';
import { DEFAULT_MOVIE_POSTER } from '@/features/movies/movieModel';

export type People = {
  id: number;
  name: string;
  photoPath: string;
  biography?: string;
  birthday?: string;
  placeOfBirth?: string;
  knownForDepartment?: string;
  gender?: number;
  actingCredits?: PeopleMovieCredit[];
  crewCredits?: PeopleMovieCredit[];
};

export function personPhotoUrl(person: People): string {
  return person.photoPath ? TMDB_IMAGE_SMALL + person.photoPath : DEFAULT_MOVIE_POSTER;
}

export function personBigPhotoUrl(person: People): string {
  return person.photoPath ? TMDB_IMAGE_BIG + person.photoPath : DEFAULT_MOVIE_POSTER;
}

export function genderText(person: People): string {
  switch (person.gender) {
    case 1:
      return 'Female';
    case 2:
      return 'Male';
    case 3:
      return 'Non-binary';
    default:
      return 'Unspecified';
  }
}

export type PeopleMovieCredit = {
  id: number;
  title: string;
  character?: string;
  posterPath?: string;
  releaseDate?: string;
  episodeCount?: number;
  rating?: number;
  ratingCount?: number;
  isTvShow?: boolean;
};

export function creditPosterUrl(credit: PeopleMovieCredit): string | undefined {
  return credit.posterPath ? TMDB_IMAGE_SMALL + credit.posterPath : DEFAULT_MOVIE_POSTER;
}

export type SearchPeopleResponse = {
  people: People[];
  totalPages: number;
};
