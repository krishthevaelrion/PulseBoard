import React, { useState, useCallback, useEffect } from 'react';
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
import { useFocusEffect, router } from 'expo-router';
import { toggleFollowClubApi, getAllClubs } from '../../src/api/club.api';
import { getUserProfile } from '../../src/api/user.api';
import { LinearGradient } from 'expo-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
// import clubId from '../../src/components/ClubCard'
const THEME = {
  ACCENT: '#CCF900',
  ACCENT_GLOW: 'rgba(204, 249, 0, 0.15)',
  BG: '#050505',
  CARD_BG: '#09090B',
};

const iconMap: Record<number, string> = {
  1: '📈', 2: '💻', 3: '🤖', 4: '👾', 5: '📱',
  6: '⌨️', 7: '🎸', 8: '📸', 9: '🎨', 10: '🎬',
  11: '📐', 12: '🎭', 13: '💼', 14: '💡', 15: '🎮',
};

export default function ClubsScreen() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [followedClubs, setFollowedClubs] = useState<number[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // FETCH CLUBS FROM DB
  useEffect(() => {
    const fetch = async () => {
      try {
        console.log("fetching clubs...");
        const data = await getAllClubs();
         console.log("data received:",data);
        const mapped = data.map((club: any) => ({
          id: club.clubId,
          _id: club._id,
          name: club.name,
          category: club.category,
          description: club.description,
          icon: iconMap[club.clubId] || '🔥',
        }));

        setClubs(mapped);
      } catch (e) {
        console.log('Club fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // FOLLOW SYNC
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
    } catch {
      Alert.alert("Connection Error", "Could not update follow status.");
    } finally {
      setLoadingId(null);
    }
  };

  const categories = ['all', ...new Set(clubs.map(c => c.category))];

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

  if (loading) {
    return (
      <View className="flex-1 bg-[#050505] items-center justify-center">
        <ActivityIndicator size="large" color="#CCF900" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#050505]">
      <StatusBar barStyle="light-content" backgroundColor="#050505" />

      {/* HEADER */}
      <View style={{ paddingHorizontal: wp('7%'), paddingTop: hp('3.5%'), paddingBottom: hp('2%') }}>
        <Text className="text-neutral-500 font-bold uppercase"
          style={{ fontSize: hp('1.5%'), letterSpacing: 4, marginBottom: hp('0.5%') }}>
          Explore
        </Text>
        <Text className="text-white font-black tracking-tight"
          style={{ fontSize: hp('4%') }}>
          DIRECTORY
        </Text>
      </View>

      {/* STATS STRIP */}
      <View style={{ paddingHorizontal: wp('6%'), marginBottom: hp('3%') }}>
        <View className="flex-row bg-[#09090B] border border-white/10 rounded-2xl overflow-hidden"
          style={{ height: hp('10%') }}>

          <View className="flex-1 justify-center border-r border-white/5"
            style={{ paddingHorizontal: wp('5%') }}>
            <Text className="text-neutral-500 font-bold uppercase tracking-wider"
              style={{ fontSize: hp('1.2%'), marginBottom: hp('0.5%') }}>
              Total Clubs
            </Text>
            <Text className="text-white font-black"
              style={{ fontSize: hp('3%') }}>
              {clubs.length}
            </Text>
          </View>

          <View className="flex-1 justify-center relative"
            style={{ paddingHorizontal: wp('5%') }}>
            <LinearGradient
              colors={[THEME.ACCENT_GLOW, 'transparent']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              className="absolute inset-0 opacity-50"
            />
            <Text className="text-[#CCF900] font-bold uppercase tracking-wider"
              style={{ fontSize: hp('1.2%'), marginBottom: hp('0.5%') }}>
              Following
            </Text>
            <Text className="text-white font-black"
              style={{ fontSize: hp('3%') }}>
              {followedClubs.length}
            </Text>
          </View>
        </View>
      </View>

      {/* SEARCH BAR */}
      <View style={{ paddingHorizontal: wp('6%'), marginBottom: hp('3%') }}>
        <View className="flex-row items-center bg-[#121212] border border-white/10 rounded-xl px-4"
          style={{ height: hp('6%') }}>
          <Search color={THEME.ACCENT} size={hp('2.2%')} />
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

      {/* CATEGORY STRIP */}
      <View style={{ marginBottom: hp('3%') }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: wp('6%') }}>
          {categories.map(category => {
            const isActive = activeCategory === category;
            return (
              <TouchableOpacity key={category}
                onPress={() => setActiveCategory(category)}
                style={{ marginRight: wp('3%') }}>
                <View className={`rounded-full border ${
                    isActive ? 'bg-[#CCF900] border-[#CCF900]' : 'border-white/15'
                  }`}
                  style={{ paddingHorizontal: wp('5%'), paddingVertical: hp('1.2%') }}>
                  <Text className={`font-bold uppercase ${
                      isActive ? 'text-black' : 'text-neutral-400'
                    }`}
                    style={{ fontSize: hp('1.4%') }}>
                    {category}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* CLUBS GRID */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: wp('6%'), paddingBottom: hp('15%') }}>
        <View className="flex-row flex-wrap justify-between">
          {displayedClubs.map(club => {
            const isFollowed = followedClubs.includes(club.id);
            const isLoading = loadingId === club.id;

            return (
              <View key={club.id}
                style={{ width: wp('42%'), marginBottom: hp('2%') }}>
                <View className={`rounded-[20px] border justify-between relative overflow-hidden ${
                    isFollowed ? 'bg-[#0E0E10] border-[#CCF900]/30' : 'bg-[#09090B] border-white/5'
                  }`}
                  style={{ padding: wp('4%'), height: hp('26%') }}>

                  {isFollowed && (
                    <View className="absolute -top-10 -right-10 w-32 h-32 bg-[#CCF900] opacity-5 blur-3xl rounded-full" />
                  )}

                  <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={0.9}
                    onPress={() => router.push(`/clubs/${club.id}`)}
                  >
                    <View>
                      <View className="flex-row justify-between items-start"
                        style={{ marginBottom: hp('2%') }}>
                        <Text style={{ fontSize: hp('3.5%') }}>{club.icon}</Text>
                        {isFollowed && (
                          <View className="bg-[#CCF900]/10 p-1 rounded-full">
                            <Check size={hp('1.5%')} color="#CCF900" strokeWidth={4} />
                          </View>
                        )}
                      </View>

                      <Text className="text-white font-extrabold"
                        style={{ fontSize: hp('2%'), marginBottom: hp('1%') }}>
                        {club.name}
                      </Text>

                      <Text className="text-neutral-500 font-medium"
                        style={{ fontSize: hp('1.3%') }}
                        numberOfLines={3}>
                        {club.description}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => toggleFollow(club.id)}
                    disabled={isLoading}
                    activeOpacity={0.8}
                    className={`w-full rounded-lg items-center justify-center ${
                        isFollowed ? 'bg-white/5 border border-white/10' : 'bg-[#CCF900]'
                      }`}
                    style={{ paddingVertical: hp('1.2%') }}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color={isFollowed ? "white" : "black"} />
                    ) : (
                      <Text className={`font-bold uppercase ${
                          isFollowed ? 'text-white/60' : 'text-black'
                        }`}
                        style={{ fontSize: hp('1.1%') }}>
                        {isFollowed ? 'Following' : 'Follow'}
                      </Text>
                    )}
                  </TouchableOpacity>

                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
