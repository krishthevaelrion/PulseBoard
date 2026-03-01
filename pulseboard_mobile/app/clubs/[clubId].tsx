import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar,
  Alert
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getClubById, toggleFollowClubApi } from "@/src/api/club.api";
import { getUserProfile } from "@/src/api/user.api";
import { fetchEventsByClub } from "@/src/api/event.api"; 
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { ChevronLeft } from 'lucide-react-native';

const clubIcons: Record<number, string> = {
  1: '📈', 2: '💻', 3: '🤖', 4: '👾', 5: '📱',
  6: '⌨️', 7: '🎸', 8: '📸', 9: '🎨', 10: '🎬',
  11: '📐', 12: '🎭', 13: '💼', 14: '💡', 15: '🎮',
};

export default function ClubProfileScreen() {
  const { clubId } = useLocalSearchParams<{ clubId: string }>();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [club, setClub] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isFollowed, setIsFollowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!clubId) return;
    const initData = async () => {
      try {
        const [clubData, profile, eventData] = await Promise.all([
          getClubById(Number(clubId)),
          getUserProfile(),
          fetchEventsByClub(Number(clubId))
        ]);
        setClub(clubData);
        setUser(profile.data || profile);
        setEvents(eventData || []);
        const followingList = profile.following || profile.data?.following || [];
        setIsFollowed(followingList.includes(Number(clubId)));
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [clubId]);

  const handleToggleFollow = async () => {
    if (!clubId) return;
    setActionLoading(true);
    try {
      const res: any = await toggleFollowClubApi(Number(clubId));
      const updatedList = res.following || res.data?.following || [];
      setIsFollowed(updatedList.includes(Number(clubId)));
      const refreshedClub = await getClubById(Number(clubId));
      setClub(refreshedClub);
    } catch (err) { Alert.alert("Error", "Action failed"); }
    finally { setActionLoading(false); }
  };

  if (loading || !club) return (
    <View style={{ flex: 1, backgroundColor: '#050505', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#CCF900" />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#050505' }}>
      <StatusBar barStyle="light-content" />
      
      <View style={{ paddingHorizontal: wp('5%'), paddingTop: hp('2%') }}>
        <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: 'rgba(255,255,255,0.05)', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: wp('6%'), paddingTop: hp('3%'), paddingBottom: hp('5%') }}>
        
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{ width: hp('14%'), height: hp('14%'), borderRadius: hp('7%'), backgroundColor: '#0E0E10', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(204, 249, 0, 0.2)', overflow: 'hidden' }}>
            {club.image ? <Image source={{ uri: club.image }} style={{ width: '100%', height: '100%' }} /> : <Text style={{ fontSize: hp('6%') }}>{clubIcons[club.clubId] || '🔥'}</Text>}
          </View>
          <Text style={{ color: 'white', fontWeight: '900', fontSize: hp('3.5%'), marginTop: 16 }}>{club.name}</Text>
          <View style={{ marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 100, backgroundColor: 'rgba(204, 249, 0, 0.1)', borderWidth: 1, borderColor: 'rgba(204, 249, 0, 0.2)' }}>
            <Text style={{ color: '#CCF900', fontWeight: '900', textTransform: 'uppercase', fontSize: hp('1.2%') }}>{club.category || 'CLUB'}</Text>
          </View>
        </View>

        {/* Join Button */}
        <TouchableOpacity onPress={handleToggleFollow} disabled={actionLoading} style={{ height: hp('7%'), borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: isFollowed ? 'rgba(255,255,255,0.05)' : '#CCF900', borderWidth: isFollowed ? 1 : 0, borderColor: 'rgba(255,255,255,0.1)' }}>
          {actionLoading ? <ActivityIndicator color={isFollowed ? "white" : "black"} /> : <Text style={{ fontWeight: '900', color: isFollowed ? 'white' : 'black' }}>{isFollowed ? 'JOINED' : '+ JOIN CLUB'}</Text>}
        </TouchableOpacity>

        {/* Events Section */}
        <View style={{ marginTop: 40 }}>
          <Text style={{ color: 'white', fontWeight: '900', marginBottom: 16, fontSize: 18 }}>UPCOMING EVENTS</Text>
          {events.length > 0 ? events.map((event: any) => (
            <View key={event._id} style={{ backgroundColor: '#0E0E10', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 28, marginRight: 16 }}>{event.icon || '📅'}</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: event.color || '#CCF900', fontWeight: '900', fontSize: 10, marginRight: 8 }}>{event.badge}</Text>
                  <Text style={{ color: '#737373', fontSize: 10 }}>{event.timeDisplay}</Text>
                </View>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>{event.title}</Text>
                <Text style={{ color: '#52525B', fontSize: 12 }}>{event.location}</Text>
              </View>
            </View>
          )) : <Text style={{ color: '#52525B', textAlign: 'center' }}>No events scheduled.</Text>}
        </View>

        {/* About Us Section */}
        <View style={{ backgroundColor: '#0E0E10', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginTop: 32 }}>
          <Text style={{ color: 'white', fontWeight: '900', marginBottom: 12, textTransform: 'uppercase', fontSize: hp('1.6%') }}>About Us</Text>
          <Text style={{ color: '#A3A3A3', lineHeight: 22, fontSize: hp('1.7%') }}>
            {club.description || "No description provided for this club."}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}