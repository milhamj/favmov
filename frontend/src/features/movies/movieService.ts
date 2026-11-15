import { Movie, SearchMovieResponse } from './movieModel';
import { toApiError } from '@/lib/apiError';
import tmdbApiClient, { TMDB_IMAGE_SMALL } from '@/lib/tmdbClient';
import backendClient from '@/lib/backendClient';
import { movieFromRow, MovieRow } from '@/features/collections/collectionService';

interface TmdbCredits {
  cast?: { id: number; name: string; profile_path: string | null; character: string }[];
  crew?: { id: number; name: string; profile_path: string | null; job: string }[];
}
interface TmdbMovie {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  runtime?: string;
  genres?: { name: string }[];
  credits?: TmdbCredits;
}
interface TmdbMoviePage {
  results: TmdbMovie[];
  total_pages: number;
}

const mTmdbApiClient = tmdbApiClient();

const profilePhotoUrl = (path: string | null) => (path ? TMDB_IMAGE_SMALL + path : undefined);

const transformMovieData = (data: TmdbMovie, isTvShow?: boolean): Movie => {
  const movie: Movie = {
    id: data.id ?? 0,
    title: (data.title || data.name) ?? '',
    posterPath: data.poster_path ?? '',
  };
  movie.backdropPath = data.backdrop_path;
  movie.overview = data.overview;
  movie.releaseDate = data.release_date || data.first_air_date;
  movie.rating = data.vote_average?.toFixed(2);
  movie.ratingCount = data.vote_count;
  movie.runtime = data.runtime;
  movie.genres = data.genres?.map((genre) => genre.name);
  movie.isTvShow = isTvShow === true;
  movie.cast = data.credits?.cast?.slice(0, 10).map((actor) => {
    return {
      id: actor.id,
      name: actor.name,
      photoUrl: profilePhotoUrl(actor.profile_path),
      character: actor.character,
    };
  });

  const director = data.credits?.crew?.find((crewMember) => crewMember.job === 'Director');
  const producers = data.credits?.crew?.filter((crewMember) =>
    crewMember.job?.includes('Producer'),
  );
  const otherCrew = data.credits?.crew?.filter(
    (crewMember) => crewMember.job !== 'Director' && !crewMember.job?.includes('Producer'),
  );
  const crew: NonNullable<TmdbCredits['crew']> = [];
  if (director) crew.push(director);
  if (producers) crew.push(...producers);
  if (otherCrew) crew.push(...otherCrew);
  movie.crew = crew?.slice(0, 20).map((crew) => {
    return {
      id: crew.id,
      name: crew.name,
      photoUrl: profilePhotoUrl(crew.profile_path),
      job: crew.job,
    };
  });
  return movie;
};

export const fetchTrendingMovies = async (page: number = 1): Promise<Movie[]> => {
  try {
    const response = await mTmdbApiClient.get<TmdbMoviePage>(`/trending/movie/week`, {
      params: { page },
    });
    const movies = response.data.results.map((data) => transformMovieData(data));
    return movies;
  } catch (error: unknown) {
    throw toApiError(error, 'Failed to fetch trending movies');
  }
};

export const fetchTrendingShows = async (page: number = 1): Promise<Movie[]> => {
  try {
    const response = await mTmdbApiClient.get<TmdbMoviePage>(`/trending/tv/week`, {
      params: { page },
    });
    const movies = response.data.results.map((data: TmdbMovie) => transformMovieData(data, true));
    return movies;
  } catch (error: unknown) {
    throw toApiError(error, 'Failed to fetch trending TV shows');
  }
};

export const fetchPopularMovies = async (page: number = 1): Promise<Movie[]> => {
  try {
    const response = await mTmdbApiClient.get<TmdbMoviePage>(`/movie/popular`, {
      params: { page },
    });
    const movies = response.data.results.map((data) => transformMovieData(data));
    return movies;
  } catch (error: unknown) {
    throw toApiError(error, 'Failed to fetch popular movies');
  }
};

export const fetchMovieDetails = async (movieId: string, isTvShow?: boolean): Promise<Movie> => {
  try {
    let url = isTvShow === true ? `/tv/${movieId}` : `/movie/${movieId}`;
    url += `?append_to_response=credits`;
    const response = await mTmdbApiClient.get<TmdbMovie>(url);
    const movie = transformMovieData(response.data, isTvShow);
    return movie;
  } catch (error: unknown) {
    throw toApiError(error, 'Failed to fetch movie details');
  }
};

export const searchMovie = async (
  query: string,
  page: number,
  isTvShow?: boolean,
  includeAdult?: boolean,
): Promise<SearchMovieResponse> => {
  try {
    const response = await mTmdbApiClient.get<TmdbMoviePage>(
      `/search/${isTvShow === true ? 'tv' : 'movie'}`,
      {
        params: {
          query,
          page,
          include_adult: includeAdult ? true : false,
        },
      },
    );

    const movies = response.data.results.map((data: TmdbMovie) =>
      transformMovieData(data, isTvShow === true),
    );
    const searchResponse: SearchMovieResponse = {
      movies: movies,
      totalPages: response.data.total_pages,
    };

    return searchResponse;
  } catch (error: unknown) {
    throw toApiError(error, `Failed to search movie with query: ${query}`);
  }
};

export const fetchFavoriteMovies = async (): Promise<Movie[]> => {
  try {
    const response = await backendClient.get<{ data: MovieRow[] }>(`/collections/latest_movies`);

    const movies = response.data.data.map(movieFromRow);

    return movies;
  } catch (error: unknown) {
    throw toApiError(error, `Failed to fetch favorite movies.`, true);
  }
};
