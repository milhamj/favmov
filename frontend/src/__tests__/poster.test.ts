import { postAddMovieToCollection } from '../services/collectionService';
import backendClient from '../services/backendClient';
import { Movie, DEFAULT_MOVIE_POSTER } from '../model/movieModel';
jest.mock('../services/backendClient', () => ({ __esModule: true, default: { post: jest.fn() } }));
test.each([false, true])('normalizes missing poster for TV=%s and renders fallback', async isTv => {
 (backendClient.post as jest.Mock).mockResolvedValue({ data: { success: true, data: {} } });
 const movie = new Movie({ id: 7, title: 'Title' });
 await postAddMovieToCollection('c', movie, isTv);
 expect(backendClient.post).toHaveBeenCalledWith('/collections/c/movies', expect.objectContaining({ poster_path: null }));
 expect(movie.smallPosterUrl()).toBe(DEFAULT_MOVIE_POSTER);
});
