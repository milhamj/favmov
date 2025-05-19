import axios from 'axios';
import { Movie } from '../model/movieModel';
import { Success, Error } from '../model/apiResponse';
import tmdbApiClient from '../utils/apiUtil';

const mTmdbApiClient = tmdbApiClient();

const transformMovieData = (data: any, isTvShow?: boolean): Movie => {
  const movie = new Movie(data.id, data.title || data.name, data.poster_path)
  movie.overview = data.overview;
  movie.releaseDate = data.release_date || data.first_air_date;
  movie.rating = data.vote_average.toFixed(2);
  movie.ratingCount = data.vote_count;
  movie.runtime = data.runtime;
  movie.genres = data.genres?.map((genre: any) => genre.name);
  movie.isTvShow = isTvShow || false;
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
    const response = await mTmdbApiClient.get(url);
    const movie = transformMovieData(response.data);
    return new Success<Movie>(movie);
  } catch (error: any) {
    console.error('Error fetching movie details:', error);
    return new Error('Failed to fetch movie details', error.response?.status);
  }
};

export const fetchFavoriteMovies = async (): Promise<Success<Movie[]> | Error> => {
  // Mock data for favorite movies
  // return new Success<Movie[]>([
  //   { id: 7, title: "Favorite Movie 1", posterUrl: "https://m.media-amazon.com/images/I/81SIVdnkUmL.jpg" },
  //   { id: 8, title: "Favorite Movie 2", posterUrl: "https://upload.wikimedia.org/wikipedia/id/0/0d/Avengers_Endgame_poster.jpg" },
  //   { id: 9, title: "Favorite Movie 3", posterUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVVKXRFFc9BNtpnBRWifO2r1-wzFwKfNIGsg&s" },
  // ]);
  return new Error('Your Favorite section is not implemented, yet. Sorry!');
};