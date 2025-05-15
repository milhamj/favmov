import { Movie } from '../model/movieModel';

export const fetchTrendingMovies = async (): Promise<Movie[]> => {
  // Mock data for trending movies
  return [
    { id: 1, title: "Trending Movie 1", posterUrl: "https://static.wikia.nocookie.net/marvelmovies/images/8/8f/2012_Avengers_Poster.jpg/revision/latest?cb=20221014191345" },
    { id: 2, title: "Trending Movie 2", posterUrl: "https://upload.wikimedia.org/wikipedia/id/0/0d/Avengers_Endgame_poster.jpg" },
    { id: 3, title: "Trending Movie 3", posterUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVVKXRFFc9BNtpnBRWifO2r1-wzFwKfNIGsg&s" },
  ];
};

export const fetchPopularMovies = async (): Promise<Movie[]> => {
  // Mock data for popular movies
  return [
    { id: 4, title: "Popular Movie 1", posterUrl: "https://static.wikia.nocookie.net/marvelmovies/images/8/8f/2012_Avengers_Poster.jpg/revision/latest?cb=20221014191345" },
    { id: 5, title: "Popular Movie 2", posterUrl: "https://upload.wikimedia.org/wikipedia/id/0/0d/Avengers_Endgame_poster.jpg" },
    { id: 6, title: "Popular Movie 3", posterUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVVKXRFFc9BNtpnBRWifO2r1-wzFwKfNIGsg&s" },
  ];
};

export const fetchFavoriteMovies = async (): Promise<Movie[]> => {
  // Mock data for favorite movies
  return [
    { id: 7, title: "Favorite Movie 1", posterUrl: "https://static.wikia.nocookie.net/marvelmovies/images/8/8f/2012_Avengers_Poster.jpg/revision/latest?cb=20221014191345" },
    { id: 8, title: "Favorite Movie 2", posterUrl: "https://upload.wikimedia.org/wikipedia/id/0/0d/Avengers_Endgame_poster.jpg" },
    { id: 9, title: "Favorite Movie 3", posterUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVVKXRFFc9BNtpnBRWifO2r1-wzFwKfNIGsg&s" },
  ];
};