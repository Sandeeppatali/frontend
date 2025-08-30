import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://backend-vlz6.onrender.com",
});

export async function fetchData() {
  const API_URL = import.meta.env.VITE_API_URL || "https://backend-vlz6.onrender.com";
  const response = await fetch(`${API_URL}/api/data`);
  return response.json();
}

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;