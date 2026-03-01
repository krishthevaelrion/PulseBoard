import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { registerForPushNotifications } from "../src/services/notifications";
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function RootLayout() {
 useEffect(() => {
  registerForPushNotifications().then((token) => {
    if (token) {
      console.log("Expo Push Token:", token);

   fetch(`${API_URL}/api/push-token`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ token }),
});
    }
  });
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor="#000" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="tabs" />
      </Stack>
    </>
  );
}
