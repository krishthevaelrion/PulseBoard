import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
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
import { ChevronLeft, Check, Calendar } from 'lucide-react-native';

const clubIcons: Record<number, string> = {
  1: '📈', 2: '💻', 3: '🤖', 4: '👾', 5: '📱',
  6: '⌨️', 7: '🎸', 8: '📸', 9: '🎨', 10: '🎬',
  11: '📐', 12: '🎭', 13: '💼', 14: '💡', 15: '🎮',
};

export default function ClubProfileScreen() {
  const { clubId } = useLocalSearchParams<{ clubId: string }>();
  const router = useRouter();
  
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
        setEvents(eventData || []);
        
        const followingList = profile.following || profile.data?.following || [];
        setIsFollowed(followingList.includes(Number(clubId)));
        
      } catch (err) {
        console.error("Initialization error:", err);
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
      
    } catch (err) {
      Alert.alert("Error", "Could not update membership status.");
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !club) {
    return (
      <View style={{ flex: 1, backgroundColor: '#050505', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#CCF900" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#050505' }}>
      <StatusBar barStyle="light-content" />
      
      <View style={{ paddingHorizontal: wp('5%'), paddingTop: hp('2%') }}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <ChevronLeft color="white" size={hp('2.5%')} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: wp('6%'), paddingTop: hp('3%'), paddingBottom: hp('5%') }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{ width: hp('14%'), height: hp('14%'), borderRadius: hp('7%'), backgroundColor: '#0E0E10', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(204, 249, 0, 0.2)' }}>
            <Text style={{ fontSize: hp('6%') }}>{clubIcons[club.clubId] || '🔥'}</Text>
          </View>
          
          <Text style={{ color: 'white', fontWeight: '900', fontSize: hp('3.8%'), marginTop: 16 }}>{club.name}</Text>
          
          {/* FIXED STYLE: Changed px/py to paddingHorizontal/Vertical */}
          <View style={{ marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 100, backgroundColor: 'rgba(204, 249, 0, 0.1)', borderWidth: 1, borderColor: 'rgba(204, 249, 0, 0.2)' }}>
            <Text style={{ color: '#CCF900', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, fontSize: hp('1.2%') }}>
              {club.category || 'CLUB'}
            </Text>
          </View>
          
          <Text style={{ color: '#737373', marginTop: 16, fontWeight: 'bold', fontSize: hp('1.6%') }}>
            {club.following?.length || 0} Members Following
          </Text>
        </View>

        <TouchableOpacity 
          onPress={handleToggleFollow}
          disabled={actionLoading}
          activeOpacity={0.8}
          style={{ 
            height: hp('7%'), 
            borderRadius: 16, 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: isFollowed ? 'rgba(255,255,255,0.05)' : '#CCF900',
            borderWidth: isFollowed ? 1 : 0,
            borderColor: 'rgba(255,255,255,0.1)'
          }}
        >
          {actionLoading ? (
            <ActivityIndicator color={isFollowed ? "white" : "black"} />
          ) : (
            <>
              {isFollowed && <Check size={20} color="white" style={{ marginRight: 8 }} />}
              <Text style={{ fontWeight: '900', textTransform: 'uppercase', color: isFollowed ? 'white' : 'black', fontSize: hp('1.8%') }}>
                {isFollowed ? 'Joined' : '+ Join Club'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ marginTop: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
             <Calendar color="#CCF900" size={18} style={{ marginRight: 8 }} />
             <Text style={{ color: 'white', fontWeight: '900', textTransform: 'uppercase', fontSize: hp('1.8%'), letterSpacing: 1 }}>Upcoming Events</Text>
          </View>

          {events.length > 0 ? (
            events.map((event) => (
              <View 
                key={event._id}
                style={{ backgroundColor: '#0E0E10', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 28, marginRight: 16 }}>{event.icon || '📅'}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ color: '#CCF900', fontWeight: '900', fontSize: 10, marginRight: 8 }}>{event.badge}</Text>
                    <Text style={{ color: '#737373', fontWeight: 'bold', fontSize: 10 }}>{event.timeDisplay}</Text>
                  </View>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>{event.title}</Text>
                  <Text style={{ color: '#52525B', fontSize: 12, marginTop: 2 }}>{event.location}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={{ padding: 24, backgroundColor: '#09090B', borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#27272A', alignItems: 'center' }}>
              <Text style={{ color: '#52525B', fontWeight: 'bold', fontSize: 13 }}>No events scheduled yet.</Text>
            </View>
          )}
        </View>

        <View style={{ backgroundColor: '#0E0E10', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginTop: 32 }}>
          <Text style={{ color: 'white', fontWeight: '900', marginBottom: 12, textTransform: 'uppercase', fontSize: hp('1.6%') }}>About Us</Text>
          <Text style={{ color: '#A3A3A3', lineHeight: 22, fontWeight: '500', fontSize: hp('1.7%') }}>
            {club.description || "No description available for this club."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}