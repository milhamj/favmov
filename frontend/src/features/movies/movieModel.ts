import { TMDB_IMAGE_BIG, TMDB_IMAGE_SMALL } from '@/lib/tmdbClient';
import { Collection } from '@/features/collections/collectionModel';

export const DEFAULT_MOVIE_POSTER =
  'https://gdlqv951tx.ufs.sh/f/C0k8wbELmJeDcMuLQWhtMl1KAdxX9nIyRPp2bGkVSim8wTUs'; // frontend/assets/images/movie_poster.png

export type Movie = {
  id: number;
  title: string;
  posterPath: string;
  backdropPath?: string;
  overview?: string;
  releaseDate?: string;
  genres?: string[];
  cast?: Actor[];
  crew?: Crew[];
  rating?: number | string; // TMDB-derived ratings are pre-formatted "7.12" strings
  ratingCount?: number;
  runtime?: string;
  isTvShow?: boolean;
  collectionNotes?: string;
  collectionAddTime?: number;
  collections?: Collection[];
};

export function bigBackdropUrl(movie: Movie): string | null {
  return movie.backdropPath ? TMDB_IMAGE_BIG + movie.backdropPath : null;
}

export function smallBackdropUrl(movie: Movie): string | null {
  return movie.backdropPath ? TMDB_IMAGE_SMALL + movie.backdropPath : null;
}

export function bigPosterUrl(movie: Movie): string {
  return movie.posterPath ? TMDB_IMAGE_BIG + movie.posterPath : DEFAULT_MOVIE_POSTER;
}

export function smallPosterUrl(movie: Movie): string {
  return movie.posterPath ? TMDB_IMAGE_SMALL + movie.posterPath : DEFAULT_MOVIE_POSTER;
}

export function director(movie: Movie): Crew | undefined {
  return movie.crew?.find((member) => member.job === 'Director');
}

export function notesInCollection(movie: Movie, collectionId: string): string | undefined {
  return movie.collections
    ? movie.collections.find((c) => c.id === collectionId)?.moviesCollectionNotes
    : undefined;
}

export function releaseYear(movie: Movie): string | null {
  if (!movie.releaseDate) return null;

  const dateArr = movie.releaseDate.split('-');
  return dateArr.length > 0 && dateArr[0] ? dateArr[0] : null;
}

export type Actor = {
  id: number;
  name: string;
  photoUrl?: string;
  character: string;
};

export type Crew = {
  id: number;
  name: string;
  photoUrl?: string;
  job: string;
};

export type SearchMovieResponse = {
  movies: Movie[];
  totalPages: number;
};
