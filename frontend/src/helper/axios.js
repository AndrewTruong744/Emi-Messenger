import axios from 'axios';

const baseUrl = import.meta.env.VITE_API_URL;
let isRefreshing = null;

const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const accessToken = sessionStorage.getItem("accessToken");

    if (accessToken)
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

      if (!isRefreshing) {
        isRefreshing = api.post('/auth/refresh', {});
      }

      try {
        const refreshRes = await isRefreshing;
        const newAccessToken = refreshRes.data.accessToken;

        isRefreshing = null;

        sessionStorage.setItem("accessToken", newAccessToken);
        
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        
        return api(originalRequest);
      } catch(err) {
        sessionStorage.removeItem("accessToken");
        console.error("Refresh failed, logging user out");

        isRefreshing = null;

        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  }
)

export default api;