// src/api/auth.api.ts (Example)
import api from "./client";

export const registerUser = async (userData: object) => {
  // Ensure this path matches the backend route defined above
  const response = await api.post("/auth/register", userData); 
  return response.data;
};

export const googleLogin = async (code: string) => {
  const response = await api.post("/auth/google/callback", { code });
  return response.data;
};