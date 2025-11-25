import axios from "axios";
import { getToken } from "./auth";

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_API}/api`,
});

// Automatically inject token before every request
api.interceptors.request.use((config) => {
  const token = getToken(); // from localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
