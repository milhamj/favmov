import axios from 'axios';
import { env } from './env';
import { supabase } from './supabaseClient';

const axiosInstance = axios.create({
  baseURL: env.apiUrl,
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
  } catch {
    return config;
  }

  return config;
});

export default axiosInstance;
