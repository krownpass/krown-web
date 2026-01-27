import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {  setToken, clearToken, getToken } from "./auth";

const api = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_BACKEND_API}/api`,
    withCredentials: true, // Needed for cookies
});

// Automatically inject token before every request
api.interceptors.request.use((config) => {
  const token = getToken(); // from localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 and refresh token
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const res = await axios.post(
                    `${process.env.NEXT_PUBLIC_BACKEND_API}/api/cafes/refresh-token`,
                    {},
                    { withCredentials: true }
                );

                const { token } = res.data?.data || res.data;
                if (!token) throw new Error("No access token returned");
                setToken(token);
                originalRequest.headers.Authorization = `Bearer ${token}`;

                return api(originalRequest);

            } catch (refreshError) {
                clearToken();
                if (typeof window !== "undefined") {
                    window.location.href = "/login";
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
