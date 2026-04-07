import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotifications } from "../src/services/notifications";
import api from "../src/api/client";
import { ThemeProvider } from "../src/context/ThemeContext";

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotifications().then(async (pushToken) => {
      if (!pushToken) return;
      // Always store locally so login screen can send it after auth
      await AsyncStorage.setItem("expoPushToken", pushToken);
      // Also try immediately — works for returning users already logged in
      api.post("/users/save-push-token", { expoPushToken: pushToken }).catch(() => {});
    });
  }, []);

  return (
    <ThemeProvider>
       <StatusBar style="light" />
       <Stack screenOptions={{ headerShown: false }}>
         <Stack.Screen name="index" />
         <Stack.Screen name="auth" />
         <Stack.Screen name="tabs" />
         <Stack.Screen name="calendar" />
       </Stack>
    </ThemeProvider>
  );
}
