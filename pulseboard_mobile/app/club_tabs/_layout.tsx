import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Clock, User } from 'lucide-react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// --- THEME CONSTANTS ---
const THEME = {
    ACCENT: '#CCF900',      // Volt Yellow
    BG: '#050505',          // Deep Matte Black
    BORDER: 'rgba(255, 255, 255, 0.1)', // Subtle Glass Edge
    INACTIVE: '#52525B',    // Zinc 600
};

export default function ClubTabLayout() {
    const iconSize = hp('3%');

    return (
        <View style={{ flex: 1 }}>
            <Tabs
                screenOptions={{
                    headerShown: false,

                    tabBarStyle: {
                        backgroundColor: THEME.BG,
                        borderTopColor: THEME.BORDER,
                        borderTopWidth: 1,
                        elevation: 0,
                        height: Platform.OS === 'ios' ? hp('11%') : hp('9%'),
                        paddingBottom: Platform.OS === 'ios' ? hp('3.5%') : hp('1.5%'),
                        paddingTop: hp('1%'),
                    },

                    tabBarActiveTintColor: THEME.ACCENT,
                    tabBarInactiveTintColor: THEME.INACTIVE,

                    tabBarLabelStyle: {
                        fontSize: hp('1.2%'),
                        fontWeight: '700',
                        letterSpacing: 1,
                        marginTop: 0,
                    },
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        title: 'HOME',
                        tabBarIcon: ({ color }) => (
                            <View style={{ marginBottom: hp('0.5%') }}>
                                <Home color={color} size={iconSize} strokeWidth={2.5} />
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="posts"
                    options={{
                        title: 'POSTS',
                        tabBarIcon: ({ color }) => (
                            <View style={{ marginBottom: hp('0.5%') }}>
                                <Clock color={color} size={iconSize} strokeWidth={2.5} />
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
        </View>
    );
}

const styles = StyleSheet.create({});
