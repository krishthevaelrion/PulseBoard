import api from "../api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotifications } from "../services/notifications";

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

  if (res.data.token) {
    // 1. Save auth token immediately
    await AsyncStorage.setItem("token", res.data.token);

    // 2. Fetch and register push token safely AFTER navigation resolves
    setTimeout(() => {
      registerForPushNotifications().then((expoPushToken) => {
        if (expoPushToken) {
          api.post(
            "/users/save-push-token",
            { expoPushToken },
            {
              headers: {
                Authorization: `Bearer ${res.data.token}`,
              },
            }
          ).catch((err) => console.log("Background push token error", err));
        }
      });
    }, 2000); // Defer to ensure buttery-smooth navigation transition First
  }

  return res.data;
};

// --- Google Auth Function ---
// Pass the idToken received from native Google Sign-In to the backend.
export const googleLoginUser = async (idToken: string) => {
  const res = await api.post("/auth/google/callback", { id_token: idToken });

  if (res.data.token) {
    await AsyncStorage.setItem("token", res.data.token);

    setTimeout(() => {
      registerForPushNotifications().then((expoPushToken) => {
        if (expoPushToken) {
          api.post(
            "/users/save-push-token",
            { expoPushToken },
            {
              headers: {
                Authorization: `Bearer ${res.data.token}`,
              },
            }
          ).catch((err) => console.log("Background Google push token error", err));
        }
      });
    }, 2000); // Prevent Bridge UI locking
  }

  return res.data;
};
