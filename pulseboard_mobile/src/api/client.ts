import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. ENVIRONMENT & FALLBACK
// IMPORTANT: Replace '192.168.x.x' with your actual computer IP if not using the ENV variable.
// We changed port 3000 -> 5000 to match your server.ts
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000'; 

// 2. CREATE INSTANCE
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 3. INTERCEPTOR: AUTO-ADD TOKEN
// This preserves the logic you wanted: check storage, add header.
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Error retrieving token:", error);
  }
  return config;
});

// 4. INTERCEPTOR: ERROR LOGGING (Optional but recommended so you don't go blind)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(`❌ API Error ${error.response.status} at ${error.config.url}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.log(`❌ Network Error (No Response) at ${API_URL}`);
    } else {
      console.log('❌ Request Error', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;