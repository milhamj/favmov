import axios, { AxiosInstance } from 'axios';
import { TMDB_API_KEY } from '@env';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const tmdbApiClient = (headers: Record<string, string> = {}): AxiosInstance => {
  return axios.create({
    baseURL: TMDB_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TMDB_API_KEY}`,
      ...headers,
    },
  });
};

export default tmdbApiClient;