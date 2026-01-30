import api from './client'; // Import the file you just fixed above
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'; 

const api1 = axios.create({
  baseURL: API_URL,
});

// Auto-add token to every request
api1.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getUserProfile = async () => {
  try {
    // Uses the shared client with the Token logic automatically included
    const response = await api.get('/api/users/me'); 
    return response.data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};