import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  SafeAreaView, StatusBar, ActivityIndicator, Platform, StyleSheet 
} from 'react-native';
import { 
  Menu, Calendar, PlayCircle, MapPin, LogOut, 
  X, Grid, Users, Box, Siren, Target, Briefcase, Settings, ChevronRight
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router'; 
import { getEventFeed } from '../../src/api/event.api'; 
import { getUserProfile } from '../../src/api/user.api';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { LinearGradient } from 'expo-linear-gradient'; 
import { MotiView, AnimatePresence } from 'moti'; 
import { Easing } from 'react-native-reanimated'; // Import Easing for precise control

const THEME_ACCENT = '#CCF900'; 

// Utility for RGBA conversion
const getRgba = (hex: string, opacity: number) => {
    if(!hex) return `rgba(255, 255, 255, ${opacity})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// --- OPTIMIZED COMPONENT: Memoized Sidebar Item ---
const SidebarItem = React.memo(({ icon: Icon, label, color, index, onPress, isAlert }: any) => (
  <MotiView
    from={{ opacity: 0, translateX: 20 }}
    animate={{ opacity: 1, translateX: 0 }}
    // FASTER ITEM ENTRY: 300ms duration, less delay
    transition={{ type: 'timing', duration: 300, delay: index * 30, easing: Easing.out(Easing.quad) }} 
    style={{ marginBottom: hp('1.2%') }}
  >
    <TouchableOpacity 
      activeOpacity={0.6}
      onPress={onPress}
      style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingVertical: hp('1.6%'),
        paddingHorizontal: wp('4%'),
        backgroundColor: '#0F0F0F', 
        borderRadius: 18,
        borderWidth: 1,
        borderColor: isAlert ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.08)',
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1, 
        shadowRadius: 8,
        elevation: 2
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Icon with Theme Background Wash */}
        <View style={{ 
            width: wp('10%'), height: wp('10%'), 
            borderRadius: 12, 
            backgroundColor: getRgba(color, 0.1), 
            alignItems: 'center', justifyContent: 'center',
            marginRight: wp('3.5%'),
            borderWidth: 1,
            borderColor: getRgba(color, 0.15)
        }}>
          <Icon color={color} size={hp('2%')} />
        </View>
        
        <Text style={{ color: isAlert ? '#EF4444' : '#E5E5E5', fontSize: hp('1.7%'), fontWeight: '600', letterSpacing: 0.3 }}>
          {label}
        </Text>
      </View>
      
      {!isAlert && <ChevronRight color="#333" size={hp('1.8%')} />}
    </TouchableOpacity>
  </MotiView>
));

const SectionHeader = React.memo(({ title, icon: Icon, color = "white" }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: wp('6%'), marginBottom: hp('2.5%'), marginTop: hp('1%') }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp('3%') }}>
      {Icon && <Icon color={color} size={hp('2.5%')} />}
      <Text style={{ color: 'white', fontSize: hp('2%'), fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>
        {title}
      </Text>
    </View>
  </View>
));

export default function HomeScreen() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- REAL USER STATE
  const [user, setUser] = useState({
    name: "Loading...",  
    following: [],       
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      if (events.length === 0) setLoading(true);
      const [userData, eventData] = await Promise.all([
        getUserProfile(),
        getEventFeed()
      ]);
      const followingList = userData.following || userData.data?.following || [];
      setUser({ name: userData.name, following: followingList });
      setEvents(eventData);
    } catch (err) {
      console.log("Failed to load home data", err);
    } finally {
      setLoading(false);
    }
  };

  const sortEventsByFollowing = (eventsList: any[]) => {
    return [...eventsList].sort((a, b) => {
      const aFollowed = (user as any).following.includes(a.clubId);
      const bFollowed = (user as any).following.includes(b.clubId);
      if (aFollowed && !bFollowed) return -1;
      if (!aFollowed && bFollowed) return 1;
      return 0;
    });
  };

  const liveEvents = useMemo(() => 
    sortEventsByFollowing(events.filter((e: any) => e.badge === 'LIVE')), 
  [(user as any).following, events]);

  const upcomingEvents = useMemo(() => 
    sortEventsByFollowing(events.filter((e: any) => e.badge === 'UPCOMING')), 
  [(user as any).following, events]);

  if (loading && events.length === 0) {
    return (
      <View className="flex-1 bg-[#050505] justify-center items-center">
        <ActivityIndicator size="large" color={THEME_ACCENT} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#050505]">
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      <SafeAreaView className="flex-1" style={{ paddingTop: Platform.OS === 'android' ? hp('1%') : 0 }}>
        
        {/* Header */}
        <View style={{ paddingHorizontal: wp('7%'), paddingTop: hp('3%'), paddingBottom: hp('3%'), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: '#737373', fontWeight: 'bold', fontSize: hp('1.5%'), letterSpacing: 3, textTransform: 'uppercase', marginBottom: hp('0.5%') }}>
              Welcome Back
            </Text>
            <Text style={{ color: 'white', fontSize: hp('3.7%'), fontWeight: '900', letterSpacing: -1 }}>
              {(user as any).name.split(' ')[0]}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: wp('4%') }}>
             <TouchableOpacity 
                onPress={() => setShowSidebar(true)} 
                activeOpacity={0.7}
                style={{ width: wp('12%'), height: wp('12%'), backgroundColor: '#121212', borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: hp('1.5%'), borderWidth: 1, borderColor: '#222' }}
             >
              <Menu color="white" size={hp('2.5%')} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1" contentContainerStyle={{ paddingBottom: hp('5%') }}>
          
          {/* LIVE NOW */}
          <SectionHeader title="Happening Now" icon={PlayCircle} color={THEME_ACCENT} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: wp('6%') }} style={{ marginBottom: hp('5%') }}>
            {liveEvents.map((event: any) => {
              const isFollowed = (user as any).following.includes(event.clubId);
              const cardColor = event.color || THEME_ACCENT; 
              return (
                <TouchableOpacity 
                  key={event._id} 
                  activeOpacity={0.8}
                  style={{ width: wp('55%'), height: hp('32%'), backgroundColor: '#121212', borderRadius: 32, marginRight: wp('4%'), padding: wp('5%'), justifyContent: 'space-between', overflow: 'hidden', borderWidth: isFollowed ? 1 : 0, borderColor: isFollowed ? getRgba(cardColor, 0.4) : 'transparent' }}
                >
                  {isFollowed ? (
                      <View style={{ position: 'absolute', right: -40, top: -40, width: wp('40%'), height: wp('40%'), borderRadius: 999, backgroundColor: getRgba(cardColor, 0.2), opacity: 0.5 }} className="blur-3xl" />
                  ) : (
                      <View style={{ position: 'absolute', right: -40, top: -40, width: wp('30%'), height: wp('30%'), backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 999 }} className="blur-3xl" />
                  )}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ paddingHorizontal: wp('3%'), paddingVertical: hp('0.5%'), borderRadius: 999, borderWidth: 1, backgroundColor: getRgba(cardColor, 0.2), borderColor: getRgba(cardColor, 0.3) }}>
                      <Text style={{ fontSize: hp('1.2%'), fontWeight: '900', letterSpacing: 2, color: cardColor }}>LIVE</Text>
                    </View>
                    <Text style={{ fontSize: hp('3.5%') }}>{event.icon}</Text>
                  </View>
                  <View>
                      <Text style={{ color: '#737373', fontSize: hp('1.2%'), fontWeight: 'bold', letterSpacing: 2, marginBottom: hp('0.5%'), textTransform: 'uppercase' }}>{event.clubName}</Text>
                    <Text style={{ color: 'white', fontSize: hp('2.8%'), fontWeight: '900', lineHeight: hp('3.2%'), marginBottom: hp('1%') }} numberOfLines={2}>{event.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: hp('0.5%') }}>
                      <MapPin size={hp('1.5%')} color="#666" />
                      <Text style={{ color: '#A3A3A3', fontSize: hp('1.4%'), fontWeight: 'bold', marginLeft: wp('1%') }}>{event.location}</Text>
                    </View>
                  </View>
                  <View style={{ width: '100%', height: hp('5%'), borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: hp('1%'), backgroundColor: cardColor }}>
                    <Text style={{ color: 'black', fontWeight: 'bold', fontSize: hp('1.4%'), textTransform: 'uppercase', letterSpacing: 1 }}>Join Now</Text>
                  </View>
                </TouchableOpacity>
            )})}
          </ScrollView>

          {/* UPCOMING */}
          <SectionHeader title="Coming Up" icon={Calendar} color="#A0A0A0" />
          <View style={{ paddingHorizontal: wp('6%'), marginBottom: hp('5%'), gap: hp('1.5%') }}>
            {upcomingEvents.map((event: any) => {
               const isFollowed = (user as any).following.includes(event.clubId);
               const cardColor = event.color || '#fff';
               const dateObj = new Date(event.date);
               const day = dateObj.getDate();
               const month = dateObj.toLocaleString('default', { month: 'short' });
               return (
                <TouchableOpacity key={event._id} activeOpacity={0.7} style={{ width: '100%', backgroundColor: '#121212', borderRadius: 24, padding: wp('4%'), flexDirection: 'row', alignItems: 'center', borderWidth: isFollowed ? 1 : 0, borderColor: isFollowed ? getRgba(cardColor, 0.3) : 'transparent' }}>
                  <View style={{ width: wp('16%'), height: wp('16%'), borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: wp('4%'), backgroundColor: isFollowed ? getRgba(cardColor, 0.1) : '#1A1A1A' }}>
                    <Text style={{ fontSize: hp('1.2%'), fontWeight: '900', textTransform: 'uppercase', marginBottom: 2, color: isFollowed ? cardColor : '#737373' }}>{month}</Text>
                    <Text style={{ color: 'white', fontSize: hp('2.5%'), fontWeight: '900' }}>{day}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'white', fontSize: hp('2%'), fontWeight: 'bold', marginBottom: hp('0.5%') }}>{event.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: hp('1.4%'), fontWeight: 'bold', marginRight: wp('2%'), color: cardColor }}>{event.timeDisplay}</Text>
                      <Text style={{ color: '#52525B', fontSize: hp('1.4%'), fontWeight: 'bold' }}>@ {event.location}</Text>
                    </View>
                  </View>
                  <View style={{ width: wp('10%'), height: wp('10%'), borderRadius: 999, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', borderColor: '#262626', borderWidth: 1 }}>
                    <Text style={{ fontSize: hp('2.2%') }}>{event.icon}</Text>
                  </View>
                </TouchableOpacity>
            )})}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* --- THE PERFECT SIDEBAR --- */}
      <AnimatePresence>
        {showSidebar && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 50 }]}>
            
            {/* Backdrop */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: 250 }}
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
            >
              <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowSidebar(false)} />
            </MotiView>
            
            {/* Sliding Sidebar */}
            <MotiView 
               from={{ translateX: wp('100%') }}
               animate={{ translateX: 0 }}
               exit={{ translateX: wp('100%') }}
               // FAST & PRECISE: 'timing' ensures no overshoot/bounce
               transition={{ type: 'timing', duration: 250, easing: Easing.out(Easing.quad) }}
               style={{ 
                 position: 'absolute', right: 0, top: 0, bottom: 0,
                 width: wp('82%'), backgroundColor: '#050505',
                 borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                 shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 30, elevation: 20
               }}
            >
               <LinearGradient 
                  colors={[getRgba(THEME_ACCENT, 0.05), 'transparent']} 
                  start={{ x: 1, y: 0 }} 
                  end={{ x: 0, y: 1 }} 
                  style={StyleSheet.absoluteFill} 
               />

               <SafeAreaView style={{ flex: 1 }}>
                  {/* Sidebar Header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: wp('6%'), paddingTop: hp('3%'), marginBottom: hp('3%') }}>
                      <Text style={{ color: 'white', fontSize: hp('2.8%'), fontWeight: '900', letterSpacing: -0.5 }}>Command Center</Text>
                      <TouchableOpacity onPress={() => setShowSidebar(false)} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                          <X color="#fff" size={hp('2.2%')} />
                      </TouchableOpacity>
                  </View>

                  {/* User Profile Snippet */}
                  <View style={{ paddingHorizontal: wp('6%'), marginBottom: hp('4%') }}>
                    <View style={{ padding: wp('4%'), borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', alignItems: 'center' }}>
                       <View style={{ width: wp('12%'), height: wp('12%'), borderRadius: 999, backgroundColor: THEME_ACCENT, alignItems: 'center', justifyContent: 'center', marginRight: wp('4%') }}>
                          <Text style={{ fontSize: hp('2.5%'), fontWeight: '900', color: 'black' }}>{(user as any).name.charAt(0)}</Text>
                       </View>
                       <View>
                          <Text style={{ color: 'white', fontSize: hp('2%'), fontWeight: 'bold' }}>{(user as any).name.split(' ')[0]}</Text>
                          <Text style={{ color: THEME_ACCENT, fontSize: hp('1.3%'), fontWeight: 'bold', marginTop: 2, letterSpacing: 0.5 }}>BTech '29</Text>
                       </View>
                    </View>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: wp('6%') }}>
                      
                      {/* Section 1: Logistics */}
                      <Text style={{ color: '#52525B', fontSize: hp('1.3%'), fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: hp('1.5%'), marginLeft: 4 }}>Campus Grid</Text>
                      <SidebarItem index={1} icon={Grid} label="LHC Heatmap" color="#6366F1" />
                      <SidebarItem index={2} icon={Users} label="Faculty Directory" color="#38BDF8" />
                      <SidebarItem index={3} icon={Box} label="Lost & Found" color="#FACC15" />
                      <SidebarItem index={4} icon={Siren} label="S.O.S Protocol" color="#F87171" isAlert={true} />

                      {/* Section 2: Tools */}
                      <Text style={{ color: '#52525B', fontSize: hp('1.3%'), fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: hp('2.5%'), marginBottom: hp('1.5%'), marginLeft: 4 }}>Telemetry</Text>
                      <SidebarItem index={5} icon={Target} label="Deadline Radar" color="#2DD4BF" />
                      <SidebarItem index={6} icon={Briefcase} label="Placement Vault" color="#34D399" />

                      {/* Section 3: Preferences (ADDED BACK) */}
                      <Text style={{ color: '#52525B', fontSize: hp('1.3%'), fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: hp('2.5%'), marginBottom: hp('1.5%'), marginLeft: 4 }}>System</Text>
                      <SidebarItem index={7} icon={Settings} label="Settings" color="#A1A1AA" onPress={() => {/* Navigate to settings */}} />

                      <View style={{ height: hp('5%') }} /> 
                  </ScrollView>

                  {/* Footer: Logout */}
                  <View style={{ paddingHorizontal: wp('6%'), paddingBottom: hp('4%') }}>
                     <TouchableOpacity onPress={() => router.replace('/')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: hp('2%'), borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                        <LogOut color="#EF4444" size={hp('2%')} />
                        <Text style={{ color: '#EF4444', fontSize: hp('1.6%'), fontWeight: '700', marginLeft: wp('2%') }}>LOG OUT</Text>
                     </TouchableOpacity>
                  </View>
               </SafeAreaView>
            </MotiView>
          </View>
        )}
      </AnimatePresence>
    </View>
  );
}