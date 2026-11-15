import { Collection, CollectionCard } from '@/features/collections/collectionModel';
import { Actor, Crew, Movie } from '@/features/movies/movieModel';
import { People, PeopleMovieCredit } from '@/features/people/peopleModel';
import { TMDB_IMAGE_SMALL } from '@/lib/tmdbClient';

export function collection(id: string, name: string): Collection {
  return {
    id,
    name,
  };
}

export function movie(data: Partial<Movie>): Movie {
  return {
    id: data.id ?? 0,
    title: data.title ?? '',
    posterPath: data.posterPath ?? '',
    backdropPath: data.backdropPath,
    overview: data.overview,
    releaseDate: data.releaseDate,
    genres: data.genres,
    cast: data.cast,
    crew: data.crew,
    rating: data.rating,
    ratingCount: data.ratingCount,
    runtime: data.runtime,
    isTvShow: data.isTvShow,
    collectionNotes: data.collectionNotes,
    collectionAddTime: data.collectionAddTime,
    collections: data.collections,
  };
}

export function collectionCard(id: string, name: string, isInCollection: boolean): CollectionCard {
  return {
    id,
    name,
    isInCollection,
  };
}

export function actor(id: number, name: string, photoPath: string, character: string): Actor {
  return {
    id,
    name,
    photoUrl: TMDB_IMAGE_SMALL + photoPath,
    character,
  };
}

export function crew(id: number, name: string, photoPath: string, job: string): Crew {
  return {
    id,
    name,
    photoUrl: TMDB_IMAGE_SMALL + photoPath,
    job,
  };
}

export function credit(data: Partial<PeopleMovieCredit>): PeopleMovieCredit {
  return {
    id: data.id ?? 0,
    title: data.title ?? '',
    character: data.character,
    posterPath: data.posterPath,
    releaseDate: data.releaseDate,
    episodeCount: data.episodeCount,
    rating: data.rating,
    ratingCount: data.ratingCount,
    isTvShow: data.isTvShow,
  };
}

export function person(data: Partial<People>): People {
  return {
    id: data.id ?? 0,
    name: data.name ?? '',
    photoPath: data.photoPath ?? '',
    biography: data.biography,
    birthday: data.birthday,
    placeOfBirth: data.placeOfBirth,
    knownForDepartment: data.knownForDepartment,
    gender: data.gender,
    actingCredits: data.actingCredits,
    crewCredits: data.crewCredits,
  };
}
