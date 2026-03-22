import api from "./client";

export const registerUser = async (userData: object) => {
  const response = await api.post("/auth/register", userData); 
  return response.data;
};

export const verifyOtp = async (data: { email: string; otp: string }) => {
  const response = await api.post("/auth/verify-otp", data);
  return response.data;
};

export const resendOtp = async (data: { email: string }) => {
  const response = await api.post("/auth/resend-otp", data);
  return response.data;
};

export const googleLogin = async (code: string) => {
  const response = await api.post("/auth/google/callback", { code });
  return response.data;
};

export const sendForgotPasswordOtp = async (data: { email: string }) => {
  const response = await api.post("/auth/forgot-password", data);
  return response.data;
};

export const verifyPasswordResetOtp = async (data: { email: string; otp: string }) => {
  const response = await api.post("/auth/verify-reset-otp", data);
  return response.data;
};

export const resetPassword = async (data: { email: string; otp: string; newPassword: string }) => {
  const response = await api.post("/auth/reset-password", data);
  return response.data;
};