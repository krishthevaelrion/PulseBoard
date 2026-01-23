import api from "../api/client";
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Register Types ---
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
}

// --- Login Types ---
export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  message: string;
}

// --- Register Function ---
export const registerUser = async (
  data: RegisterPayload
): Promise<RegisterResponse> => {
  const res = await api.post<RegisterResponse>("/auth/register", data);
  return res.data;
};

// --- Login Function ---
export const loginUser = async (
  data: LoginPayload
): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>("/auth/login", data);
  
  // Store the token automatically upon successful login
  if (res.data.token) {
    await AsyncStorage.setItem("token", res.data.token);
  }
  
  return res.data;
};

// --- Google Auth Function ---
export const googleLoginUser = async (code: string) => {
  const res = await api.post("/auth/google/callback", { code });
  if (res.data.token) {
    await AsyncStorage.setItem("token", res.data.token);
  }
  return res.data;
};