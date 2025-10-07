import axios, { AxiosInstance } from 'axios';
import { FAVMOV_API_BASE_URL_PROD } from '@env';
import { supabase } from './supabaseClient';

const axiosInstance = axios.create({
  baseURL: FAVMOV_API_BASE_URL_PROD,
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