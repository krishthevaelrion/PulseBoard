import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { Search, Check, Plus } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { toggleFollowClubApi } from '../../src/api/club.api';
import { getUserProfile } from '../../src/api/user.api';
import { LinearGradient } from 'expo-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// --- Theme Constants ---
const THEME = {
  ACCENT: '#CCF900',      // Volt Yellow
  ACCENT_GLOW: 'rgba(204, 249, 0, 0.15)',
  BG: '#050505',          // Deep Black
  CARD_BG: '#09090B',     // Matte Zinc
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
      <View style={{ paddingHorizontal: wp('7%'), paddingTop: hp('3.5%'), paddingBottom: hp('2%') }}>
        <Text
          className="text-neutral-500 font-bold uppercase"
          style={{ fontSize: hp('1.5%'), letterSpacing: 4, marginBottom: hp('0.5%') }}
        >
          Explore
        </Text>
        <Text
          className="text-white font-black tracking-tight"
          style={{ fontSize: hp('4%') }}
        >
          DIRECTORY
        </Text>
      </View>

      {/* 2. GLASSY STATS STRIP */}
      <View style={{ paddingHorizontal: wp('6%'), marginBottom: hp('3%') }}>
        <View
          className="flex-row bg-[#09090B] border border-white/10 rounded-2xl overflow-hidden"
          style={{ height: hp('10%') }}
        >
          {/* Left Side: Total */}
          <View className="flex-1 justify-center border-r border-white/5" style={{ paddingHorizontal: wp('5%') }}>
            <Text
              className="text-neutral-500 font-bold uppercase tracking-wider"
              style={{ fontSize: hp('1.2%'), marginBottom: hp('0.5%') }}
            >
              Total Clubs
            </Text>
            <Text className="text-white font-black" style={{ fontSize: hp('3%') }}>
              {clubs.length}
            </Text>
          </View>

          {/* Right Side: Following */}
          <View className="flex-1 justify-center relative" style={{ paddingHorizontal: wp('5%') }}>
            <LinearGradient
              colors={[THEME.ACCENT_GLOW, 'transparent']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              className="absolute inset-0 opacity-50"
            />
            <Text
              className="text-[#CCF900] font-bold uppercase tracking-wider"
              style={{ fontSize: hp('1.2%'), marginBottom: hp('0.5%') }}
            >
              Following
            </Text>
            <Text className="text-white font-black" style={{ fontSize: hp('3%') }}>
              {followedClubs.length}
            </Text>
          </View>
        </View>
      </View>

      {/* 3. SEARCH BAR */}
      <View style={{ paddingHorizontal: wp('6%'), marginBottom: hp('3%') }}>
        <View
          className="flex-row items-center bg-[#121212] border border-white/10 rounded-xl px-4"
          style={{ height: hp('6%') }}
        >
          <Search color={THEME.ACCENT} size={hp('2.2%')} className="mr-3 opacity-80" />
          <TextInput
            className="flex-1 text-white font-medium"
            style={{ fontSize: hp('1.6%') }}
            placeholder="Search for clubs..."
            placeholderTextColor="#52525B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* 4. NAV STRIP (Horizontal Scroll) */}
      <View style={{ marginBottom: hp('3%') }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: wp('6%') }}
        >
          {categories.map(category => {
            const isActive = activeCategory === category;
            return (
              <TouchableOpacity
                key={category}
                onPress={() => setActiveCategory(category)}
                activeOpacity={0.7}
                style={{ marginRight: wp('3%') }}
              >
                <View
                  className={`rounded-full border ${isActive
                      ? 'bg-[#CCF900] border-[#CCF900]'
                      : 'bg-transparent border border-white/15'
                    }`}
                  style={{ paddingHorizontal: wp('5%'), paddingVertical: hp('1.2%') }}
                >
                  <Text
                    className={`font-bold uppercase tracking-wide ${isActive ? 'text-black' : 'text-neutral-400'
                      }`}
                    style={{ fontSize: hp('1.4%') }}
                  >
                    {category}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 5. CLUBS GRID */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: wp('6%'), paddingBottom: hp('15%') }}
      >
        <View className="flex-row flex-wrap justify-between">
          {displayedClubs.map(club => {
            const isFollowed = followedClubs.includes(club.id);
            const isLoading = loadingId === club.id;

            return (
              <View
                key={club.id}
                style={{ width: wp('42%'), marginBottom: hp('2%') }}
              >
                <View
                  className={`rounded-[20px] border justify-between relative overflow-hidden ${isFollowed
                      ? 'bg-[#0E0E10] border-[#CCF900]/30'
                      : 'bg-[#09090B] border-white/5'
                    }`}
                  style={{ padding: wp('4%'), height: hp('26%') }}
                >
                  {/* Subtle Glow Background for Followed Items */}
                  {isFollowed && (
                    <View className="absolute -top-10 -right-10 w-32 h-32 bg-[#CCF900] opacity-5 blur-3xl rounded-full" />
                  )}

                  <View>
                    <View className="flex-row justify-between items-start" style={{ marginBottom: hp('2%') }}>
                      <Text style={{ fontSize: hp('3.5%') }}>{club.icon}</Text>
                      {isFollowed && (
                        <View className="bg-[#CCF900]/10 p-1 rounded-full">
                          <Check size={hp('1.5%')} color="#CCF900" strokeWidth={4} />
                        </View>
                      )}
                    </View>

                    <Text
                      className="text-white font-extrabold"
                      style={{ fontSize: hp('2%'), lineHeight: hp('2.5%'), marginBottom: hp('1%') }}
                    >
                      {club.name}
                    </Text>
                    <Text
                      className="text-neutral-500 font-medium"
                      style={{ fontSize: hp('1.3%'), lineHeight: hp('1.6%') }}
                      numberOfLines={3}
                    >
                      {club.description}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => toggleFollow(club.id)}
                    disabled={isLoading}
                    activeOpacity={0.8}
                    className={`w-full rounded-lg flex-row items-center justify-center ${isFollowed
                        ? 'bg-white/5 border border-white/10'
                        : 'bg-[#CCF900]'
                      }`}
                    style={{ paddingVertical: hp('1.2%') }}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={isFollowed ? "white" : "black"} />
                    ) : isFollowed ? (
                      <Text
                        className="text-white/60 font-bold uppercase tracking-wider"
                        style={{ fontSize: hp('1.1%') }}
                      >
                        Following
                      </Text>
                    ) : (
                      <>
                        <Plus size={hp('1.4%')} color="black" strokeWidth={4} style={{ marginRight: 4 }} />
                        <Text
                          className="text-black font-bold uppercase tracking-wider"
                          style={{ fontSize: hp('1.1%') }}
                        >
                          Follow
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {displayedClubs.length === 0 && (
          <View className="items-center justify-center opacity-50"
            style={{ marginTop: hp('5%') }}
          >
            <Text style={{ fontSize: hp('6%'), marginBottom: hp('1%'), opacity: 0.5 }}>🔭</Text>
            <Text
              className="text-neutral-500 font-bold"
              style={{ fontSize: hp('1.6%') }}
            >
              No results found.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}