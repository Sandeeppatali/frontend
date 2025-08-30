import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://backend-vlz6.onrender.com";

// Debug logging - remove this after testing
console.log("Environment:", import.meta.env.NODE_ENV);
console.log("VITE_API_URL from env:", import.meta.env.VITE_API_URL);
console.log("Final API_URL being used:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
});

export async function fetchData() {
  const response = await fetch(`${API_URL}/api/data`);
  return response.json();
}

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  
  // Debug logging - remove after testing
  console.log("Making request to:", cfg.baseURL + cfg.url);
  
  return cfg;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.message);
    if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
      console.error('Network error - backend may be down or CORS issue');
    }
    return Promise.reject(error);
  }
);

export default api;