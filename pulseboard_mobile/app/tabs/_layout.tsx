import React from 'react';
import { Platform, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Users, User } from 'lucide-react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// --- THEME CONSTANTS ---
const THEME = {
  ACCENT: '#CCF900',      // Volt Yellow
  BG: '#050505',          // Deep Matte Black
  BORDER: 'rgba(255, 255, 255, 0.1)', // Subtle Glass Edge
  INACTIVE: '#52525B',    // Zinc 600
};

export default function TabLayout() {
  // Dynamic scaling for icons
  const iconSize = hp('3%'); 

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        
        // --- TAB BAR STYLING ---
        tabBarStyle: {
          backgroundColor: THEME.BG,
          borderTopColor: THEME.BORDER,
          borderTopWidth: 1,
          elevation: 0, // Remove Android shadow
          
          // RESPONSIVE HEIGHT FIX:
          // Android: 8% of screen height (approx 65-70px on most phones)
          // iOS: 11% of screen height (to account for the home indicator line)
          height: Platform.OS === 'ios' ? hp('11%') : hp('9%'), 

          // RESPONSIVE PADDING FIX:
          // Ensure there is space at the bottom so text isn't cut off
          paddingBottom: Platform.OS === 'ios' ? hp('3.5%') : hp('1.5%'),
          paddingTop: hp('1%'),
        },
        
        // --- TEXT STYLING ---
        tabBarActiveTintColor: THEME.ACCENT,
        tabBarInactiveTintColor: THEME.INACTIVE,
        
        tabBarLabelStyle: {
          fontSize: hp('1.2%'), // Responsive font size
          fontWeight: '700',
          letterSpacing: 1,
          
          // CRITICAL FIX:
          // Removed "marginTop: -4". 
          // Instead, we let Flexbox handle the spacing naturally.
          // If you want them closer, use a very small negative margin like -2, 
          // but usually, default spacing is safer.
          marginTop: 0, 
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color }) => (
            // Added marginBottom to give the icon some breathing room from the text
            <View style={{ marginBottom: hp('0.5%') }}>
              <Home color={color} size={iconSize} strokeWidth={2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="clubs"
        options={{
          title: 'CLUBS',
          tabBarIcon: ({ color }) => (
            <View style={{ marginBottom: hp('0.5%') }}>
              <Users color={color} size={iconSize} strokeWidth={2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ color }) => (
            <View style={{ marginBottom: hp('0.5%') }}>
              <User color={color} size={iconSize} strokeWidth={2.5} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}