import { postAddMovieToCollection } from '@/features/collections/collectionService';
import backendClient from '@/lib/backendClient';
import { DEFAULT_MOVIE_POSTER, smallPosterUrl } from '@/features/movies/movieModel';
import { movie as makeMovie } from '../../test/factories';
jest.mock('@/lib/backendClient', () => ({ __esModule: true, default: { post: jest.fn() } }));
test.each([false, true])(
  'normalizes missing poster for TV=%s and renders fallback',
  async (isTv) => {
    (backendClient.post as jest.Mock).mockResolvedValue({ data: { success: true, data: {} } });
    const movie = makeMovie({ id: 7, title: 'Title' });
    await postAddMovieToCollection('c', movie, isTv);
    expect(backendClient.post).toHaveBeenCalledWith(
      '/collections/c/movies',
      expect.objectContaining({ poster_path: null }),
    );
    expect(smallPosterUrl(movie)).toBe(DEFAULT_MOVIE_POSTER);
  },
);
