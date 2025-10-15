import axios from 'axios';
import {useAuth} from './store.js';

const baseUrl = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const {accessToken} = useAuth.getState();

    if (accessToken.length !== 0)
      config.headers.Authorization = `Bearer ${accessToken}`;

    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshRes = await axios.post('/refresh', {}, {withCredentials: true});
        const newAccessToken = refreshRes.data.accessToken;

        const {authSuccess} = useAuth.getState();
        authSuccess(newAccessToken);

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        return api(originalRequest);

      } catch(err) {
        const {authFail} = useAuth.getState();
        authFail();
        console.error("Refresh failed, logging user out");
        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  }
)

export default api;