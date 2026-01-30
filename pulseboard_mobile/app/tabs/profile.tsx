import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import { Settings, Bell, Heart, Calendar, Trophy, Users, LogOut, ChevronRight, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import UserAvatar from 'react-native-user-avatar';
import { getUserProfile } from '../../src/api/user.api';

//  Theme
const THEME_ACCENT = '#CCF900'; 
const THEME_BLACK = '#050505';
const THEME_CARD = '#121212';
const THEME_TEXT_SEC = '#737373';

interface UserData {
  _id: string;
  name: string;
  email: string;
  avatar: string;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await getUserProfile();
        setUser(userData);
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 404) {
          Alert.alert("Session Expired", "Please login again.");
          await AsyncStorage.removeItem('token');
          router.replace('/login');
        } else {
          Alert.alert('Error', 'Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogout = () => {
    router.replace('/');
  };

  const stats = [
    { label: 'Events', value: '24', icon: Calendar },
    { label: 'Clubs', value: '5', icon: Users },
    { label: 'Awards', value: '12', icon: Trophy },
  ];

  const upcomingEvents = [
    { title: 'AI Workshop', date: 'Jan 25', club: 'ACM Chapter', time: '5:00 PM' },
    { title: 'Drama Auditions', date: 'Jan 27', club: 'Dramatics', time: '6:30 PM' },
    { title: 'Basketball Finals', date: 'Jan 30', club: 'Sports', time: '4:00 PM' },
  ];

  const MenuItem = ({ icon: Icon, title, onPress, showBadge = false, isDestructive = false }) => (
    <TouchableOpacity 
      className="flex-row items-center justify-between py-4 px-5 bg-[#121212] border border-neutral-900 rounded-2xl mb-3"
      onPress={onPress}
    >
      <View className="flex-row items-center flex-1">
        <View className={`p-2 rounded-full ${isDestructive ? 'bg-red-500/10' : 'bg-[#CCF900]/10'}`}>
           <Icon color={isDestructive ? '#ef4444' : THEME_ACCENT} size={20} strokeWidth={2.5} />
        </View>
        <Text className={`text-base ml-4 font-bold ${isDestructive ? 'text-red-500' : 'text-white'}`}>
            {title}
        </Text>
      </View>
      {showBadge && (
        <View className="bg-[#CCF900] rounded-full w-6 h-6 items-center justify-center mr-2">
          <Text className="text-black text-[10px] font-black">3</Text>
        </View>
      )}
      {!isDestructive && <ChevronRight color="#333" size={20} />}
    </TouchableOpacity>
  );

  const displayName = user?.name || "Guest User";
  const displayEmail = user?.email || "guest@example.com";
  const avatarSeed = user?._id || user?.email || "default-seed";
  const displayAvatar = `https://api.dicebear.com/9.x/bottts/png?seed=${avatarSeed}`;

  return (
    <SafeAreaView className="flex-1 bg-[#050505]">
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-start">
        <View>
          <Text className="text-neutral-500 font-bold text-xs tracking-[3px] uppercase mb-1">
            Dashboard
          </Text>
          <Text className="text-white text-3xl font-black tracking-tight">
            PROFILE.
          </Text>
        </View>
        <TouchableOpacity className="bg-[#1A1A1A] p-3 rounded-full border border-neutral-800">
          <Settings color={THEME_ACCENT} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        
        {/* Main Profile Card */}
        <View className="bg-[#121212] border border-neutral-800 rounded-[32px] p-6 mb-6 items-center relative overflow-hidden">
            {/* Background Decoration */}
            <View className="absolute top-0 right-0 w-32 h-32 bg-[#CCF900]/5 rounded-bl-[100px]" />

            <View className="mb-4 p-1 border-2 border-[#CCF900] rounded-full border-dashed">
               <UserAvatar 
                 size={100} 
                 name={displayName} 
                 src={displayAvatar} 
                 bgColor="#050505"
               />
            </View>

            <Text className="text-white text-2xl font-black tracking-tight mb-1">{displayName}</Text>
            <Text className="text-neutral-500 text-sm font-medium tracking-wide mb-4">{displayEmail}</Text>
            
            <View className="flex-row items-center bg-[#CCF900]/10 px-4 py-1.5 rounded-full border border-[#CCF900]/20">
              <View className="w-1.5 h-1.5 bg-[#CCF900] rounded-full mr-2" />
              <Text className="text-[#CCF900] text-[10px] font-black uppercase tracking-widest">Active Member</Text>
            </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row justify-between mb-8">
            {stats.map((stat, idx) => (
                <View key={idx} className="w-[31%] bg-[#121212] border border-neutral-900 rounded-2xl p-3 items-center">
                    <Text className="text-[#CCF900] text-xl font-black mb-1">{stat.value}</Text>
                    <Text className="text-neutral-600 text-[10px] font-bold uppercase tracking-wider">{stat.label}</Text>
                </View>
            ))}
        </View>

        {/* Quick Actions */}
        <Text className="text-white text-lg font-black mb-4">ACTIONS</Text>
        <MenuItem icon={Bell} title="Notifications" showBadge={true} onPress={() => {}} />
        <MenuItem icon={Heart} title="Saved Events" onPress={() => {}} />
        <MenuItem icon={Calendar} title="My Calendar" onPress={() => {}} />

        {/* Upcoming Events Mini-List */}
        <View className="flex-row justify-between items-end mb-4 mt-6">
            <Text className="text-white text-lg font-black">UPCOMING</Text>
            <TouchableOpacity>
                <Text className="text-[#CCF900] text-xs font-bold uppercase">View All</Text>
            </TouchableOpacity>
        </View>
        
        {upcomingEvents.map((event, idx) => (
          <View key={idx} className="bg-[#121212] border border-neutral-900 rounded-2xl p-4 mb-3 flex-row items-center">
             <View className="bg-[#1A1A1A] w-12 h-12 rounded-xl items-center justify-center mr-4">
                <Text className="text-[#CCF900] font-black text-xs">{event.date.split(' ')[0]}</Text>
                <Text className="text-white font-bold text-sm">{event.date.split(' ')[1]}</Text>
             </View>
             <View className="flex-1">
                <Text className="text-white font-bold text-base">{event.title}</Text>
                <Text className="text-neutral-500 text-xs">{event.club} • {event.time}</Text>
             </View>
             <ChevronRight color="#333" size={16} />
          </View>
        ))}

        {/* Logout */}
        <View className="mt-6 mb-10">
            <MenuItem icon={LogOut} title="Logout" isDestructive={true} onPress={handleLogout} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}