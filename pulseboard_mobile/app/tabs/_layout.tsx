import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Users, User } from 'lucide-react-native';

// --- THEME CONSTANTS ---
const THEME = {
  ACCENT: '#CCF900',      // Volt Yellow
  BG: '#09090B',          // Deep Matte Black
  BORDER: 'rgba(255, 255, 255, 0.1)', // Subtle Glass Edge
  INACTIVE: '#52525B',    // Zinc 600
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        
        // --- TAB BAR STYLING ---
        tabBarStyle: {
          backgroundColor: THEME.BG,
          borderTopColor: THEME.BORDER,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 60, // Taller on iOS for home indicator
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          elevation: 0, // Remove Android shadow for a flat, clean look
        },
        
        // --- TEXT STYLING ---
        tabBarActiveTintColor: THEME.ACCENT,
        tabBarInactiveTintColor: THEME.INACTIVE,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1,
          marginTop: -4, // Pull text slightly closer to icon
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={24} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="clubs"
        options={{
          title: 'CLUBS',
          tabBarIcon: ({ color, size }) => (
            <Users color={color} size={24} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={24} strokeWidth={2.5} />
          ),
        }}
      />
    </Tabs>
  );
}