import axios, { 
  type InternalAxiosRequestConfig, 
  type AxiosResponse, 
} from 'axios';
import { useBoundStore } from "../store/useBoundStore";

const baseUrl = import.meta.env.VITE_API_URL;
let isRefreshing : Promise<AxiosResponse> | null = null;

const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config : InternalAxiosRequestConfig) => {
    const accessToken = useBoundStore.getState().accessToken;

    if (accessToken)
      config.headers.Authorization = `Bearer ${accessToken}`;

    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

api.interceptors.response.use(
  (res : AxiosResponse) => res,
  async (err) => {
    const originalRequest = err.config;

    // prevents a refresh call from awaiting another refresh call
    if (originalRequest.url === '/auth/refresh') {
      isRefreshing = null;
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = api.post('/auth/refresh', {});
      }

      try {
        const refreshRes = await isRefreshing;
        const newAccessToken = refreshRes.data.accessToken;

        isRefreshing = null;

        useBoundStore.getState().setAccessToken(newAccessToken);
        
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        
        return api(originalRequest);
      } catch(err) {
        useBoundStore.getState().setAccessToken(null);
        console.error("Refresh failed, logging user out");

        isRefreshing = null;

        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  }
)

export default api;