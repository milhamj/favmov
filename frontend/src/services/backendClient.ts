import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from '@env';
import { supabase } from './supabaseClient';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.error('Error getting auth token for request:', error);
  }
  
  return config;
});

export default axiosInstance;