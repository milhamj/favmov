import { Movie, Actor, Crew } from '../model/movieModel';
import { Success, Error } from '../model/apiResponse';
import tmdbApiClient from './tmdbClient';
import backendClient from './backendClient';
import { SearchResponse } from '../model/searchResponse';

const mTmdbApiClient = tmdbApiClient();

const transformMovieData = (data: any, isTvShow?: boolean): Movie => {
  const movie = new Movie({
    id: data.id, 
    title: data.title || data.name, 
    posterPath: data.poster_path
  })
  movie.backdropPath = data.backdrop_path;
  movie.overview = data.overview;
  movie.releaseDate = data.release_date || data.first_air_date;
  movie.rating = data.vote_average?.toFixed(2);
  movie.ratingCount = data.vote_count;
  movie.runtime = data.runtime;
  movie.genres = data.genres?.map((genre: any) => genre.name);
  movie.isTvShow = isTvShow === true;
  movie.cast = data.credits?.cast?.slice(0, 10).map((actor: any) => {
    return new Actor(
      actor.id, 
      actor.name, 
      actor.profile_path, 
      actor.character
    )
  });
  // Put the 'Director' and 'Producer' as the first elements
  const director = data.credits?.crew?.find((crewMember: any) => crewMember.job === 'Director');
  const producers = data.credits?.crew?.filter((crewMember: any) => crewMember.job?.includes('Producer'));
  const otherCrew = data.credits?.crew?.filter((crewMember: any) => crewMember.job !== 'Director' && !crewMember.job?.includes('Producer'));
  const crew: Crew[] = [];
  if (director) crew.push(director);
  if (producers) crew.push(...producers);
  if (otherCrew) crew.push(...otherCrew)
  movie.crew = crew?.slice(0, 20).map((crew: any) => {
    return new Crew(
      crew.id,
      crew.name,
      crew.profile_path,
      crew.job
    )
  });
  // console.log('transformMovieData', movie);
  return movie;
}

export const fetchTrendingMovies = async (): Promise<Success<Movie[]> | Error> => {
  try {
    const response = await mTmdbApiClient.get(`/trending/movie/week`);
    const movies = response.data.results.map(transformMovieData);
    return new Success<Movie[]>(movies);
  } catch (error: any) {
    console.error('Error fetching trending movies:', error);
    return new Error('Failed to fetch trending movies', error.response?.status);
  }
};

export const fetchTrendingShows = async (): Promise<Success<Movie[]> | Error> => {
  try {
    const response = await mTmdbApiClient.get(`/trending/tv/week`);
    const movies = response.data.results.map((data: any) => transformMovieData(data, true));
    return new Success<Movie[]>(movies);
  } catch (error: any) {
    console.error('Error fetching trending TV shows:', error);
    return new Error('Failed to fetch trending TV shows', error.response?.status);
  }
};

export const fetchPopularMovies = async (): Promise<Success<Movie[]> | Error> => {
  try {
    const response = await mTmdbApiClient.get(`/movie/popular`);
    const movies = response.data.results.map(transformMovieData);
    return new Success<Movie[]>(movies);
  } catch (error: any) {
    console.error('Error fetching popular movies:', error);
    return new Error('Failed to fetch popular movies', error.response?.status);
  }
};

export const fetchMovieDetails = async (movieId: string, isTvShow?: boolean): Promise<Success<Movie> | Error> => {
  try {
    let url = isTvShow === true ? `/tv/${movieId}` : `/movie/${movieId}`;
    url += `?append_to_response=credits`;
    const response = await mTmdbApiClient.get(url);
    const movie = transformMovieData(response.data, isTvShow);
    return new Success<Movie>(movie);
  } catch (error: any) {
    console.error('Error fetching movie details:', error);
    return new Error('Failed to fetch movie details', error.response?.status);
  }
};

export const searchMovie = async (query: string, page: number, isTvShow?: boolean, includeAdult?: boolean): Promise<Success<SearchResponse> | Error> => {
  try {
    const response = await mTmdbApiClient.get(`/search/${isTvShow === true ? 'tv' : 'movie'}`, { params: {
      query,
      page,
      include_adult: includeAdult ? true : false
    }})

    const movies = response.data.results.map(transformMovieData);
    const searchResponse = new SearchResponse(
      movies,
      response.data.total_pages
    )

    return new Success<SearchResponse>(searchResponse);
  } catch (error: any) {
    console.error(`Error search movie with query: ${query}`, error);
    return new Error(`Failed to search movie with query: ${query}`, error.response?.status);
  }
};

export const fetchFavoriteMovies = async (): Promise<Success<Movie[]> | Error> => {
  try {
    const response = await backendClient.get(`/collections/latest_movies`);

    const movies = response.data.data.map((item: any) => {
      const movie = new Movie({
        id: item.id,
        title: item.title,
        posterPath: item.poster_path
      });
      movie.isTvShow = item.is_tv_show;
      if (item.rating) {
        movie.rating = item.rating;
      }
      if (item.rating_count) {
        movie.ratingCount = item.rating_count;
      }
      if (item.notes) {
        movie.collectionNotes = item.notes;
      }
      if (item.last_added_at) {
        movie.collectionAddTime = new Date(item.last_added_at).getTime();
      }
      return movie;
    });

    return new Success<Movie[]>(movies, 'Favorite movies retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching favorite movies:', error);
    return new Error(
      error.response?.data?.message || `Failed to fetch favorite movies.`,
      error.response?.status
    );
  }
};