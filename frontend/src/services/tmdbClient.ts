import axios, { AxiosInstance } from 'axios';
import { FAVMOV_TMDB_API_KEY } from '@env';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_SMALL = 'https://image.tmdb.org/t/p/w500';
export const TMDB_IMAGE_BIG = 'https://image.tmdb.org/t/p/original';

const tmdbApiClient = (headers: Record<string, string> = {}): AxiosInstance => {
  const tmdbApiKeyStr = String.fromCharCode.apply(null, JSON.parse(FAVMOV_TMDB_API_KEY));
  return axios.create({
    baseURL: TMDB_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tmdbApiKeyStr}`,
      ...headers,
    },
  });
};

export default tmdbApiClient;