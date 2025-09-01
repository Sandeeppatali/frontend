// api.js - Updated version with better error handling and debugging
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://backend-vlz6.onrender.com";

// Enhanced debug logging
console.log("Environment:", import.meta.env.MODE);
console.log("VITE_API_URL from env:", import.meta.env.VITE_API_URL);
console.log("Final API_URL being used:", API_URL);
console.log("All env vars:", import.meta.env);

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Increased timeout for slow backends
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Set to true if you need cookies/auth
});

// Alternative fetch function with better error handling
export async function fetchData() {
  try {
    console.log(`Attempting to fetch: ${API_URL}/api/data`);
    
    const response = await fetch(`${API_URL}/api/data`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Add this if your backend requires credentials
      // credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('fetchData error:', error);
    throw error;
  }
}

// Request interceptor with enhanced logging
api.interceptors.request.use(
  (cfg) => {
    const token = localStorage.getItem("token");
    if (token) {
      cfg.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log("Making request to:", cfg.baseURL + (cfg.url || ''));
    console.log("Request config:", {
      method: cfg.method,
      url: cfg.url,
      baseURL: cfg.baseURL,
      headers: cfg.headers,
    });
    
    return cfg;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("Response received:", {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("API Error Details:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
    });

    if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
      console.error('Network error - possible causes:');
      console.error('1. Backend server is down');
      console.error('2. CORS configuration issue');
      console.error('3. Wrong URL or port');
      console.error('4. Firewall blocking request');
    }

    if (error.response?.status === 404) {
      console.error('404 Error - API endpoint not found');
    }

    if (error.response?.status === 500) {
      console.error('500 Error - Internal server error');
    }

    return Promise.reject(error);
  }
);

// Health check function to test backend connectivity
export async function healthCheck() {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return {
      success: response.ok,
      status: response.status,
      url: `${API_URL}/health`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      url: `${API_URL}/health`,
    };
  }
}

export default api;