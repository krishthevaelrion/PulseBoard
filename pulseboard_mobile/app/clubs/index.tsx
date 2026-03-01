import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  Platform,
} from 'react-native';
import { Search } from 'lucide-react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { toggleFollowClubApi, getAllClubs } from '@/src/api/club.api';
import { getUserProfile } from '@/src/api/user.api';
import { LinearGradient } from 'expo-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// Component Import
import ClubCard from '@/src/components/ClubCard';

const THEME = {
  ACCENT: '#CCF900',
  ACCENT_GLOW: 'rgba(204, 249, 0, 0.15)',
  BG: '#050505',
  CARD_BG: '#09090B'
};

const clubIcons: Record<number, string> = {
  1: '📈', 2: '💻', 3: '🤖', 4: '👾', 5: '📱',
  6: '⌨️', 7: '🎸', 8: '📸', 9: '🎨', 10: '🎬',
  11: '📐', 12: '🎭', 13: '💼', 14: '💡', 15: '🎮',
};

type UIClub = {
  id: number;
  _id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
};

export default function ClubsScreen() {
  const router = useRouter();
  const [clubs, setClubs] = useState<UIClub[]>([]);
  const [followedClubs, setFollowedClubs] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const fetchClubs = async () => {
    try {
      const data = await getAllClubs();
      const mapped: UIClub[] = data.map((club: any) => ({
        id: club.clubId,
        _id: club._id,
        name: club.name,
        description: club.description,
        category: club.category,
        icon: clubIcons[club.clubId] || '🔥',
      }));
      setClubs(mapped);
    } catch (e) {
      console.error("Fetch clubs error:", e);
    }
  };

  const fetchUserFollowing = async () => {
    try {
      const res: any = await getUserProfile();
      const list = res.following || res.data?.following || [];
      setFollowedClubs(list);
    } catch (e) {
      console.error("Fetch following error:", e);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchClubs();
      await fetchUserFollowing();
      setLoading(false);
    };
    init();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserFollowing();
    }, [])
  );

  const categories = useMemo(() => {
    const unique = Array.from(new Set(clubs.map(c => c.category)));
    return ['all', ...unique];
  }, [clubs]);

  const toggleFollow = async (clubId: number) => {
    setLoadingId(clubId);
    try {
      const res: any = await toggleFollowClubApi(clubId);
      const updatedList = res.following || res.data?.following || [];
      setFollowedClubs(updatedList);
    } catch {
      Alert.alert('Error', 'Could not update follow status');
    } finally {
      setLoadingId(null);
    }
  };

  const displayedClubs = useMemo(() => {
    return clubs.filter(club => {
      const matchesCategory = activeCategory === 'all' || club.category === activeCategory;
      const matchesSearch =
        club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [clubs, activeCategory, searchQuery]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.BG }}>
        <ActivityIndicator size="large" color={THEME.ACCENT} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.BG }}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.BG} />

      {/* HEADER */}
      <View style={{ paddingHorizontal: wp('7%'), paddingTop: hp('3%'), paddingBottom: hp('2%') }}>
        <Text style={{ color: '#737373', fontWeight: 'bold', textTransform: 'uppercase', fontSize: 12, letterSpacing: 3 }}>
          Explore
        </Text>
        <Text style={{ color: 'white', fontWeight: '900', fontSize: 32 }}>
          DIRECTORY
        </Text>
      </View>

      {/* STATS CARD */}
      <View style={{ paddingHorizontal: wp('6%'), marginBottom: 20 }}>
        <View style={{ 
          flexDirection: 'row', 
          backgroundColor: THEME.CARD_BG, 
          borderWidth: 1, 
          borderColor: 'rgba(255,255,255,0.08)', 
          borderRadius: 20, 
          height: 80,
          overflow: 'hidden' 
        }}>
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)' }}>
            <Text style={{ color: '#737373', fontWeight: 'bold', textTransform: 'uppercase', fontSize: 10 }}>Total Clubs</Text>
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 24 }}>{clubs.length}</Text>
          </View>
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20, position: 'relative' }}>
            <LinearGradient colors={[THEME.ACCENT_GLOW, 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
            <Text style={{ color: THEME.ACCENT, fontWeight: 'bold', textTransform: 'uppercase', fontSize: 10 }}>Following</Text>
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 24 }}>{followedClubs.length}</Text>
          </View>
        </View>
      </View>

      {/* SEARCH BAR */}
      <View style={{ paddingHorizontal: wp('6%'), marginBottom: 20 }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          backgroundColor: '#121212', 
          borderWidth: 1, 
          borderColor: 'rgba(255,255,255,0.08)', 
          borderRadius: 12, 
          paddingHorizontal: 15, 
          height: 48 
        }}>
          <Search color={THEME.ACCENT} size={20} />
          <TextInput
            style={{ flex: 1, color: 'white', marginLeft: 10, fontSize: 14 }}
            placeholder="Search for clubs..."
            placeholderTextColor="#52525B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* CATEGORY SELECTOR */}
      <View style={{ marginBottom: 20 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: wp('6%') }}>
          {categories.map(category => {
            const isActive = activeCategory === category;
            return (
              <TouchableOpacity key={category} onPress={() => setActiveCategory(category)} style={{ marginRight: 10 }}>
                <View style={{ 
                  backgroundColor: isActive ? THEME.ACCENT : 'transparent',
                  borderWidth: 1,
                  borderColor: isActive ? THEME.ACCENT : 'rgba(255,255,255,0.15)',
                  borderRadius: 100,
                  paddingHorizontal: 20,
                  paddingVertical: 8
                }}>
                  <Text style={{ 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase', 
                    fontSize: 12,
                    color: isActive ? 'black' : '#A3A3A3' 
                  }}>
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
        contentContainerStyle={{ 
          paddingHorizontal: wp('4%'), 
          paddingBottom: 100,
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between'
        }}
      >
        {displayedClubs.length > 0 ? (
          displayedClubs.map(club => (
            <ClubCard
              key={club.id}
              icon={club.icon}
              name={club.name}
              description={club.description}
              isFollowed={followedClubs.includes(club.id)}
              isLoading={loadingId === club.id}
              onCardPress={() => router.push(`/clubs/${club.id}`)}
              onFollowPress={() => toggleFollow(club.id)}
            />
          ))
        ) : (
          <View style={{ width: '100%', alignItems: 'center', marginTop: 50 }}>
            <Text style={{ color: '#52525B', fontSize: 16, fontWeight: '500' }}>No clubs found matching your search.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}