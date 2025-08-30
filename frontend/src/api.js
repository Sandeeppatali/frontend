// api.js - PRODUCTION-READY VERSION WITH BETTER ERROR HANDLING
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://backend-vlz6.onrender.com";

// Enhanced debug logging
console.log("🌐 Environment:", import.meta.env.MODE);
console.log("🔧 VITE_API_URL from env:", import.meta.env.VITE_API_URL);
console.log("🎯 Final API_URL being used:", API_URL);
console.log("📋 All env vars:", import.meta.env);

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // Increased timeout for Render.com (can be slow on cold starts)
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // CRITICAL: Set to true for CORS with credentials
});

// 🔥 LOGIN FUNCTION WITH DETAILED ERROR HANDLING
export async function login(email, password) {
  try {
    console.log(`🔐 Attempting login to: ${API_URL}/api/auth/login`);
    console.log(`📧 Email: ${email}`);
    
    const response = await api.post('/api/auth/login', {
      email,
      password,
    });

    console.log('✅ Login successful:', response.data);
    
    // Store token if provided
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      console.log('🔑 Token stored successfully');
    }

    return response.data;
  } catch (error) {
    console.error('❌ Login error details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers,
      }
    });

    // Provide more specific error messages based on error type
    if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
      console.error('🔥 NETWORK ERROR - Possible causes:');
      console.error('1. Backend server is down');
      console.error('2. CORS configuration issue');
      console.error('3. Backend URL is incorrect');
      console.error('4. Internet connection issue');
      throw new Error('Network connection failed. Please check if the backend server is accessible.');
    }
    
    if (error.code === 'ERR_INVALID_URL') {
      throw new Error('Invalid server URL configuration');
    }
    
    if (error.response?.status === 401) {
      throw new Error(error.response?.data?.message || 'Invalid email or password');
    }
    
    if (error.response?.status === 404) {
      throw new Error('Login endpoint not found. Please check the backend configuration.');
    }
    
    if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    if (error.response?.status === 0) {
      throw new Error('Could not connect to server. Please check CORS configuration.');
    }

    // Default error message
    throw new Error(error.response?.data?.message || error.message || 'Login failed');
  }
}

// Alternative fetch function with better error handling
export async function fetchData() {
  try {
    console.log(`📊 Attempting to fetch: ${API_URL}/api/dashboard/stats`);
    
    const response = await fetch(`${API_URL}/api/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include', // CRITICAL: Include credentials for CORS
    });

    console.log(`📊 Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP error! status: ${response.status}, body: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Dashboard data received:', data);
    return data;
  } catch (error) {
    console.error('❌ fetchData error:', error);
    throw error;
  }
}

// Health check function with retry mechanism
export async function healthCheck(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🏥 Health check attempt ${i + 1}/${retries}: ${API_URL}/`);
      
      const response = await fetch(`${API_URL}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      const data = await response.json();
      console.log(`✅ Health check successful on attempt ${i + 1}:`, data);
      
      return {
        success: response.ok,
        status: response.status,
        url: `${API_URL}/`,
        data: data,
        attempt: i + 1,
      };
    } catch (error) {
      console.error(`❌ Health check attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        // Last attempt failed
        return {
          success: false,
          error: error.message,
          url: `${API_URL}/`,
          attempts: retries,
        };
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      console.log(`⏳ Waiting ${delay}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Request interceptor with enhanced logging
api.interceptors.request.use(
  (cfg) => {
    const token = localStorage.getItem("token");
    if (token) {
      cfg.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log("📤 Making request:", {
      method: cfg.method?.toUpperCase(),
      url: cfg.baseURL + (cfg.url || ''),
      headers: {
        ...cfg.headers,
        Authorization: cfg.headers.Authorization ? '[REDACTED]' : undefined
      }
    });
    
    return cfg;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("✅ Response received:", {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("❌ API Response Error:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
    });

    // Special error handling
    if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
      console.error('🔥 NETWORK ERROR TROUBLESHOOTING:');
      console.error('1. Check if backend is running');
      console.error('2. Verify CORS configuration');
      console.error('3. Check browser console for CORS errors');
      console.error('4. Verify API URL is correct');
    }

    if (error.response?.status === 404) {
      console.error('❌ 404 Error - API endpoint not found');
    }

    if (error.response?.status === 500) {
      console.error('❌ 500 Error - Internal server error');
    }

    return Promise.reject(error);
  }
);

export default api;