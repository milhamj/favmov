import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from '@env';

const createBackendClient = (token?: string): AxiosInstance => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return axios.create({
    baseURL: API_BASE_URL,
    headers,
  });
};

export default createBackendClient;