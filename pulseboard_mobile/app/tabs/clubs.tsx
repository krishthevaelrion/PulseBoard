import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView, 
  StatusBar, 
  Alert, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { Search, Check, Plus } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router'; // Ensures real-time updates
import { toggleFollowClubApi } from '../../src/api/club.api'; 
import { getUserProfile } from '../../src/api/user.api';
import { LinearGradient } from 'expo-linear-gradient'; // Ensure you have this installed: npx expo install expo-linear-gradient

// --- Theme Constants ---
const THEME = {
  ACCENT: '#CCF900',      // Volt Yellow
  ACCENT_GLOW: 'rgba(204, 249, 0, 0.15)',
  BG: '#050505',          // Deep Black
  CARD_BG: '#09090B',     // Matte Zinc
  GLASS_BORDER: 'rgba(255,255,255,0.1)',
  TEXT_SEC: '#A1A1AA',
};

export default function ClubsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [followedClubs, setFollowedClubs] = useState<number[]>([]); 
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // DATA: Manual IDs 1-15
  const clubs = [
    { id: 1, name: 'Quant Club', icon: '📈', category: 'Technical', description: 'Algorithmic Trading & Finance' },
    { id: 2, name: 'Devlup Labs', icon: '💻', category: 'Technical', description: 'Open Source Development' },
    { id: 3, name: 'RAID', icon: '🤖', category: 'Technical', description: 'AI & Deep Learning' },
    { id: 4, name: 'Inside', icon: '👾', category: 'Technical', description: 'Game Development Society' },
    { id: 5, name: 'Product Club', icon: '📱', category: 'Technical', description: 'Product Design & Mgmt' },
    { id: 6, name: 'PSOC', icon: '⌨️', category: 'Technical', description: 'Competitive Programming' },
    { id: 7, name: 'TGT', icon: '🎸', category: 'Cultural', description: 'The Groove Theory (Music)' },
    { id: 8, name: 'Shutterbugs', icon: '📸', category: 'Cultural', description: 'Photography Society' },
    { id: 9, name: 'Ateliers', icon: '🎨', category: 'Cultural', description: 'Fine Arts & Crafts' },
    { id: 10, name: 'FrameX', icon: '🎬', category: 'Cultural', description: 'Filmmaking & Editing' },
    { id: 11, name: 'Designerds', icon: '📐', category: 'Cultural', description: 'UI/UX & Graphic Design' },
    { id: 12, name: 'Dramebaaz', icon: '🎭', category: 'Cultural', description: 'Drama & Theatrics' },
    { id: 13, name: 'E-Cell', icon: '💼', category: 'Other', description: 'Entrepreneurship Cell' },
    { id: 14, name: 'Nexus', icon: '💡', category: 'Other', description: 'Innovation & Ideas' },
    { id: 15, name: 'Respawn', icon: '🎮', category: 'Other', description: 'eSports & Gaming' },
  ];

  const categories = ['all', 'Technical', 'Cultural', 'Other'];

  // --- Real-Time Sync Logic ---
  useFocusEffect(
    useCallback(() => {
      fetchUserFollowing();
    }, [])
  );

  const fetchUserFollowing = async () => {
    try {
      const res: any = await getUserProfile();
      const list = res.following || res.data?.following || [];
      setFollowedClubs(list);
    } catch (err) {
      console.error("Profile Sync Error:", err);
    }
  };

  const toggleFollow = async (clubId: number) => {
    setLoadingId(clubId);
    try {
      const res: any = await toggleFollowClubApi(clubId);
      const updatedList = res.following || res.data?.following || [];
      setFollowedClubs(updatedList);
    } catch (err) {
      Alert.alert("Connection Error", "Could not update follow status.");
    } finally {
      setLoadingId(null);
    }
  };

  const filterClubs = () => {
    let filtered = clubs;
    if (activeCategory !== 'all') {
      filtered = filtered.filter(club => club.category === activeCategory);
    }
    if (searchQuery) {
      filtered = filtered.filter(club => 
        club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  const displayedClubs = filterClubs();

  return (
    <SafeAreaView className="flex-1 bg-[#050505]">
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      
      {/* 1. HEADER */}
      <View className="px-6 pt-2 pb-4">
        <Text className="text-neutral-500 font-bold text-xs tracking-[4px] uppercase mb-1">
          Explore
        </Text>
        <Text className="text-white text-3xl font-black tracking-tight">
          DIRECTORY.
        </Text>
      </View>

      {/* 2. GLASSY STATS STRIP (Combined Layout) */}
      <View className="px-6 mb-6">
        <View className="flex-row bg-[#09090B] border border-white/10 rounded-2xl overflow-hidden h-20">
            {/* Left Side: Total */}
            <View className="flex-1 justify-center px-5 border-r border-white/5">
                <Text className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Clubs</Text>
                <Text className="text-white text-2xl font-black">{clubs.length}</Text>
            </View>
            {/* Right Side: Following */}
            <View className="flex-1 justify-center px-5 relative">
                <LinearGradient
                    colors={[THEME.ACCENT_GLOW, 'transparent']}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    className="absolute inset-0 opacity-50"
                />
                <Text className="text-[#CCF900] text-[10px] font-bold uppercase tracking-wider mb-1">Following</Text>
                <Text className="text-white text-2xl font-black">{followedClubs.length}</Text>
            </View>
        </View>
      </View>

      {/* 3. MODERN SEARCH BAR (No Filter Icon) */}
      <View className="px-6 mb-6">
        <View className="flex-row items-center bg-[#121212] border border-white/10 rounded-xl px-4 h-12">
          <Search color={THEME.ACCENT} size={18} className="mr-3 opacity-80" />
          <TextInput
            className="flex-1 text-white text-sm font-medium"
            placeholder="Search for clubs..."
            placeholderTextColor="#52525B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* 4. NAV STRIP (Horizontal Scroll) */}
      <View className="mb-6">
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingHorizontal: 24 }}
        >
          {categories.map(category => {
            const isActive = activeCategory === category;
            return (
              <TouchableOpacity
                key={category}
                onPress={() => setActiveCategory(category)}
                activeOpacity={0.7}
                className="mr-3"
              >
                <View 
                    className={`px-5 py-2.5 rounded-full border ${
                        isActive 
                        ? 'bg-[#CCF900] border-[#CCF900]' 
                        : 'bg-transparent border border-white/15'
                    }`}
                >
                    <Text className={`text-xs font-bold uppercase tracking-wide ${
                        isActive ? 'text-black' : 'text-neutral-400'
                    }`}>
                        {category}
                    </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 5. CLUBS GRID */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap justify-between pb-32">
          {displayedClubs.map(club => {
            const isFollowed = followedClubs.includes(club.id);
            const isLoading = loadingId === club.id;

            return (
              <View 
                key={club.id} 
                className="w-[48%] mb-4"
              >
                <View 
                    className={`p-5 rounded-[20px] border h-[220px] justify-between relative overflow-hidden ${
                        isFollowed 
                        ? 'bg-[#0E0E10] border-[#CCF900]/30' 
                        : 'bg-[#09090B] border-white/5'
                    }`}
                >
                    {/* Subtle Glow Background for Followed Items */}
                    {isFollowed && (
                        <View className="absolute -top-10 -right-10 w-32 h-32 bg-[#CCF900] opacity-5 blur-3xl rounded-full" />
                    )}

                    <View>
                        <View className="flex-row justify-between items-start mb-4">
                            <Text className="text-3xl">{club.icon}</Text>
                            {isFollowed && (
                                <View className="bg-[#CCF900]/10 p-1.5 rounded-full">
                                    <Check size={10} color="#CCF900" strokeWidth={4} />
                                </View>
                            )}
                        </View>
                        
                        <Text className="text-white text-base font-extrabold leading-5 mb-2">
                            {club.name}
                        </Text>
                        <Text className="text-neutral-500 text-[10px] leading-3 font-medium" numberOfLines={3}>
                            {club.description}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => toggleFollow(club.id)}
                        disabled={isLoading}
                        activeOpacity={0.8}
                        className={`w-full py-2.5 rounded-lg flex-row items-center justify-center ${
                            isFollowed 
                            ? 'bg-white/5 border border-white/10' 
                            : 'bg-[#CCF900]'
                        }`}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color={isFollowed ? "white" : "black"} />
                        ) : isFollowed ? (
                            <Text className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Following</Text>
                        ) : (
                            <>
                                <Plus size={12} color="black" strokeWidth={4} style={{ marginRight: 4 }} />
                                <Text className="text-black text-[10px] font-bold uppercase tracking-wider">Follow</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {displayedClubs.length === 0 && (
          <View className="items-center justify-center py-20 opacity-50">
            <Text className="text-5xl mb-4 grayscale">🔭</Text>
            <Text className="text-neutral-500 text-sm font-bold">No results found.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}